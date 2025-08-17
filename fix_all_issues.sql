-- =====================================================
-- СКРИПТ ДЛЯ ИСПРАВЛЕНИЯ ВСЕХ ПРОБЛЕМ
-- =====================================================

-- 1. Добавляем поле target_static_id в таблицу ордеров
ALTER TABLE warrants ADD COLUMN IF NOT EXISTS target_static_id TEXT;

-- 2. Обновляем таблицу адвокатов
ALTER TABLE lawyers RENAME COLUMN IF EXISTS license_number TO certificate_number;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS years_in_government INTEGER NOT NULL DEFAULT 0;

-- 3. Создаем ENUM для статусов заседаний суда
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'court_session_status_enum') THEN
        CREATE TYPE court_session_status_enum AS ENUM (
            'scheduled',
            'in_progress',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- 4. Обновляем таблицу заседаний суда для использования ENUM
ALTER TABLE court_sessions 
ALTER COLUMN status TYPE court_session_status_enum 
USING status::court_session_status_enum;

-- 5. Устанавливаем значение по умолчанию для статуса заседаний
ALTER TABLE court_sessions 
ALTER COLUMN status SET DEFAULT 'scheduled';

-- 6. Обновляем права доступа для штрафов (только GOV и судейский корпус)
-- Это уже настроено в RLS политиках, но можно проверить

-- 7. Проверяем, что все изменения применены
SELECT 
    'warrants' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'warrants' 
AND column_name IN ('target_static_id')
UNION ALL
SELECT 
    'lawyers' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lawyers' 
AND column_name IN ('certificate_number', 'years_in_government')
UNION ALL
SELECT 
    'court_sessions' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'court_sessions' 
AND column_name = 'status';

-- 8. Проверяем ENUM'ы
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'court_session_status_enum'
ORDER BY e.enumsortorder;
