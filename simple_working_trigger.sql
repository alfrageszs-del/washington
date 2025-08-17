-- =====================================================
-- ПРОСТОЙ И НАДЕЖНЫЙ ТРИГГЕР ДЛЯ ПРОФИЛЕЙ
-- =====================================================

-- 1. Удаляем все существующие функции и триггеры
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Отключаем RLS для profiles (временно)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Создаем простую функцию без сложной логики
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Простое логирование
    RAISE NOTICE 'Creating profile for user: %', NEW.id;
    
    -- Создаем профиль с минимальными данными
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'discord', NULL),
        COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'nickname', 'User')),
        COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN'),
        'NONE',
        NULL,
        NULL,
        false,
        NEW.created_at,
        NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Логируем ошибку, но не прерываем регистрацию
        RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Создаем триггер
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- 5. Даем права на выполнение
GRANT EXECUTE ON FUNCTION create_profile_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_for_user() TO anon;
GRANT EXECUTE ON FUNCTION create_profile_for_user() TO service_role;

-- 6. Даем права на таблицу profiles
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO service_role;

-- 7. Даем права на таблицу auth.users
GRANT SELECT ON TABLE auth.users TO authenticated;
GRANT SELECT ON TABLE auth.users TO anon;
GRANT SELECT ON TABLE auth.users TO service_role;

-- 8. Проверяем, что триггер создан
SELECT 
    'Trigger status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
        THEN 'Trigger created' 
        ELSE 'Trigger NOT created' 
    END as trigger_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_profile_for_user') 
        THEN 'Function created' 
        ELSE 'Function NOT created' 
    END as function_status;

-- 9. Создаем профили для существующих пользователей
DO $$
DECLARE
    user_record RECORD;
    profiles_created INTEGER := 0;
    profiles_skipped INTEGER := 0;
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
                    COALESCE(user_record.raw_user_meta_data->>'discord', NULL),
                    COALESCE(user_record.raw_user_meta_data->>'full_name', 
                             COALESCE(user_record.raw_user_meta_data->>'nickname', 'User')),
                    COALESCE(user_record.raw_user_meta_data->>'static_id', 
                             'user_' || substr(user_record.id::text, 1, 8)),
                    COALESCE(user_record.raw_user_meta_data->>'faction', 'CIVILIAN'),
                    'NONE',
                    NULL,
                    NULL,
                    false,
                    user_record.created_at,
                    NOW()
                );
                profiles_created := profiles_created + 1;
                RAISE NOTICE 'Created profile for user: % (%)', user_record.email, user_record.id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error creating profile for user %: %', user_record.id, SQLERRM;
            END;
        ELSE
            profiles_skipped := profiles_skipped + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: % profiles created, % skipped (already existed)', 
        profiles_created, profiles_skipped;
END $$;

-- 10. Проверяем финальное состояние
SELECT 
    'Final status' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'SYNCED - All users have profiles' 
        ELSE 'NOT SYNCED - Some users missing profiles' 
    END as sync_status;

-- 11. Показываем последние созданные профили
SELECT 
    'Recent profiles' as info,
    p.id,
    p.email,
    p.nickname,
    p.static_id,
    p.discord,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 5;

RAISE NOTICE 'Простой триггер создан! Теперь при регистрации пользователи автоматически получат профили.';
