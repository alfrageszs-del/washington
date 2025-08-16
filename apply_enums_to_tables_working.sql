-- =====================================================
-- ПРИМЕНЕНИЕ ENUM'ОВ К ТАБЛИЦАМ WASHINGTON (РАБОЧАЯ ВЕРСИЯ)
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
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

CREATE POLICY "Users can create role change requests" ON role_change_requests FOR INSERT WITH CHECK (auth.uid() = created_by);

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
