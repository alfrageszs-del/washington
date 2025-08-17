-- =====================================================
-- ТЕСТИРОВАНИЕ РЕГИСТРАЦИИ
-- =====================================================

-- 1. Проверяем текущее состояние
SELECT 
    'Current state' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table;

-- 2. Проверяем, есть ли пользователи без профилей
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'NO PROFILE!'
    END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 3. Проверяем логи PostgreSQL (если доступны)
-- В Supabase это может быть недоступно
SELECT 
    'PostgreSQL logs' as info,
    'Check Supabase dashboard for function logs' as note;

-- 4. Тестируем создание профиля вручную
DO $$
DECLARE
    test_user_id UUID;
    test_user_record auth.users%ROWTYPE;
    profile_created BOOLEAN := false;
BEGIN
    -- Берем первого пользователя без профиля
    SELECT u.id, u.* INTO test_user_id, test_user_record 
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Тестируем создание профиля для пользователя: %', test_user_id;
        RAISE NOTICE 'Email: %, Nickname: %', 
            test_user_record.email,
            COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User');
        
        -- Пытаемся создать профиль
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
                test_user_record.id,
                test_user_record.email,
                COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User'),
                test_user_record.raw_user_meta_data->>'discord',
                COALESCE(test_user_record.raw_user_meta_data->>'full_name', 'User'),
                COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'user_' || substr(test_user_record.id::text, 1, 8)),
                COALESCE(test_user_record.raw_user_meta_data->>'faction', 'CIVILIAN'),
                'NONE',
                NULL,
                NULL,
                false,
                test_user_record.created_at,
                NOW()
            );
            
            profile_created := true;
            RAISE NOTICE 'Профиль создан успешно!';
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ошибка при создании профиля: %', SQLERRM;
                RAISE NOTICE 'Код ошибки: %', SQLSTATE;
        END;
        
        -- Проверяем результат
        IF profile_created THEN
            SELECT 
                'Profile creation test' as test_type,
                'SUCCESS' as result,
                test_user_id as user_id;
        ELSE
            SELECT 
                'Profile creation test' as test_type,
                'FAILED' as result,
                test_user_id as user_id;
        END IF;
        
    ELSE
        RAISE NOTICE 'Все пользователи уже имеют профили';
        SELECT 
            'Profile creation test' as test_type,
            'ALL PROFILES EXIST' as result,
            NULL as user_id;
    END IF;
END $$;

-- 5. Проверяем финальное состояние
SELECT 
    'Final state' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'SYNCED' 
        ELSE 'NOT SYNCED' 
    END as sync_status;

-- 6. Если есть несинхронизированные пользователи, показываем их
SELECT 
    'Unsynced users' as info,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
