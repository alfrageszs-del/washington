-- =====================================================
-- ИСПРАВЛЕНИЯ ПРОБЛЕМ В БАЗЕ ДАННЫХ WASHINGTON (ВЕРСИЯ 2)
-- =====================================================
-- Этот файл исправляет проблемы, найденные в существующей базе данных
-- Запускать ПОСЛЕ основного database_schema.sql

-- =====================================================
-- 1. ИСПРАВЛЕНИЕ ФУНКЦИИ handle_new_user
-- =====================================================

-- Удаляем старую функцию, если она существует
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Создаем исправленную функцию для автоматического создания профиля
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord TEXT;
    user_faction TEXT;
    user_full_name TEXT;
BEGIN
    -- Извлекаем данные из метаданных с проверками
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord := NEW.raw_user_meta_data->>'discord';
    user_faction := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', user_nickname);
    
    -- Создаем профиль с полной информацией
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
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Записываем ошибку в лог, но не прерываем регистрацию
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 2. ДОБАВЛЕНИЕ ОТСУТСТВУЮЩИХ КОЛОНОК
-- =====================================================

-- Добавляем колонку status в таблицу gov_acts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gov_acts' AND column_name = 'status') THEN
        ALTER TABLE gov_acts ADD COLUMN status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT';
    END IF;
END $$;

-- Добавляем колонку status в таблицу court_acts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'court_acts' AND column_name = 'status') THEN
        ALTER TABLE court_acts ADD COLUMN status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT';
    END IF;
END $$;

-- Добавляем колонку created_at в таблицу fines
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fines' AND column_name = 'created_at') THEN
        ALTER TABLE fines ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Добавляем колонку current_faction_value в таблицу role_change_requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'role_change_requests' AND column_name = 'current_faction_value') THEN
        ALTER TABLE role_change_requests ADD COLUMN current_faction_value TEXT;
    END IF;
END $$;

-- Добавляем колонку current_role_value в таблицу role_change_requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'role_change_requests' AND column_name = 'current_role_value') THEN
        ALTER TABLE role_change_requests ADD COLUMN current_role_value TEXT;
    END IF;
END $$;

-- =====================================================
-- 3. ИСПРАВЛЕНИЕ СВЯЗЕЙ МЕЖДУ ТАБЛИЦАМИ
-- =====================================================

-- Исправляем таблицу cases - добавляем недостающие колонки для связей
DO $$ 
BEGIN
    -- Добавляем колонку prosecutor_id если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'prosecutor_id') THEN
        ALTER TABLE cases ADD COLUMN prosecutor_id UUID REFERENCES profiles(id);
    END IF;
    
    -- Добавляем колонку judge_id если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'judge_id') THEN
        ALTER TABLE cases ADD COLUMN judge_id UUID REFERENCES profiles(id);
    END IF;
    
    -- Переименовываем assigned_to в judge_id если нужно
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'cases' AND column_name = 'assigned_to') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'judge_id') THEN
        ALTER TABLE cases RENAME COLUMN assigned_to TO judge_id;
    END IF;
END $$;

-- Исправляем таблицу inspections - добавляем недостающие колонки для связей
DO $$ 
BEGIN
    -- Добавляем колонку inspector_id если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inspections' AND column_name = 'inspector_id') THEN
        ALTER TABLE inspections ADD COLUMN inspector_id UUID REFERENCES profiles(id);
    END IF;
    
    -- Переименовываем created_by в inspector_id если нужно
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'inspections' AND column_name = 'created_by') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inspections' AND column_name = 'inspector_id') THEN
        ALTER TABLE inspections RENAME COLUMN created_by TO inspector_id;
    END IF;
END $$;

-- Исправляем таблицу lawyers - добавляем недостающие колонки
DO $$ 
BEGIN
    -- Добавляем колонку status если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lawyers' AND column_name = 'status') THEN
        ALTER TABLE lawyers ADD COLUMN status TEXT CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')) DEFAULT 'ACTIVE';
    END IF;
    
    -- Добавляем колонку created_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lawyers' AND column_name = 'created_at') THEN
        ALTER TABLE lawyers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Добавляем колонку updated_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lawyers' AND column_name = 'updated_at') THEN
        ALTER TABLE lawyers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 4. ОБНОВЛЕНИЕ ИНДЕКСОВ
-- =====================================================

-- Добавляем индекс для status в gov_acts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gov_acts_status') THEN
        CREATE INDEX idx_gov_acts_status ON gov_acts(status);
    END IF;
END $$;

-- Добавляем индекс для status в court_acts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_court_acts_status') THEN
        CREATE INDEX idx_court_acts_status ON court_acts(status);
    END IF;
END $$;

-- Добавляем индекс для created_at в fines
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fines_created_at') THEN
        CREATE INDEX idx_fines_created_at ON fines(created_at);
    END IF;
END $$;

-- Добавляем индексы для новых связей в cases
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cases_prosecutor_id') THEN
        CREATE INDEX idx_cases_prosecutor_id ON cases(prosecutor_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cases_judge_id') THEN
        CREATE INDEX idx_cases_judge_id ON cases(judge_id);
    END IF;
END $$;

-- Добавляем индекс для inspector_id в inspections
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inspections_inspector_id') THEN
        CREATE INDEX idx_inspections_inspector_id ON inspections(inspector_id);
    END IF;
END $$;

-- =====================================================
-- 5. ОБНОВЛЕНИЕ RLS ПОЛИТИК
-- =====================================================

-- Обновляем политики для gov_acts с учетом новой колонки status
DROP POLICY IF EXISTS "Authorized users can create government acts" ON gov_acts;
CREATE POLICY "Authorized users can create government acts" ON gov_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'PROSECUTOR'))
);

-- Обновляем политики для court_acts с учетом новой колонки status
DROP POLICY IF EXISTS "Authorized users can create court acts" ON court_acts;
CREATE POLICY "Authorized users can create court acts" ON court_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'CHIEF_JUSTICE', 'JUDGE'))
);

-- Обновляем политики для cases
DROP POLICY IF EXISTS "Users can update own cases" ON cases;
CREATE POLICY "Users can update own cases" ON cases FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = prosecutor_id OR 
    auth.uid() = judge_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Обновляем политики для inspections
DROP POLICY IF EXISTS "Authorized users can create inspections" ON inspections;
CREATE POLICY "Authorized users can create inspections" ON inspections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           (gov_role IN ('ATTORNEY_GENERAL') OR 
            leader_role IN ('CHIEF_EMS', 'GOVERNOR') OR
            office_role IN ('MIN_HEALTH')))
);

-- =====================================================
-- 6. ПРОВЕРКА И ВЫВОД СТАТУСА
-- =====================================================

-- Проверяем, что все необходимые колонки существуют
SELECT 
    'gov_acts.status' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'gov_acts' AND column_name = 'status') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'court_acts.status' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'court_acts' AND column_name = 'status') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'fines.created_at' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fines' AND column_name = 'created_at') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'role_change_requests.current_faction_value' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'role_change_requests' AND column_name = 'current_faction_value') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'role_change_requests.current_role_value' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'role_change_requests' AND column_name = 'current_role_value') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'cases.prosecutor_id' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'cases' AND column_name = 'prosecutor_id') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'cases.judge_id' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'cases' AND column_name = 'judge_id') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'inspections.inspector_id' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'inspections' AND column_name = 'inspector_id') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status;

-- Проверяем, что функция handle_new_user создана
SELECT 
    'handle_new_user function' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status;

-- Проверяем, что триггер создан
SELECT 
    'on_auth_user_created trigger' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status;

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Выводим сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE 'Исправления применены успешно!';
    RAISE NOTICE 'Проверьте вывод выше для подтверждения статуса всех исправлений.';
    RAISE NOTICE 'Все связи между таблицами должны теперь работать корректно.';
END $$;
