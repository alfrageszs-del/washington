-- =====================================================
-- ПРИМЕНЕНИЕ ENUM'ОВ К ТАБЛИЦАМ WASHINGTON
-- =====================================================
-- Этот файл автоматически применяет созданные ENUM'ы ко всем таблицам
-- Запускать ПОСЛЕ database_enums.sql

-- =====================================================
-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ PROFILES
-- =====================================================

-- Обновляем faction с использованием ENUM
DO $$ 
BEGIN
    -- Проверяем, что все существующие значения faction соответствуют ENUM
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'faction' AND data_type = 'text') THEN
        
        -- Проверяем, что все значения можно безопасно конвертировать
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE faction IS NOT NULL 
            AND faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')
        ) THEN
            ALTER TABLE profiles ALTER COLUMN faction TYPE faction_enum USING faction::faction_enum;
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
            ALTER TABLE profiles ALTER COLUMN gov_role TYPE gov_role_enum USING gov_role::gov_role_enum;
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
            ALTER TABLE profiles ALTER COLUMN leader_role TYPE leader_role_enum USING leader_role::leader_role_enum;
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
            ALTER TABLE profiles ALTER COLUMN office_role TYPE department_enum USING office_role::department_enum;
            RAISE NOTICE 'Колонка profiles.office_role успешно обновлена на department_enum';
        ELSE
            RAISE NOTICE 'В profiles.office_role найдены значения, не соответствующие department_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 2. ОБНОВЛЕНИЕ ТАБЛИЦЫ APPOINTMENTS
-- =====================================================

-- Обновляем department с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'department' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE department IS NOT NULL 
            AND department NOT IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')
        ) THEN
            ALTER TABLE appointments ALTER COLUMN department TYPE department_enum USING department::department_enum;
            RAISE NOTICE 'Колонка appointments.department успешно обновлена на department_enum';
        ELSE
            RAISE NOTICE 'В appointments.department найдены значения, не соответствующие department_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED')
        ) THEN
            ALTER TABLE appointments ALTER COLUMN status TYPE appointment_status_enum USING status::appointment_status_enum;
            RAISE NOTICE 'Колонка appointments.status успешно обновлена на appointment_status_enum';
        ELSE
            RAISE NOTICE 'В appointments.status найдены значения, не соответствующие appointment_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 3. ОБНОВЛЕНИЕ ТАБЛИЦЫ VERIFICATION_REQUESTS
-- =====================================================

-- Обновляем kind с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'kind' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE kind IS NOT NULL 
            AND kind NOT IN ('ACCOUNT', 'PROSECUTOR', 'JUDGE', 'OFFICE', 'FACTION_MEMBER')
        ) THEN
            ALTER TABLE verification_requests ALTER COLUMN kind TYPE verification_kind_enum USING kind::verification_kind_enum;
            RAISE NOTICE 'Колонка verification_requests.kind успешно обновлена на verification_kind_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.kind найдены значения, не соответствующие verification_kind_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE verification_requests ALTER COLUMN status TYPE verification_status_enum USING status::verification_status_enum;
            RAISE NOTICE 'Колонка verification_requests.status успешно обновлена на verification_status_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.status найдены значения, не соответствующие verification_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем target_faction с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'target_faction' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE target_faction IS NOT NULL 
            AND target_faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')
        ) THEN
            ALTER TABLE verification_requests ALTER COLUMN target_faction TYPE faction_enum USING target_faction::faction_enum;
            RAISE NOTICE 'Колонка verification_requests.target_faction успешно обновлена на faction_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.target_faction найдены значения, не соответствующие faction_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем target_department с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'verification_requests' AND column_name = 'target_department' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE target_department IS NOT NULL 
            AND target_department NOT IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')
        ) THEN
            ALTER TABLE verification_requests ALTER COLUMN target_department TYPE department_enum USING target_department::department_enum;
            RAISE NOTICE 'Колонка verification_requests.target_department успешно обновлена на department_enum';
        ELSE
            RAISE NOTICE 'В verification_requests.target_department найдены значения, не соответствующие department_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. ОБНОВЛЕНИЕ ТАБЛИЦЫ ROLE_CHANGE_REQUESTS
-- =====================================================

-- Обновляем request_type с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'role_change_requests' AND column_name = 'request_type' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM role_change_requests 
            WHERE request_type IS NOT NULL 
            AND request_type NOT IN ('FACTION', 'GOV_ROLE', 'LEADER_ROLE', 'OFFICE_ROLE')
        ) THEN
            ALTER TABLE role_change_requests ALTER COLUMN request_type TYPE role_change_request_type_enum USING request_type::role_change_request_type_enum;
            RAISE NOTICE 'Колонка role_change_requests.request_type успешно обновлена на role_change_request_type_enum';
        ELSE
            RAISE NOTICE 'В role_change_requests.request_type найдены значения, не соответствующие role_change_request_type_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'role_change_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM role_change_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE role_change_requests ALTER COLUMN status TYPE role_change_request_status_enum USING status::role_change_request_status_enum;
            RAISE NOTICE 'Колонка role_change_requests.status успешно обновлена на role_change_request_status_enum';
        ELSE
            RAISE NOTICE 'В role_change_requests.status найдены значения, не соответствующие role_change_request_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. ОБНОВЛЕНИЕ ТАБЛИЦЫ GOV_ACTS
-- =====================================================

-- Обновляем status с использованием ENUM (если колонка существует)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'gov_acts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM gov_acts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')
        ) THEN
            ALTER TABLE gov_acts ALTER COLUMN status TYPE act_status_enum USING status::act_status_enum;
            RAISE NOTICE 'Колонка gov_acts.status успешно обновлена на act_status_enum';
        ELSE
            RAISE NOTICE 'В gov_acts.status найдены значения, не соответствующие act_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 6. ОБНОВЛЕНИЕ ТАБЛИЦЫ COURT_ACTS
-- =====================================================

-- Обновляем status с использованием ENUM (если колонка существует)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'court_acts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM court_acts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')
        ) THEN
            ALTER TABLE court_acts ALTER COLUMN status TYPE act_status_enum USING status::act_status_enum;
            RAISE NOTICE 'Колонка court_acts.status успешно обновлена на act_status_enum';
        ELSE
            RAISE NOTICE 'В court_acts.status найдены значения, не соответствующие act_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 7. ОБНОВЛЕНИЕ ТАБЛИЦЫ WARRANTS
-- =====================================================

-- Обновляем warrant_type с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'warrants' AND column_name = 'warrant_type' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM warrants 
            WHERE warrant_type IS NOT NULL 
            AND warrant_type NOT IN ('AS', 'S', 'A')
        ) THEN
            ALTER TABLE warrants ALTER COLUMN warrant_type TYPE warrant_type_enum USING warrant_type::warrant_type_enum;
            RAISE NOTICE 'Колонка warrants.warrant_type успешно обновлена на warrant_type_enum';
        ELSE
            RAISE NOTICE 'В warrants.warrant_type найдены значения, не соответствующие warrant_type_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'warrants' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM warrants 
            WHERE status IS NOT NULL 
            AND status NOT IN ('active', 'executed', 'expired', 'cancelled')
        ) THEN
            ALTER TABLE warrants ALTER COLUMN status TYPE warrant_status_enum USING status::warrant_status_enum;
            RAISE NOTICE 'Колонка warrants.status успешно обновлена на warrant_status_enum';
        ELSE
            RAISE NOTICE 'В warrants.status найдены значения, не соответствующие warrant_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 8. ОБНОВЛЕНИЕ ТАБЛИЦЫ CASES
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'cases' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM cases 
            WHERE status IS NOT NULL 
            AND status NOT IN ('open', 'in_progress', 'closed', 'archived')
        ) THEN
            ALTER TABLE cases ALTER COLUMN status TYPE case_status_enum USING status::case_status_enum;
            RAISE NOTICE 'Колонка cases.status успешно обновлена на case_status_enum';
        ELSE
            RAISE NOTICE 'В cases.status найдены значения, не соответствующие case_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 9. ОБНОВЛЕНИЕ ТАБЛИЦЫ COURT_SESSIONS
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'court_sessions' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM court_sessions 
            WHERE status IS NOT NULL 
            AND status NOT IN ('open', 'in_progress', 'closed', 'archived')
        ) THEN
            ALTER TABLE court_sessions ALTER COLUMN status TYPE case_status_enum USING status::case_status_enum;
            RAISE NOTICE 'Колонка court_sessions.status успешно обновлена на case_status_enum';
        ELSE
            RAISE NOTICE 'В court_sessions.status найдены значения, не соответствующие case_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 10. ОБНОВЛЕНИЕ ТАБЛИЦЫ LAWYERS
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyers' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyers 
            WHERE status IS NOT NULL 
            AND status NOT IN ('ACTIVE', 'SUSPENDED', 'REVOKED')
        ) THEN
            ALTER TABLE lawyers ALTER COLUMN status TYPE lawyer_status_enum USING status::lawyer_status_enum;
            RAISE NOTICE 'Колонка lawyers.status успешно обновлена на lawyer_status_enum';
        ELSE
            RAISE NOTICE 'В lawyers.status найдены значения, не соответствующие lawyer_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 11. ОБНОВЛЕНИЕ ТАБЛИЦЫ LAWYER_REQUESTS
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyer_requests' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyer_requests 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
        ) THEN
            ALTER TABLE lawyer_requests ALTER COLUMN status TYPE verification_status_enum USING status::verification_status_enum;
            RAISE NOTICE 'Колонка lawyer_requests.status успешно обновлена на verification_status_enum';
        ELSE
            RAISE NOTICE 'В lawyer_requests.status найдены значения, не соответствующие verification_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 12. ОБНОВЛЕНИЕ ТАБЛИЦЫ LAWYER_CONTRACTS
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lawyer_contracts' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM lawyer_contracts 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED')
        ) THEN
            ALTER TABLE lawyer_contracts ALTER COLUMN status TYPE appointment_status_enum USING status::appointment_status_enum;
            RAISE NOTICE 'Колонка lawyer_contracts.status успешно обновлена на appointment_status_enum';
        ELSE
            RAISE NOTICE 'В lawyer_contracts.status найдены значения, не соответствующие appointment_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 13. ОБНОВЛЕНИЕ ТАБЛИЦЫ INSPECTIONS
-- =====================================================

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'inspections' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM inspections 
            WHERE status IS NOT NULL 
            AND status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
        ) THEN
            ALTER TABLE inspections ALTER COLUMN status TYPE inspection_status_enum USING status::inspection_status_enum;
            RAISE NOTICE 'Колонка inspections.status успешно обновлена на inspection_status_enum';
        ELSE
            RAISE NOTICE 'В inspections.status найдены значения, не соответствующие inspection_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 14. ОБНОВЛЕНИЕ ТАБЛИЦЫ FINES
-- =====================================================

-- Обновляем issuer_faction с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fines' AND column_name = 'issuer_faction' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM fines 
            WHERE issuer_faction IS NOT NULL 
            AND issuer_faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')
        ) THEN
            ALTER TABLE fines ALTER COLUMN issuer_faction TYPE faction_enum USING issuer_faction::faction_enum;
            RAISE NOTICE 'Колонка fines.issuer_faction успешно обновлена на faction_enum';
        ELSE
            RAISE NOTICE 'В fines.issuer_faction найдены значения, не соответствующие faction_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- Обновляем status с использованием ENUM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fines' AND column_name = 'status' AND data_type = 'text') THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM fines 
            WHERE status IS NOT NULL 
            AND status NOT IN ('UNPAID', 'PAID', 'CANCELLED')
        ) THEN
            ALTER TABLE fines ALTER COLUMN status TYPE fine_status_enum USING status::fine_status_enum;
            RAISE NOTICE 'Колонка fines.status успешно обновлена на fine_status_enum';
        ELSE
            RAISE NOTICE 'В fines.status найдены значения, не соответствующие fine_status_enum. Обновление пропущено.';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 15. ПРОВЕРКА РЕЗУЛЬТАТА
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
    RAISE NOTICE 'Теперь все поля используют строгую типизацию ENUM вместо TEXT.';
    RAISE NOTICE 'Проверьте вывод выше для подтверждения применения ENUM''ов.';
END $$;
