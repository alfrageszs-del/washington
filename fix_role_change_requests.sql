-- =====================================================
-- ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ROLE_CHANGE_REQUESTS
-- =====================================================
-- Этот файл исправляет проблему с отсутствующей колонкой requested_faction_value
-- Запускать ПОСЛЕ основного database_schema.sql и fix_database_issues_v2.sql

-- =====================================================
-- 1. ДОБАВЛЕНИЕ ОТСУТСТВУЮЩЕЙ КОЛОНКИ
-- =====================================================

-- Добавляем колонку requested_faction_value в таблицу role_change_requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'role_change_requests' AND column_name = 'requested_faction_value') THEN
        ALTER TABLE role_change_requests ADD COLUMN requested_faction_value TEXT;
    END IF;
END $$;

-- =====================================================
-- 2. ОБНОВЛЕНИЕ ИНДЕКСОВ
-- =====================================================

-- Добавляем индекс для requested_faction_value
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_change_requests_requested_faction') THEN
        CREATE INDEX idx_role_change_requests_requested_faction ON role_change_requests(requested_faction_value);
    END IF;
END $$;

-- =====================================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================================

-- Проверяем, что колонка добавлена
SELECT 
    'role_change_requests.requested_faction_value' as column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'role_change_requests' AND column_name = 'requested_faction_value') 
        THEN 'OK' 
        ELSE 'MISSING' 
    END as status;

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Выводим сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE 'Колонка requested_faction_value добавлена в таблицу role_change_requests!';
    RAISE NOTICE 'Теперь запросы на изменение ролей должны работать корректно.';
END $$;
