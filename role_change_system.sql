-- =====================================================
-- СИСТЕМА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ (ОБНОВЛЕННАЯ ВЕРСИЯ)
-- =====================================================

-- Включаем расширения (если еще не включены)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS role_change_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('FACTION', 'GOV_ROLE', 'LEADER_ROLE', 'OFFICE_ROLE')),
    current_value TEXT,
    requested_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_comment TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_type ON role_change_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_created_at ON role_change_requests(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS для таблицы запросов на изменение ролей
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Политики для запросов на изменение ролей
CREATE POLICY "Users can view their own role change requests" ON role_change_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requested_by);

CREATE POLICY "Users can create role change requests" ON role_change_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can view all role change requests" ON role_change_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

CREATE POLICY "Admins can update role change requests" ON role_change_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- =====================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- =====================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at в role_change_requests
CREATE TRIGGER update_role_change_requests_updated_at 
    BEFORE UPDATE ON role_change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для создания уведомления при изменении статуса запроса на роль
CREATE OR REPLACE FUNCTION create_role_change_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, type, title, message, priority, url)
        VALUES (
            NEW.user_id,
            'role_change',
            CASE 
                WHEN NEW.status = 'APPROVED' THEN 'Запрос на изменение роли одобрен'
                WHEN NEW.status = 'REJECTED' THEN 'Запрос на изменение роли отклонен'
                ELSE 'Обновление запроса на изменение роли'
            END,
            CASE 
                WHEN NEW.status = 'APPROVED' THEN 'Ваш запрос на изменение роли был одобрен администратором.'
                WHEN NEW.status = 'REJECTED' THEN 'Ваш запрос на изменение роли был отклонен. Причина: ' || COALESCE(NEW.review_comment, 'не указана')
                ELSE 'Статус вашего запроса на изменение роли обновлен.'
            END,
            CASE 
                WHEN NEW.status IN ('APPROVED', 'REJECTED') THEN 'high'
                ELSE 'medium'
            END,
            '/admin/role-requests'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для создания уведомлений при изменении статуса запроса
CREATE TRIGGER create_role_change_notification_trigger
    AFTER UPDATE ON role_change_requests
    FOR EACH ROW EXECUTE FUNCTION create_role_change_notification();

-- =====================================================
-- ОБНОВЛЕНИЕ ТАБЛИЦЫ УВЕДОМЛЕНИЙ (если нужно)
-- =====================================================

-- Добавляем новый тип уведомлений в таблицу notifications (если таблица существует)
-- Если таблицы notifications нет, раскомментируйте и выполните:

/*
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document', 'court', 'fine', 'wanted', 'system', 'role_change')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS для уведомлений
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
*/

-- =====================================================
-- ОБНОВЛЕНИЕ ПОЛИТИК ПРОФИЛЕЙ
-- =====================================================

-- Обновляем политику профилей, чтобы пользователи не могли изменять роли напрямую
-- Сначала удаляем старую политику, если она существует
DROP POLICY IF EXISTS "Users can update their own profile (except roles)" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Создаем новую политику, которая разрешает обновление только определенных полей
CREATE POLICY "Users can update their own profile (except roles)" ON profiles
    FOR UPDATE USING (
        auth.uid() = id 
        AND (
            -- Разрешаем обновление только определенных полей
            (OLD.faction = NEW.faction) AND
            (OLD.gov_role = NEW.gov_role) AND
            (OLD.leader_role = NEW.leader_role) AND
            (OLD.office_role = NEW.office_role)
        )
    );

-- =====================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- =====================================================

/*
-- Создание запроса на изменение роли (выполняется пользователем)
INSERT INTO role_change_requests (
    user_id,
    requested_by,
    request_type,
    current_value,
    requested_value,
    reason
) VALUES (
    'user-uuid-here',
    'requesting-user-uuid-here',
    'FACTION',
    'CIVILIAN',
    'LSPD',
    'Хочу вступить в полицию'
);

-- Одобрение запроса администратором
UPDATE role_change_requests 
SET 
    status = 'APPROVED',
    reviewed_by = 'admin-uuid-here',
    review_comment = 'Одобрено',
    reviewed_at = NOW()
WHERE id = 'request-uuid-here';

-- Обновление профиля пользователя после одобрения
UPDATE profiles 
SET faction = 'LSPD' 
WHERE id = 'user-uuid-here';
*/

-- =====================================================
-- ПРОВЕРКИ И ВАЛИДАЦИЯ
-- =====================================================

-- Проверяем, что таблица создана
SELECT 'role_change_requests table created successfully' as status;

-- Проверяем индексы
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'role_change_requests';

-- Проверяем политики RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'role_change_requests';

-- Проверяем триггеры
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'role_change_requests';
