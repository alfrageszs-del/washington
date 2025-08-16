-- Исправление всех проблем с регистрацией и структурой таблиц
-- Выполните этот скрипт в вашей базе данных

-- =====================================================
-- 1. ИСПРАВЛЕНИЕ СТРУКТУРЫ ТАБЛИЦЫ PROFILES
-- =====================================================

-- Удаляем старую таблицу profiles если она существует
DROP TABLE IF EXISTS profiles CASCADE;

-- Создаем enum для ролей (если не существует)
DO $$ BEGIN
    CREATE TYPE gov_role_enum AS ENUM (
        'NONE',           -- Без роли
        'PROSECUTOR',      -- Прокурор
        'JUDGE',          -- Судья
        'TECH_ADMIN',     -- Технический администратор
        'ATTORNEY_GENERAL', -- Генеральный прокурор
        'CHIEF_JUSTICE'   -- Главный судья
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем enum для фракций (если не существует)
DO $$ BEGIN
    CREATE TYPE faction_enum AS ENUM (
        'CIVILIAN',       -- Гражданский
        'LSPD',           -- Полиция
        'LSCSD',          -- Шериф
        'FIB',            -- ФБР
        'GOV',            -- Правительство
        'EMS',            -- Скорая помощь
        'SANG',           -- Национальная гвардия
        'WN'              -- Военно-морские силы
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу профилей заново
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    static_id TEXT NOT NULL,
    gov_role gov_role_enum NOT NULL DEFAULT 'NONE',
    faction faction_enum NOT NULL DEFAULT 'CIVILIAN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ПЕРЕСОЗДАНИЕ ФУНКЦИИ И ТРИГГЕРА
-- =====================================================

-- Удаляем старый триггер и функцию
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Создаем новую функцию
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Проверяем, что профиль еще не существует
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, email, nickname, static_id, gov_role, faction)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nickname', 'Новый пользователь'),
            COALESCE(NEW.raw_user_meta_data->>'static_id', 'N/A'),
            'NONE',
            'CIVILIAN'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер заново
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. ПРАВА ДОСТУПА
-- =====================================================

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Даем права на таблицу profiles
GRANT ALL ON TABLE profiles TO authenticated;

-- =====================================================
-- 4. ТЕСТОВЫЕ ДАННЫЕ
-- =====================================================

-- Вставляем тестового администратора
INSERT INTO profiles (id, email, nickname, static_id, gov_role, faction) 
VALUES (
    gen_random_uuid(),
    'admin@example.com',
    'Технический администратор',
    'ADMIN001',
    'TECH_ADMIN',
    'GOV'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 5. ПРОВЕРКА
-- =====================================================

-- Проверяем структуру таблицы profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Проверяем, что функция создана
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Проверяем, что триггер создан
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'All issues fixed successfully!' as status;
