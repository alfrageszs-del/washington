-- =====================================================
-- HOTFIX MIGRATION: align DB with frontend expectations
-- =====================================================
-- 1) Add missing notes column to fines
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fines' AND column_name = 'notes'
    ) THEN
        ALTER TABLE fines ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2) Ensure gov_acts and court_acts have status column using act_status_enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gov_acts' AND column_name = 'status'
    ) THEN
        ALTER TABLE gov_acts ADD COLUMN status act_status_enum DEFAULT 'DRAFT'::act_status_enum;
    ELSIF (SELECT data_type FROM information_schema.columns WHERE table_name='gov_acts' AND column_name='status') <> 'USER-DEFINED' THEN
        -- Convert text to enum if safe
        IF NOT EXISTS (
            SELECT 1 FROM gov_acts WHERE status IS NOT NULL AND UPPER(status) NOT IN ('DRAFT','PUBLISHED','ARCHIVED')
        ) THEN
            ALTER TABLE gov_acts ADD COLUMN status_new act_status_enum;
            UPDATE gov_acts SET status_new = UPPER(status)::act_status_enum;
            ALTER TABLE gov_acts DROP COLUMN status;
            ALTER TABLE gov_acts RENAME COLUMN status_new TO status;
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'court_acts' AND column_name = 'status'
    ) THEN
        ALTER TABLE court_acts ADD COLUMN status act_status_enum DEFAULT 'DRAFT'::act_status_enum;
    ELSIF (SELECT data_type FROM information_schema.columns WHERE table_name='court_acts' AND column_name='status') <> 'USER-DEFINED' THEN
        IF NOT EXISTS (
            SELECT 1 FROM court_acts WHERE status IS NOT NULL AND UPPER(status) NOT IN ('DRAFT','PUBLISHED','ARCHIVED')
        ) THEN
            ALTER TABLE court_acts ADD COLUMN status_new act_status_enum;
            UPDATE court_acts SET status_new = UPPER(status)::act_status_enum;
            ALTER TABLE court_acts DROP COLUMN status;
            ALTER TABLE court_acts RENAME COLUMN status_new TO status;
        END IF;
    END IF;
END $$;

-- 3) Ensure court_sessions has required columns used by UI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='court_sessions' AND column_name='created_by'
    ) THEN
        ALTER TABLE court_sessions ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='court_sessions' AND column_name='status'
    ) THEN
        ALTER TABLE court_sessions ADD COLUMN status TEXT DEFAULT 'scheduled';
    END IF;
END $$;

-- 4) Ensure role_change_requests columns as used by UI exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='role_change_requests' AND column_name='current_value'
    ) THEN
        ALTER TABLE role_change_requests ADD COLUMN current_value TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='role_change_requests' AND column_name='requested_value'
    ) THEN
        ALTER TABLE role_change_requests ADD COLUMN requested_value TEXT;
    END IF;
END $$;

-- 5) Add optional source_url to fines (used by UI)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='fines' AND column_name='source_url'
    ) THEN
        ALTER TABLE fines ADD COLUMN source_url TEXT;
    END IF;
END $$;

-- 6) Extend inspections to support richer UI fields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='inspector_id'
    ) THEN
        ALTER TABLE inspections ADD COLUMN inspector_id UUID REFERENCES profiles(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='title'
    ) THEN
        ALTER TABLE inspections ADD COLUMN title TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='target_entity'
    ) THEN
        ALTER TABLE inspections ADD COLUMN target_entity TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='start_date'
    ) THEN
        ALTER TABLE inspections ADD COLUMN start_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='end_date'
    ) THEN
        ALTER TABLE inspections ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='findings'
    ) THEN
        ALTER TABLE inspections ADD COLUMN findings TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='recommendations'
    ) THEN
        ALTER TABLE inspections ADD COLUMN recommendations TEXT;
    END IF;
END $$;

-- 7) Recreate auth.users -> public.profiles trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord   TEXT;
    user_faction   TEXT;
    user_full_name TEXT;
BEGIN
    -- Extract metadata with fallbacks
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord   := NEW.raw_user_meta_data->>'discord';
    user_faction   := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', user_nickname);

    -- Normalize faction to supported set if needed
    user_faction := CASE UPPER(user_faction)
        WHEN 'CIVILIAN' THEN 'CIVILIAN'
        WHEN 'GOV'      THEN 'GOV'
        WHEN 'COURT'    THEN 'COURT'
        WHEN 'WN'       THEN 'WN'
        WHEN 'FIB'      THEN 'FIB'
        WHEN 'LSPD'     THEN 'LSPD'
        WHEN 'LSCSD'    THEN 'LSCSD'
        WHEN 'EMS'      THEN 'EMS'
        WHEN 'SANG'     THEN 'SANG'
        ELSE 'CIVILIAN'
    END;

    -- Insert profile if not exists
    INSERT INTO public.profiles (
        id,
        email,
        nickname,
        discord,
        full_name,
        static_id,
        faction,
        gov_role,
        is_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_nickname,
        user_discord,
        user_full_name,
        user_static_id,
        user_faction,
        'NONE',
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

