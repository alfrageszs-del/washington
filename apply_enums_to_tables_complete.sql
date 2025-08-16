-- =====================================================
-- ПРИМЕНЕНИЕ ENUM'ОВ К ТАБЛИЦАМ WASHINGTON (ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ)
-- =====================================================
-- Этот файл автоматически применяет созданные ENUM'ы ко всем таблицам
-- Запускать ПОСЛЕ database_enums.sql

-- =====================================================
-- 1. ВРЕМЕННО УДАЛЯЕМ RLS ПОЛИТИКИ
-- =====================================================

-- Удаляем политики для appointments
DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;

-- Удаляем политики для verification_requests
DROP POLICY IF EXISTS "Users can view verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON verification_requests;

-- Удаляем политики для role_change_requests
DROP POLICY IF EXISTS "Users can view role change requests" ON role_change_requests;
DROP POLICY IF EXISTS "Users can create role change requests" ON role_change_requests;
DROP POLICY IF EXISTS "Admins can update role change requests" ON role_change_requests;

-- Удаляем политики для warrants
DROP POLICY IF EXISTS "Users can view warrants" ON warrants;
DROP POLICY IF EXISTS "Authorized users can create warrants" ON warrants;
DROP POLICY IF EXISTS "Authorized users can update warrants" ON warrants;

-- Удаляем политики для cases
DROP POLICY IF EXISTS "Users can view cases" ON cases;
DROP POLICY IF EXISTS "Authorized users can create cases" ON cases;
DROP POLICY IF EXISTS "Users can update own cases" ON cases;

-- Удаляем политики для court_sessions
DROP POLICY IF EXISTS "Users can view court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Authorized users can create court sessions" ON court_sessions;

-- Удаляем политики для fines
DROP POLICY IF EXISTS "Users can view fines" ON fines;
DROP POLICY IF EXISTS "Authorized users can create fines" ON fines;

-- Удаляем политики для gov_acts
DROP POLICY IF EXISTS "Users can view government acts" ON gov_acts;
DROP POLICY IF EXISTS "Authorized users can create government acts" ON gov_acts;

-- Удаляем политики для court_acts
DROP POLICY IF EXISTS "Users can view court acts" ON court_acts;
DROP POLICY IF EXISTS "Authorized users can create court acts" ON court_acts;

-- Удаляем политики для inspections
DROP POLICY IF EXISTS "Users can view inspections" ON inspections;
DROP POLICY IF EXISTS "Authorized users can create inspections" ON inspections;

-- Удаляем политики для lawyer_requests
DROP POLICY IF EXISTS "Users can view lawyer requests" ON lawyer_requests;
DROP POLICY IF EXISTS "Users can create lawyer requests" ON lawyer_requests;
DROP POLICY IF EXISTS "Admins can update lawyer requests" ON lawyer_requests;

-- Удаляем политики для lawyer_contracts
DROP POLICY IF EXISTS "Users can view lawyer contracts" ON lawyer_contracts;
DROP POLICY IF EXISTS "Users can create lawyer contracts" ON lawyer_contracts;
DROP POLICY IF EXISTS "Admins can update lawyer contracts" ON lawyer_contracts;

-- =====================================================
-- 2. ОБНОВЛЕНИЕ ТАБЛИЦЫ PROFILES
-- =====================================================

-- Обновляем faction с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'faction' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE faction IS NOT NULL 
            AND faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')
        ) THEN
            ALTER TABLE profiles ADD COLUMN faction_new faction_enum;
            UPDATE profiles SET faction_new = faction::faction_enum WHERE faction IS NOT NULL;
            ALTER TABLE profiles DROP COLUMN faction;
            ALTER TABLE profiles RENAME COLUMN faction_new TO faction;
            RAISE NOTICE 'Колонка profiles.faction успешно обновлена на faction_enum';
        ELSE
            RAISE NOTICE 'В profiles.faction найдены значения, не соответствующие faction_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем gov_role с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'gov_role' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE gov_role IS NOT NULL 
            AND gov_role NOT IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        ) THEN
            ALTER TABLE profiles ADD COLUMN gov_role_new gov_role_enum;
            UPDATE profiles SET gov_role_new = gov_role::gov_role_enum WHERE gov_role IS NOT NULL;
            ALTER TABLE profiles DROP COLUMN gov_role;
            ALTER TABLE profiles RENAME COLUMN gov_role_new TO gov_role;
            RAISE NOTICE 'Колонка profiles.gov_role успешно обновлена на gov_role_enum';
        ELSE
            RAISE NOTICE 'В profiles.gov_role найдены значения, не соответствующие gov_role_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем leader_role с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'leader_role' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE leader_role IS NOT NULL 
            AND leader_role NOT IN ('GOVERNOR', 'DIRECTOR_WN', 'DIRECTOR_FIB', 'CHIEF_LSPD', 'SHERIFF_LSCSD', 'CHIEF_EMS', 'COLONEL_SANG')
        ) THEN
            ALTER TABLE profiles ADD COLUMN leader_role_new leader_role_enum;
            UPDATE profiles SET leader_role_new = leader_role::leader_role_enum WHERE leader_role IS NOT NULL;
            ALTER TABLE profiles DROP COLUMN leader_role;
            ALTER TABLE profiles RENAME COLUMN leader_role_new TO leader_role;
            RAISE NOTICE 'Колонка profiles.leader_role успешно обновлена на leader_role_enum';
        ELSE
            RAISE NOTICE 'В profiles.leader_role найдены значения, не соответствующие leader_role_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем office_role с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'office_role' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE office_role IS NOT NULL 
            AND office_role NOT IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')
        ) THEN
            ALTER TABLE profiles ADD COLUMN office_role_new department_enum;
            UPDATE profiles SET office_role_new = office_role::department_enum WHERE office_role IS NOT NULL;
            ALTER TABLE profiles DROP COLUMN office_role;
            ALTER TABLE profiles RENAME COLUMN office_role_new TO office_role;
            RAISE NOTICE 'Колонка profiles.office_role успешно обновлена на department_enum';
        ELSE
            RAISE NOTICE 'В profiles.office_role найдены значения, не соответствующие department_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 3. ОБНОВЛЕНИЕ ОСТАЛЬНЫХ ТАБЛИЦ
-- =====================================================

-- Обновляем appointments.department
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'department' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE department IS NOT NULL 
            AND department NOT IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')
        ) THEN
            ALTER TABLE appointments ADD COLUMN department_new department_enum;
            UPDATE appointments SET department_new = department::department_enum WHERE department IS NOT NULL;
            ALTER TABLE appointments DROP COLUMN department;
            ALTER TABLE appointments RENAME COLUMN department_new TO department;
            RAISE NOTICE 'Колонка appointments.department успешно обновлена на department_enum';
        ELSE
            RAISE NOTICE 'В appointments.department найдены значения, не соответствующие department_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем appointments.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED')
        ) THEN
            ALTER TABLE appointments ADD COLUMN status_new appointment_status_enum;
            UPDATE appointments SET status_new = status::appointment_status_enum WHERE status IS NOT NULL;
            ALTER TABLE appointments DROP COLUMN status;
            ALTER TABLE appointments RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка appointments.status успешно обновлена на appointment_status_enum';
        ELSE
            RAISE NOTICE 'В appointments.status найдены значения, не соответствующие appointment_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем verification_requests.kind
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'kind' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE kind IS NOT NULL 
            AND kind NOT IN ('FACTION_MEMBER', 'PROSECUTOR', 'JUDGE')
        ) THEN
            ALTER TABLE verification_requests ADD COLUMN kind_new verification_kind_enum;
            UPDATE verification_requests SET kind_new = kind::verification_kind_enum WHERE kind IS NOT NULL;
            ALTER TABLE verification_requests DROP COLUMN kind;
            ALTER TABLE verification_requests RENAME COLUMN kind_new TO kind;
            RAISE NOTICE 'Колонка verification_requests.kind успешно обновлена на verification_kind_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.kind найдены значения, не соответствующие verification_kind_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем verification_requests.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE verification_requests ADD COLUMN status_new verification_status_enum;
            UPDATE verification_requests SET status_new = status::verification_status_enum WHERE status IS NOT NULL;
            ALTER TABLE verification_requests DROP COLUMN status;
            ALTER TABLE verification_requests RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка verification_requests.status успешно обновлена на verification_status_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.status найдены значения, не соответствующие verification_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем role_change_requests.request_type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'role_change_requests' AND column_name = 'request_type' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM role_change_requests 
            WHERE request_type IS NOT NULL 
            AND request_type NOT IN ('FACTION', 'GOV_ROLE', 'LEADER_ROLE', 'OFFICE_ROLE')
        ) THEN
            ALTER TABLE role_change_requests ADD COLUMN request_type_new role_change_request_type_enum;
            UPDATE role_change_requests SET request_type_new = request_type::role_change_request_type_enum WHERE request_type IS NOT NULL;
            ALTER TABLE role_change_requests DROP COLUMN request_type;
            ALTER TABLE role_change_requests RENAME COLUMN request_type_new TO request_type;
            RAISE NOTICE 'Колонка role_change_requests.request_type успешно обновлена на role_change_request_type_enum';
        ELSE
            RAISE NOTICE 'В role_change_requests.request_type найдены значения, не соответствующие role_change_request_type_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем role_change_requests.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'role_change_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM role_change_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE role_change_requests ADD COLUMN status_new role_change_request_status_enum;
            UPDATE role_change_requests SET status_new = status::role_change_request_status_enum WHERE status IS NOT NULL;
            ALTER TABLE role_change_requests DROP COLUMN status;
            ALTER TABLE role_change_requests RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка role_change_requests.status успешно обновлена на role_change_request_status_enum';
        ELSE
            RAISE NOTICE 'В role_change_requests.status найдены значения, не соответствующие role_change_request_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем warrants.warrant_type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'warrants' AND column_name = 'warrant_type' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM warrants 
            WHERE warrant_type IS NOT NULL 
            AND warrant_type NOT IN ('AS', 'S', 'A')
        ) THEN
            ALTER TABLE warrants ADD COLUMN warrant_type_new warrant_type_enum;
            UPDATE warrants SET warrant_type_new = warrant_type::warrant_type_enum WHERE warrant_type IS NOT NULL;
            ALTER TABLE warrants DROP COLUMN warrant_type;
            ALTER TABLE warrants RENAME COLUMN warrant_type_new TO warrant_type;
            RAISE NOTICE 'Колонка warrants.warrant_type успешно обновлена на warrant_type_enum';
        ELSE
            RAISE NOTICE 'В warrants.warrant_type найдены значения, не соответствующие warrant_type_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем warrants.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'warrants' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM warrants 
            WHERE status IS NOT NULL 
            AND status NOT IN ('active', 'executed', 'expired', 'cancelled')
        ) THEN
            ALTER TABLE warrants ADD COLUMN status_new warrant_status_enum;
            UPDATE warrants SET status_new = status::warrant_status_enum WHERE status IS NOT NULL;
            ALTER TABLE warrants DROP COLUMN status;
            ALTER TABLE warrants RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка warrants.status успешно обновлена на warrant_status_enum';
        ELSE
            RAISE NOTICE 'В warrants.status найдены значения, не соответствующие warrant_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем fines.issuer_faction
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fines' AND column_name = 'issuer_faction' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM fines 
            WHERE issuer_faction IS NOT NULL 
            AND issuer_faction NOT IN ('WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')
        ) THEN
            ALTER TABLE fines ADD COLUMN issuer_faction_new faction_enum;
            UPDATE fines SET issuer_faction_new = issuer_faction::faction_enum WHERE issuer_faction IS NOT NULL;
            ALTER TABLE fines DROP COLUMN issuer_faction;
            ALTER TABLE fines RENAME COLUMN issuer_faction_new TO issuer_faction;
            RAISE NOTICE 'Колонка fines.issuer_faction успешно обновлена на faction_enum';
        ELSE
            RAISE NOTICE 'В fines.issuer_faction найдены значения, не соответствующие faction_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем fines.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fines' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM fines 
            WHERE status IS NOT NULL 
            AND status NOT IN ('UNPAID', 'PAID', 'CANCELLED')
        ) THEN
            ALTER TABLE fines ADD COLUMN status_new fine_status_enum;
            UPDATE fines SET status_new = status::fine_status_enum WHERE status IS NOT NULL;
            ALTER TABLE fines DROP COLUMN status;
            ALTER TABLE fines RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка fines.status успешно обновлена на fine_status_enum';
        ELSE
            RAISE NOTICE 'В fines.status найдены значения, не соответствующие fine_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем gov_acts.status (если колонка существует)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'gov_acts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM gov_acts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')
        ) THEN
            ALTER TABLE gov_acts ADD COLUMN status_new act_status_enum;
            UPDATE gov_acts SET status_new = status::act_status_enum WHERE status IS NOT NULL;
            ALTER TABLE gov_acts DROP COLUMN status;
            ALTER TABLE gov_acts RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка gov_acts.status успешно обновлена на act_status_enum';
        ELSE
            RAISE NOTICE 'В gov_acts.status найдены значения, не соответствующие act_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем court_acts.status (если колонка существует)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'court_acts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM court_acts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')
        ) THEN
            ALTER TABLE court_acts ADD COLUMN status_new act_status_enum;
            UPDATE court_acts SET status_new = status::act_status_enum WHERE status IS NOT NULL;
            ALTER TABLE court_acts DROP COLUMN status;
            ALTER TABLE court_acts RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка court_acts.status успешно обновлена на act_status_enum';
        ELSE
            RAISE NOTICE 'В court_acts.status найдены значения, не соответствующие act_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем cases.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'cases' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM cases 
            WHERE status IS NOT NULL 
            AND status NOT IN ('open', 'in_progress', 'closed', 'archived')
        ) THEN
            ALTER TABLE cases ADD COLUMN status_new case_status_enum;
            UPDATE cases SET status_new = status::case_status_enum WHERE status IS NOT NULL;
            ALTER TABLE cases DROP COLUMN status;
            ALTER TABLE cases RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка cases.status успешно обновлена на case_status_enum';
        ELSE
            RAISE NOTICE 'В cases.status найдены значения, не соответствующие case_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем court_sessions.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'court_sessions' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM court_sessions 
            WHERE status IS NOT NULL 
            AND status NOT IN ('open', 'in_progress', 'closed', 'archived')
        ) THEN
            ALTER TABLE court_sessions ADD COLUMN status_new case_status_enum;
            UPDATE court_sessions SET status_new = status::case_status_enum WHERE status IS NOT NULL;
            ALTER TABLE court_sessions DROP COLUMN status;
            ALTER TABLE court_sessions RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка court_sessions.status успешно обновлена на case_status_enum';
        ELSE
            RAISE NOTICE 'В court_sessions.status найдены значения, не соответствующие case_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем lawyers.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyers' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyers 
            WHERE status IS NOT NULL 
            AND status NOT IN ('ACTIVE', 'SUSPENDED', 'REVOKED')
        ) THEN
            ALTER TABLE lawyers ADD COLUMN status_new lawyer_status_enum;
            UPDATE lawyers SET status_new = status::lawyer_status_enum WHERE status IS NOT NULL;
            ALTER TABLE lawyers DROP COLUMN status;
            ALTER TABLE lawyers RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка lawyers.status успешно обновлена на lawyer_status_enum';
        ELSE
            RAISE NOTICE 'В lawyers.status найдены значения, не соответствующие lawyer_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем lawyer_requests.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyer_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyer_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE lawyer_requests ADD COLUMN status_new verification_status_enum;
            UPDATE lawyer_requests SET status_new = status::verification_status_enum WHERE status IS NOT NULL;
            ALTER TABLE lawyer_requests DROP COLUMN status;
            ALTER TABLE lawyer_requests RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка lawyer_requests.status успешно обновлена на verification_status_enum';
        ELSE
            RAISE NOTICE 'В lawyer_requests.status найдены значения, не соответствующие verification_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем lawyer_contracts.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyer_contracts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyer_contracts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('ACTIVE', 'COMPLETED', 'CANCELLED')
        ) THEN
            ALTER TABLE lawyer_contracts ADD COLUMN status_new appointment_status_enum;
            UPDATE lawyer_contracts SET status_new = status::appointment_status_enum WHERE status IS NOT NULL;
            ALTER TABLE lawyer_contracts DROP COLUMN status;
            ALTER TABLE lawyer_contracts RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка lawyer_contracts.status успешно обновлена на appointment_status_enum';
        ELSE
            RAISE NOTICE 'В lawyer_contracts.status найдены значения, не соответствующие appointment_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем inspections.status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'inspections' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM inspections 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
        ) THEN
            ALTER TABLE inspections ADD COLUMN status_new inspection_status_enum;
            UPDATE inspections SET status_new = status::inspection_status_enum WHERE status IS NOT NULL;
            ALTER TABLE inspections DROP COLUMN status;
            ALTER TABLE inspections RENAME COLUMN status_new TO status;
            RAISE NOTICE 'Колонка inspections.status успешно обновлена на inspection_status_enum';
        ELSE
            RAISE NOTICE 'В inspections.status найдены значения, не соответствующие inspection_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. ВОССТАНОВЛЕНИЕ RLS ПОЛИТИК
-- =====================================================

-- Восстанавливаем политики для appointments
CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update appointments" ON appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для verification_requests
CREATE POLICY "Users can view verification requests" ON verification_requests FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can create verification requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update verification requests" ON verification_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для role_change_requests
CREATE POLICY "Users can view role change requests" ON role_change_requests FOR SELECT USING (
    auth.uid() = requested_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can create role change requests" ON role_change_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can update role change requests" ON role_change_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для warrants
CREATE POLICY "Users can view warrants" ON warrants FOR SELECT USING (true);

CREATE POLICY "Authorized users can create warrants" ON warrants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'JUDGE', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Authorized users can update warrants" ON warrants FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'JUDGE', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для cases
CREATE POLICY "Users can view cases" ON cases FOR SELECT USING (true);

CREATE POLICY "Authorized users can create cases" ON cases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'JUDGE', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can update own cases" ON cases FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для court_sessions
CREATE POLICY "Users can view court sessions" ON court_sessions FOR SELECT USING (true);

CREATE POLICY "Authorized users can create court sessions" ON court_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'JUDGE', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для fines
CREATE POLICY "Users can view fines" ON fines FOR SELECT USING (true);

CREATE POLICY "Authorized users can create fines" ON fines FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'JUDGE', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для gov_acts
CREATE POLICY "Users can view government acts" ON gov_acts FOR SELECT USING (true);

CREATE POLICY "Authorized users can create government acts" ON gov_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'PROSECUTOR', 'ATTORNEY_GENERAL'))
);

-- Восстанавливаем политики для court_acts
CREATE POLICY "Users can view court acts" ON court_acts FOR SELECT USING (true);

CREATE POLICY "Authorized users can create court acts" ON court_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'JUDGE', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для inspections
CREATE POLICY "Users can view inspections" ON inspections FOR SELECT USING (true);

CREATE POLICY "Authorized users can create inspections" ON inspections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL')) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND leader_role IN ('CHIEF_EMS')) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND office_role IN ('MIN_HEALTH', 'GOVERNOR'))
);

-- Восстанавливаем политики для lawyer_requests (без created_by)
CREATE POLICY "Users can view lawyer requests" ON lawyer_requests FOR SELECT USING (true);

CREATE POLICY "Users can create lawyer requests" ON lawyer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update lawyer requests" ON lawyer_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Восстанавливаем политики для lawyer_contracts (без created_by)
CREATE POLICY "Users can view lawyer contracts" ON lawyer_contracts FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can create lawyer contracts" ON lawyer_contracts FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update lawyer contracts" ON lawyer_contracts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- =====================================================
-- 5. ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================================

-- Выводим информацию о примененных ENUM'ах
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    CASE 
        WHEN c.data_type LIKE '%enum%' THEN 'ENUM APPLIED'
        ELSE 'TEXT (needs update)'
    END as enum_status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.column_name IN (
        'faction', 'gov_role', 'leader_role', 'office_role',
        'department', 'status', 'kind', 'request_type',
        'warrant_type', 'issuer_faction'
    )
ORDER BY t.table_name, c.column_name;

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Выводим сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE 'ENUM''ы успешно применены ко всем таблицам!';
    RAISE NOTICE 'RLS политики восстановлены!';
    RAISE NOTICE 'Теперь все поля используют строгую типизацию ENUM вместо TEXT.';
    RAISE NOTICE 'Проверьте вывод выше для подтверждения применения ENUM''ов.';
END $$;
