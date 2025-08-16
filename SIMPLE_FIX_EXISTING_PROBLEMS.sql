-- =====================================================
-- ПРОСТОЙ СКРИПТ ИСПРАВЛЕНИЯ СУЩЕСТВУЮЩИХ ПРОБЛЕМ
-- =====================================================

-- 1. Добавляем колонку source_url в существующие таблицы актов
ALTER TABLE court_acts ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE gov_acts ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 2. Обновляем существующие записи (если есть)
UPDATE court_acts SET source_url = 'https://example.com/document' WHERE source_url IS NULL;
UPDATE gov_acts SET source_url = 'https://example.com/document' WHERE source_url IS NULL;

-- 3. Включаем RLS для существующих таблиц (если не включен)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- 4. Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Everyone can view cases" ON cases;
DROP POLICY IF EXISTS "Judges and prosecutors can manage cases" ON cases;
DROP POLICY IF EXISTS "Everyone can view published court acts" ON court_acts;
DROP POLICY IF EXISTS "Judges and prosecutors can manage court acts" ON court_acts;
DROP POLICY IF EXISTS "Everyone can view court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Judges can manage court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Everyone can view fines" ON fines;
DROP POLICY IF EXISTS "Law enforcement can manage fines" ON fines;

-- 5. Создаем новые политики для существующих таблиц
CREATE POLICY "Everyone can view cases" ON cases FOR SELECT USING (true);
CREATE POLICY "Judges and prosecutors can manage cases" ON cases FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
    AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN'))
);

CREATE POLICY "Everyone can view published court acts" ON court_acts FOR SELECT USING (status = 'published');
CREATE POLICY "Judges and prosecutors can manage court acts" ON court_acts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
    AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN'))
);

CREATE POLICY "Everyone can view court sessions" ON court_sessions FOR SELECT USING (true);
CREATE POLICY "Judges can manage court sessions" ON court_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
    AND profiles.gov_role IN ('JUDGE', 'CHIEF_JUSTICE', 'TECH_ADMIN'))
);

CREATE POLICY "Everyone can view fines" ON fines FOR SELECT USING (true);
CREATE POLICY "Law enforcement can manage fines" ON fines FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
    AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
    OR profiles.faction IN ('LSPD', 'LSCSD', 'FIB'))
);

-- 6. Даем права на существующие таблицы
GRANT ALL ON cases TO authenticated;
GRANT ALL ON court_acts TO authenticated;
GRANT ALL ON court_sessions TO authenticated;
GRANT ALL ON fines TO authenticated;

-- 7. Проверяем результат
SELECT 'source_url column added to court_acts' as status, 
       column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'court_acts' AND column_name = 'source_url';

SELECT 'source_url column added to gov_acts' as status, 
       column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gov_acts' AND column_name = 'source_url';
