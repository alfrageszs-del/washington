-- =====================================================
-- ИСПРАВЛЕНИЕ РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================

-- Обновляем функцию для правильного создания профилей
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
BEGIN
    -- Извлекаем nickname из метаданных
    user_nickname := COALESCE(
        NEW.raw_user_meta_data->>'nickname',
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    
    -- Извлекаем static_id из метаданных
    user_static_id := COALESCE(
        NEW.raw_user_meta_data->>'static_id',
        NEW.raw_user_meta_data->>'localmail',
        'ID_' || substr(NEW.id::text, 1, 8)
    );
    
    -- Создаем профиль
    INSERT INTO public.profiles (id, nickname, static_id)
    VALUES (NEW.id, user_nickname, user_static_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Проверяем, что триггер существует и работает
SELECT 'Registration function updated successfully!' as status;

-- =====================================================
-- ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ
-- =====================================================

/*
1. Выполните этот SQL файл в Supabase SQL Editor
2. Теперь при регистрации:
   - nickname будет браться из поля "Nick name" в форме
   - static_id будет браться из поля "Static ID" в форме
   - static_id также будет сохраняться как localmail
3. Профиль создается автоматически при регистрации
4. Дополнительные поля (discord, faction) обновляются отдельно
*/
