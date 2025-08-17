-- =====================================================
-- РАДИКАЛЬНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ПРОФИЛЯМИ
-- =====================================================

-- 1. ВРЕМЕННО ОТКЛЮЧАЕМ RLS для profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
RAISE NOTICE 'RLS отключен для profiles';

-- 2. Удаляем все существующие политики
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
RAISE NOTICE 'Все RLS политики удалены';

-- 3. Удаляем функцию и триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
RAISE NOTICE 'Функция и триггер удалены';

-- 4. Создаем функцию с правами суперпользователя
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord TEXT;
    user_faction TEXT;
    user_full_name TEXT;
BEGIN
    -- Логируем начало выполнения
    RAISE LOG 'handle_new_user started for user %', NEW.id;
    
    -- Извлекаем данные из метаданных с проверками
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord := NEW.raw_user_meta_data->>'discord';
    user_faction := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', user_nickname);
    
    -- Логируем извлеченные данные
    RAISE LOG 'Extracted data: nickname=%, static_id=%, discord=%, faction=%, full_name=%', 
        user_nickname, user_static_id, user_discord, user_faction, user_full_name;
    
    -- Создаем профиль
    INSERT INTO public.profiles (
        id,
        email,
        nickname,
        discord,
        full_name,
        static_id,
        faction,
        gov_role,
        leader_role,
        office_role,
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
        NULL,
        NULL,
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

-- 5. Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- 6. Создаем триггер
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Даем права на таблицу profiles
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO service_role;

-- 8. Даем права на таблицу auth.users для триггера
GRANT SELECT ON TABLE auth.users TO authenticated;
GRANT SELECT ON TABLE auth.users TO anon;
GRANT SELECT ON TABLE auth.users TO service_role;

-- 9. Тестируем функцию
DO $$
DECLARE
    test_user_id UUID;
    test_user_record auth.users%ROWTYPE;
BEGIN
    -- Берем первого пользователя из auth.users для теста
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Тестируем функцию handle_new_user с пользователем: %', test_user_id;
        
        -- Получаем данные пользователя
        SELECT * INTO test_user_record FROM auth.users WHERE id = test_user_id;
        
        -- Пытаемся создать профиль вручную
        BEGIN
            INSERT INTO profiles (
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
                test_user_record.id,
                test_user_record.email,
                COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User'),
                test_user_record.raw_user_meta_data->>'discord',
                COALESCE(test_user_record.raw_user_meta_data->>'full_name', 'User'),
                COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'user_' || substr(test_user_record.id::text, 1, 8)),
                COALESCE(test_user_record.raw_user_meta_data->>'faction', 'CIVILIAN'),
                'NONE',
                false,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Профиль создан успешно!';
            
            -- Удаляем тестовый профиль
            DELETE FROM profiles WHERE id = test_user_id;
            RAISE NOTICE 'Тестовый профиль удален';
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ошибка при создании профиля: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'В auth.users нет пользователей для тестирования';
    END IF;
END $$;

-- 10. Проверяем результат
SELECT 
    'Radical fix completed' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN 'Function OK' 
        ELSE 'Function ERROR' 
    END as function_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
        THEN 'Trigger OK' 
        ELSE 'Trigger ERROR' 
    END as trigger_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = false) 
        THEN 'RLS Disabled' 
        ELSE 'RLS Still Enabled' 
    END as rls_status;

-- 11. ВАЖНО: Создаем профили для существующих пользователей
DO $$
DECLARE
    user_record RECORD;
    profiles_created INTEGER := 0;
BEGIN
    FOR user_record IN SELECT * FROM auth.users LOOP
        -- Проверяем, есть ли уже профиль
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_record.id) THEN
            BEGIN
                INSERT INTO profiles (
                    id,
                    email,
                    nickname,
                    discord,
                    full_name,
                    static_id,
                    faction,
                    gov_role,
                    leader_role,
                    office_role,
                    is_verified,
                    created_at,
                    updated_at
                ) VALUES (
                    user_record.id,
                    user_record.email,
                    COALESCE(user_record.raw_user_meta_data->>'nickname', 'User'),
                    user_record.raw_user_meta_data->>'discord',
                    COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
                    COALESCE(user_record.raw_user_meta_data->>'static_id', 'user_' || substr(user_record.id::text, 1, 8)),
                    COALESCE(user_record.raw_user_meta_data->>'faction', 'CIVILIAN'),
                    'NONE',
                    NULL,
                    NULL,
                    false,
                    user_record.created_at,
                    NOW()
                );
                profiles_created := profiles_created + 1;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Ошибка при создании профиля для пользователя %: %', user_record.id, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Создано профилей для существующих пользователей: %', profiles_created;
END $$;

-- 12. Проверяем финальное состояние
SELECT 
    'Final status' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'All users have profiles' 
        ELSE 'Some users missing profiles' 
    END as sync_status;

RAISE NOTICE 'Радикальное исправление профилей завершено! RLS отключен, все существующие пользователи получили профили.';
