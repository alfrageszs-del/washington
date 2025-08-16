-- Исправление ошибки регистрации пользователей
-- Выполните этот скрипт в вашей базе данных

-- Удаляем старый триггер и функцию
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Создаем исправленную функцию
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nickname, static_id, gov_role, faction)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'Новый пользователь'),
        COALESCE(NEW.raw_user_meta_data->>'static_id', 'N/A'),
        'NONE',
        'CIVILIAN'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Создаем триггер заново
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Проверяем, что все работает
SELECT 'Registration trigger fixed successfully' as status;
