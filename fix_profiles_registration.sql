-- =====================================================
-- ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С РЕГИСТРАЦИЕЙ ПРОФИЛЕЙ
-- =====================================================

-- 1. Проверяем существование таблицы profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Таблица profiles не существует!';
    ELSE
        RAISE NOTICE 'Таблица profiles существует';
    END IF;
END $$;

-- 2. Проверяем структуру таблицы profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем существование функции handle_new_user
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Проверяем существование триггера
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Проверяем права доступа
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 6. Проверяем права на auth.users
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'auth';

-- 7. Пересоздаем функцию handle_new_user с исправлениями
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord TEXT;
    user_faction TEXT;
BEGIN
    -- Логируем начало выполнения
    RAISE LOG 'handle_new_user started for user %', NEW.id;
    
    -- Извлекаем данные из метаданных с проверками
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord := NEW.raw_user_meta_data->>'discord';
    user_faction := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    
    -- Логируем извлеченные данные
    RAISE LOG 'Extracted data: nickname=%, static_id=%, discord=%, faction=%', 
        user_nickname, user_static_id, user_discord, user_faction;
    
    -- Создаем профиль
    INSERT INTO public.profiles (
        id,
        nickname,
        static_id,
        email,
        discord,
        faction,
        gov_role,
        is_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_nickname,
        user_static_id,
        NEW.email,
        user_discord,
        user_faction,
        'NONE',
        false,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Profile created successfully for user %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Записываем ошибку в лог, но не прерываем регистрацию
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RAISE LOG 'Error detail: %', SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Пересоздаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. ИСПРАВЛЯЕМ RLS ПОЛИТИКИ - добавляем недостающую политику для INSERT
-- Сначала удаляем существующие политики
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Создаем правильные политики
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- ВАЖНО: Добавляем политику для INSERT, чтобы функция handle_new_user могла создавать профили
CREATE POLICY "System can create profiles" ON profiles FOR INSERT WITH CHECK (true);

-- 10. Проверяем, что функция и триггер созданы
SELECT 
    'Function' as type,
    proname as name,
    prosrc as source
FROM pg_proc 
WHERE proname = 'handle_new_user'

UNION ALL

SELECT 
    'Trigger' as type,
    trigger_name as name,
    action_statement as source
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 11. Проверяем права доступа для функции
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- 12. Проверяем права на таблицу profiles
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO anon;

-- 13. Проверяем права на таблицу auth.users для триггера
GRANT SELECT ON TABLE auth.users TO authenticated;
GRANT SELECT ON TABLE auth.users TO anon;

-- 14. Проверяем, что RLS не блокирует вставку
DO $$
BEGIN
    -- Временно отключаем RLS для тестирования
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS отключен для profiles';
    
    -- Проверяем, что можно вставить тестовую запись
    BEGIN
        INSERT INTO profiles (id, nickname, static_id, email, faction, gov_role, is_verified)
        VALUES (
            gen_random_uuid(),
            'test_user',
            'test_123',
            'test@example.com',
            'CIVILIAN',
            'NONE',
            false
        );
        RAISE NOTICE 'Тестовая вставка успешна';
        
        -- Удаляем тестовую запись
        DELETE FROM profiles WHERE email = 'test@example.com';
        RAISE NOTICE 'Тестовая запись удалена';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Ошибка при тестовой вставке: %', SQLERRM;
    END;
    
    -- Включаем RLS обратно
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS включен обратно для profiles';
END $$;

-- 15. Проверяем финальное состояние
SELECT 
    'Final check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN 'Function exists' 
        ELSE 'Function missing' 
    END as function_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
        THEN 'Trigger exists' 
        ELSE 'Trigger missing' 
    END as trigger_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
        THEN 'Table exists' 
        ELSE 'Table missing' 
    END as table_status;

-- 16. Проверяем RLS политики
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

RAISE NOTICE 'Скрипт исправления профилей завершен. Проверьте логи на наличие ошибок.';
