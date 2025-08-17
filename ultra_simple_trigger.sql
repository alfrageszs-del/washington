-- =====================================================
-- УЛЬТРА-ПРОСТОЙ ТРИГГЕР ДЛЯ ПРОФИЛЕЙ
-- =====================================================

-- 1. Удаляем все существующие функции и триггеры
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

-- 2. Отключаем RLS для profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Создаем максимально простую функцию
CREATE OR REPLACE FUNCTION auto_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Простое логирование
    RAISE NOTICE 'Auto-creating profile for user: %', NEW.id;
    
    -- Создаем профиль
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
        NEW.raw_user_meta_data->>'discord',
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8)),
        'CIVILIAN',
        'NONE',
        false,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Создаем триггер
CREATE TRIGGER trigger_create_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auto_create_profile();

-- 5. Даем все права
GRANT EXECUTE ON FUNCTION auto_create_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_profile() TO anon;
GRANT EXECUTE ON FUNCTION auto_create_profile() TO service_role;
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO service_role;
GRANT SELECT ON TABLE auth.users TO authenticated;
GRANT SELECT ON TABLE auth.users TO anon;
GRANT SELECT ON TABLE auth.users TO service_role;

-- 6. Проверяем создание
SELECT 
    'Ultra-simple trigger' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_create_profile') 
        THEN 'Function OK' 
        ELSE 'Function ERROR' 
    END as function_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_create_profile') 
        THEN 'Trigger OK' 
        ELSE 'Trigger ERROR' 
    END as trigger_status;

-- 7. Создаем профили для существующих пользователей
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
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'nickname', 'User'),
    u.raw_user_meta_data->>'discord',
    COALESCE(u.raw_user_meta_data->>'nickname', 'User'),
    COALESCE(u.raw_user_meta_data->>'static_id', 'user_' || substr(u.id::text, 1, 8)),
    'CIVILIAN',
    'NONE',
    false,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 8. Проверяем результат
SELECT 
    'Migration result' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'SUCCESS - All synced' 
        ELSE 'FAILED - Not synced' 
    END as result;

RAISE NOTICE 'Ультра-простой триггер создан! Теперь профили будут создаваться автоматически.';
