-- =====================================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ПРОФИЛЯМИ
-- =====================================================

-- 1. Добавляем недостающую RLS политику для INSERT
CREATE POLICY IF NOT EXISTS "System can create profiles" ON profiles FOR INSERT WITH CHECK (true);

-- 2. Пересоздаем функцию handle_new_user
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord TEXT;
    user_faction TEXT;
BEGIN
    -- Извлекаем данные из метаданных с проверками
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord := NEW.raw_user_meta_data->>'discord';
    user_faction := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Записываем ошибку в лог, но не прерываем регистрацию
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Пересоздаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Проверяем результат
SELECT 
    'Profiles fix completed' as status,
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
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'INSERT') 
        THEN 'INSERT Policy OK' 
        ELSE 'INSERT Policy ERROR' 
    END as policy_status;

RAISE NOTICE 'Быстрое исправление профилей завершено!';
