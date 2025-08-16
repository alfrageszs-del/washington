-- =====================================================
-- ДОБАВЛЕНИЕ КОЛОНКИ source_url В ТАБЛИЦЫ АКТОВ
-- =====================================================

-- Добавляем колонку source_url в таблицу court_acts
ALTER TABLE court_acts 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Добавляем колонку source_url в таблицу gov_acts
ALTER TABLE gov_acts 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Проверяем что колонки добавлены
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'court_acts' AND column_name = 'source_url';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gov_acts' AND column_name = 'source_url';

-- Обновляем существующие записи (если есть)
UPDATE court_acts SET source_url = 'https://example.com/document' WHERE source_url IS NULL;
UPDATE gov_acts SET source_url = 'https://example.com/document' WHERE source_url IS NULL;
