-- =====================================================
-- ИСПРАВЛЕНИЕ ОТОБРАЖЕНИЯ ПРОФИЛЕЙ
-- =====================================================

-- 1. Проверяем текущее состояние профилей
SELECT 
    'Current profiles status' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    (SELECT COUNT(*) FROM profiles WHERE nickname IS NOT NULL AND nickname != '') as profiles_with_nickname,
    (SELECT COUNT(*) FROM profiles WHERE static_id IS NOT NULL AND static_id != '') as profiles_with_static_id;

-- 2. Проверяем структуру таблицы profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем, есть ли профили с пустыми данными
SELECT 
    'Profiles with empty data' as info,
    id,
    email,
    nickname,
    static_id,
    discord,
    full_name,
    created_at
FROM profiles 
WHERE nickname IS NULL OR nickname = '' OR static_id IS NULL OR static_id = ''
ORDER BY created_at DESC;

-- 4. Исправляем профили с пустыми данными
UPDATE profiles 
SET 
    nickname = COALESCE(NULLIF(nickname, ''), 'User_' || substr(id::text, 1, 8)),
    static_id = COALESCE(NULLIF(static_id, ''), 'uid-' || replace(left(id::text, 8), '-', '')),
    full_name = COALESCE(NULLIF(full_name, ''), COALESCE(NULLIF(nickname, ''), 'User_' || substr(id::text, 1, 8))),
    updated_at = NOW()
WHERE nickname IS NULL OR nickname = '' OR static_id IS NULL OR static_id = '';

-- 5. Проверяем, что все профили имеют корректные данные
SELECT 
    'Profiles after fix' as check_type,
    (SELECT COUNT(*) FROM profiles WHERE nickname IS NOT NULL AND nickname != '') as profiles_with_nickname,
    (SELECT COUNT(*) FROM profiles WHERE static_id IS NOT NULL AND static_id != '') as profiles_with_static_id,
    (SELECT COUNT(*) FROM profiles WHERE full_name IS NOT NULL AND full_name != '') as profiles_with_full_name;

-- 6. Проверяем права доступа для чтения профилей
GRANT SELECT ON TABLE profiles TO authenticated;
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT ON TABLE profiles TO service_role;

-- 7. Проверяем RLS политики для profiles
SELECT 
    'RLS policies for profiles' as check_type,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Если RLS включен, проверяем политики
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) THEN
        RAISE NOTICE 'RLS включен для profiles - проверяем политики';
        
        -- Проверяем, есть ли политика для SELECT
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT') THEN
            RAISE NOTICE 'Создаем политику для SELECT';
            CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
        END IF;
        
        -- Проверяем, есть ли политика для UPDATE
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'UPDATE') THEN
            RAISE NOTICE 'Создаем политику для UPDATE';
            CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
        END IF;
        
        -- Проверяем, есть ли политика для INSERT
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'INSERT') THEN
            RAISE NOTICE 'Создаем политику для INSERT';
            CREATE POLICY "System can create profiles" ON profiles FOR INSERT WITH CHECK (true);
        END IF;
        
    ELSE
        RAISE NOTICE 'RLS отключен для profiles';
    END IF;
END $$;

-- 9. Проверяем, что триггер работает корректно
SELECT 
    'Trigger status' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 10. Проверяем функцию триггера
SELECT 
    'Function status' as check_type,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 11. Тестируем создание профиля вручную (если есть проблемы)
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
        RAISE NOTICE 'Создаем профиль для пользователя: %', test_user_id;
        
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
            COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User_' || substr(test_user_record.id::text, 1, 8)),
            test_user_record.raw_user_meta_data->>'discord',
            COALESCE(test_user_record.raw_user_meta_data->>'full_name', 
                     COALESCE(test_user_record.raw_user_meta_data->>'nickname', 'User_' || substr(test_user_record.id::text, 1, 8))),
            COALESCE(test_user_record.raw_user_meta_data->>'static_id', 'uid-' || replace(left(test_user_record.id::text, 8), '-', '')),
            'CIVILIAN',
            'NONE',
            false,
            test_user_record.created_at,
            NOW()
        );
        
        RAISE NOTICE 'Профиль создан успешно!';
        
    ELSE
        RAISE NOTICE 'Все пользователи уже имеют профили';
    END IF;
END $$;

-- 12. Финальная проверка
SELECT 
    'Final check' as check_type,
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM profiles) as profiles_in_table,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN 'SYNCED - All users have profiles' 
        ELSE 'NOT SYNCED - Some users missing profiles' 
    END as sync_status,
    (SELECT COUNT(*) FROM profiles WHERE nickname IS NOT NULL AND nickname != '') as profiles_with_data;

-- 13. Показываем последние профили для проверки
SELECT 
    'Recent profiles' as info,
    p.id,
    p.email,
    p.nickname,
    p.static_id,
    p.discord,
    p.full_name,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 5;

RAISE NOTICE 'Исправление отображения профилей завершено! Проверьте результаты выше.';
