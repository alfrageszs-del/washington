-- =====================================================
-- ТЕСТИРОВАНИЕ РАБОТЫ ТРИГГЕРА
-- =====================================================

-- 1. Проверяем текущее состояние
SELECT 
    'Current state' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table;

-- 2. Проверяем, что триггер существует
SELECT 
    'Trigger check' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_profile';

-- 3. Проверяем, что функция существует
SELECT 
    'Function check' as check_type,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'auto_create_profile';

-- 4. Проверяем права доступа
SELECT 
    'Permissions check' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 5. Проверяем RLS статус
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 6. Показываем пользователей без профилей
SELECT 
    'Users without profiles' as info,
    u.id,
    u.email,
    u.raw_user_meta_data->>'nickname' as nickname,
    u.raw_user_meta_data->>'discord' as discord,
    u.raw_user_meta_data->>'static_id' as static_id,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 7. Показываем последние профили
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

-- 8. Тестируем создание профиля вручную (если есть пользователи без профилей)
DO $$
DECLARE
    test_user_id UUID;
    test_user_record auth.users%ROWTYPE;
BEGIN
    -- Берем первого пользователя без профиля
    SELECT u.id, u.* INTO test_user_id, test_user_record 
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing manual profile creation for user: %', test_user_id;
        RAISE NOTICE 'Email: %, Nickname: %, Discord: %, Static ID: %', 
            test_user_record.email,
            COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User'),
            COALESCE(test_user_record.raw_user_meta_data->>'discord', 'None'),
            COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'None');
        
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
                COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User'),
                COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'user_' || substr(test_user_record.id::text, 1, 8)),
                'CIVILIAN',
                'NONE',
                false,
                test_user_record.created_at,
                NOW()
            );
            
            RAISE NOTICE 'Manual profile creation SUCCESS!';
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Manual profile creation FAILED: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'All users already have profiles - no manual testing needed';
    END IF;
END $$;

-- 9. Финальная проверка
SELECT 
    'Final check' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'PERFECT - All users have profiles' 
        ELSE 'ISSUE - Some users missing profiles' 
    END as sync_status;

-- 10. Если есть проблемы, показываем детали
SELECT 
    'Sync details' as info,
    'Users in auth.users' as table_name,
    (SELECT COUNT(*) FROM auth.users) as count

UNION ALL

SELECT 
    'Sync details' as info,
    'Profiles in profiles' as table_name,
    (SELECT COUNT(*) FROM profiles) as count

UNION ALL

SELECT 
    'Sync details' as info,
    'Users without profiles' as table_name,
    (SELECT COUNT(*) FROM auth.users u
     LEFT JOIN profiles p ON u.id = p.id
     WHERE p.id IS NULL) as count;

RAISE NOTICE 'Тестирование триггера завершено!';
