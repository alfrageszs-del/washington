-- =====================================================
-- ДИАГНОСТИКА ПРОБЛЕМЫ С ПРОФИЛЯМИ
-- =====================================================

-- 1. Проверяем, включен ли RLS на таблице profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Проверяем все RLS политики для profiles
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

-- 3. Проверяем существование функции handle_new_user
SELECT 
    proname as function_name,
    prosrc as function_source,
    proowner::regrole as owner
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Проверяем существование триггера
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    event_object_schema,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Проверяем права доступа для функции
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

-- 7. Проверяем, есть ли пользователи в auth.users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Проверяем, есть ли профили в profiles
SELECT 
    id,
    email,
    nickname,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Проверяем логи PostgreSQL (если доступны)
-- SELECT * FROM pg_stat_activity WHERE query LIKE '%handle_new_user%';

-- 10. Тестируем функцию вручную (если есть тестовый пользователь)
-- Замените 'test-user-id' на реальный UUID пользователя из auth.users
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
                test_user_record.id,
                COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User'),
                COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'user_' || substr(test_user_record.id::text, 1, 8)),
                test_user_record.email,
                test_user_record.raw_user_meta_data->>'discord',
                COALESCE(test_user_record.raw_user_meta_data->>'faction', 'CIVILIAN'),
                'NONE',
                false,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Профиль создан успешно!';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ошибка при создании профиля: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'В auth.users нет пользователей для тестирования';
    END IF;
END $$;

-- 11. Проверяем, что получилось
SELECT 
    'Test result' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id IN (SELECT id FROM auth.users LIMIT 1)) 
        THEN 'Profile created successfully' 
        ELSE 'Profile creation failed' 
    END as result;

-- 12. Проверяем структуру таблицы profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. Проверяем, есть ли ограничения на таблице
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

RAISE NOTICE 'Диагностика завершена. Проверьте результаты выше.';
