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

