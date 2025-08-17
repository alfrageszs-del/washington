-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ УВЕДОМЛЕНИЙ (БЕЗ ENUM'ОВ)
-- =====================================================
-- ПРИМЕЧАНИЕ: Сначала запустите create_notification_enums.sql

-- 1. Проверяем, что ENUM'ы существуют
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        RAISE EXCEPTION 'ENUM notification_type_enum не найден. Сначала запустите create_notification_enums.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority_enum') THEN
        RAISE EXCEPTION 'ENUM notification_priority_enum не найден. Сначала запустите create_notification_enums.sql';
    END IF;
    
    RAISE NOTICE 'ENUM''ы найдены, продолжаем создание таблицы...';
END $$;

-- 2. Создаем таблицу notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    url TEXT,
    priority notification_priority_enum NOT NULL DEFAULT 'medium',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 4. Включаем RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Создаем политики RLS
-- Пользователи могут видеть только свои уведомления
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут обновлять только свои уведомления
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут удалять только свои уведомления
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Система может создавать уведомления для пользователей
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 6. Даем права доступа
GRANT ALL ON TABLE notifications TO authenticated;
GRANT ALL ON TABLE notifications TO anon;
GRANT ALL ON TABLE notifications TO service_role;

-- 7. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- 9. Создаем функцию для создания системных уведомлений
CREATE OR REPLACE FUNCTION create_system_notification(
    p_user_id UUID,
    p_type notification_type_enum,
    p_title TEXT,
    p_message TEXT,
    p_priority notification_priority_enum DEFAULT 'medium',
    p_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, priority, url
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_priority, p_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION create_system_notification(UUID, notification_type_enum, TEXT, TEXT, notification_priority_enum, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_system_notification(UUID, notification_type_enum, TEXT, TEXT, notification_priority_enum, TEXT) TO service_role;

-- 11. Создаем несколько тестовых уведомлений (опционально)
INSERT INTO notifications (
    user_id, type, title, message, priority, url
) 
SELECT 
    u.id,
    'system'::notification_type_enum,
    'Добро пожаловать в систему!',
    'Ваш аккаунт успешно создан. Теперь вы можете использовать все функции системы.',
    'low'::notification_priority_enum,
    '/account'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'system'
)
LIMIT 1;

-- 12. Проверяем создание таблицы
SELECT 
    'Table creation status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public')
        THEN 'SUCCESS - Table created'
        ELSE 'FAILED - Table not created'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications')
        THEN 'SUCCESS - RLS policies created'
        ELSE 'FAILED - RLS policies not created'
    END as policies_status;

-- 13. Показываем структуру таблицы
SELECT 
    'Table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. Показываем политики RLS
SELECT 
    'RLS policies' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- 15. Показываем созданные уведомления
SELECT 
    'Test notifications' as info,
    id,
    user_id,
    type,
    title,
    priority,
    is_read,
    created_at
FROM notifications
ORDER BY created_at DESC;

RAISE NOTICE 'Таблица notifications создана успешно!';
RAISE NOTICE 'ENUM''ы должны быть созданы заранее через create_notification_enums.sql';
