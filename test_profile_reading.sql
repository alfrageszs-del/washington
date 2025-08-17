-- =====================================================
-- ТЕСТИРОВАНИЕ ЧТЕНИЯ ПРОФИЛЕЙ
-- =====================================================

-- 1. Проверяем, что профили существуют и содержат данные
SELECT 
    'Profile data check' as check_type,
    id,
    email,
    nickname,
    static_id,
    discord,
    full_name,
    faction,
    gov_role,
    is_verified,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Проверяем права доступа для роли authenticated
SELECT 
    'Permissions for authenticated' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' AND table_schema = 'public' AND grantee = 'authenticated';

-- 3. Проверяем права доступа для роли anon
SELECT 
    'Permissions for anon' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' AND table_schema = 'public' AND grantee = 'anon';

-- 4. Проверяем RLS статус и политики
SELECT 
    'RLS and policies' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles'

UNION ALL

SELECT 
    'RLS and policies' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Тестируем простой SELECT запрос (имитируем фронтенд)
DO $$
DECLARE
    test_profile_id UUID;
    profile_data RECORD;
BEGIN
    -- Берем первый профиль для тестирования
    SELECT id INTO test_profile_id FROM profiles LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Тестируем чтение профиля с ID: %', test_profile_id;
        
        -- Имитируем запрос фронтенда
        SELECT * INTO profile_data FROM profiles WHERE id = test_profile_id;
        
        IF profile_data IS NOT NULL THEN
            RAISE NOTICE 'Профиль прочитан успешно:';
            RAISE NOTICE '  Email: %', profile_data.email;
            RAISE NOTICE '  Nickname: %', profile_data.nickname;
            RAISE NOTICE '  Static ID: %', profile_data.static_id;
            RAISE NOTICE '  Discord: %', profile_data.discord;
            RAISE NOTICE '  Full Name: %', profile_data.full_name;
            RAISE NOTICE '  Faction: %', profile_data.faction;
            RAISE NOTICE '  Gov Role: %', profile_data.gov_role;
        ELSE
            RAISE NOTICE 'Ошибка: профиль не найден';
        END IF;
    ELSE
        RAISE NOTICE 'В таблице profiles нет данных для тестирования';
    END IF;
END $$;

-- 6. Проверяем, что все профили имеют корректные данные
SELECT 
    'Data quality check' as check_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN nickname IS NOT NULL AND nickname != '' THEN 1 END) as profiles_with_nickname,
    COUNT(CASE WHEN static_id IS NOT NULL AND static_id != '' THEN 1 END) as profiles_with_static_id,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as profiles_with_email,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as profiles_with_full_name
FROM profiles;

-- 7. Показываем профили с проблемами (если есть)
SELECT 
    'Profiles with issues' as info,
    id,
    email,
    CASE 
        WHEN nickname IS NULL OR nickname = '' THEN 'MISSING NICKNAME'
        ELSE 'OK'
    END as nickname_status,
    CASE 
        WHEN static_id IS NULL OR static_id = '' THEN 'MISSING STATIC_ID'
        ELSE 'OK'
    END as static_id_status,
    CASE 
        WHEN email IS NULL OR email = '' THEN 'MISSING EMAIL'
        ELSE 'OK'
    END as email_status
FROM profiles 
WHERE nickname IS NULL OR nickname = '' OR static_id IS NULL OR static_id = '' OR email IS NULL OR email = '';

-- 8. Финальная проверка
SELECT 
    'Final status' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE nickname IS NOT NULL AND nickname != '') = (SELECT COUNT(*) FROM profiles)
        THEN 'ALL PROFILES HAVE NICKNAMES'
        ELSE 'SOME PROFILES MISSING NICKNAMES'
    END as nickname_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE static_id IS NOT NULL AND static_id != '') = (SELECT COUNT(*) FROM profiles)
        THEN 'ALL PROFILES HAVE STATIC_IDS'
        ELSE 'SOME PROFILES MISSING STATIC_IDS'
    END as static_id_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE email IS NOT NULL AND email != '') = (SELECT COUNT(*) FROM profiles)
        THEN 'ALL PROFILES HAVE EMAILS'
        ELSE 'SOME PROFILES MISSING EMAILS'
    END as email_status;

RAISE NOTICE 'Тестирование чтения профилей завершено!';
