-- =====================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИК БЕЗОПАСНОСТИ И ПРАВ ДОСТУПА
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Everyone can view cases" ON cases;
DROP POLICY IF EXISTS "Judges and prosecutors can manage cases" ON cases;
DROP POLICY IF EXISTS "Everyone can view published court acts" ON court_acts;
DROP POLICY IF EXISTS "Judges and prosecutors can manage court acts" ON court_acts;
DROP POLICY IF EXISTS "Everyone can view court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Judges can manage court sessions" ON court_sessions;

-- Создаем новые политики для дел
CREATE POLICY "Everyone can view cases" ON cases
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage cases" ON cases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Создаем новые политики для актов суда
CREATE POLICY "Everyone can view published court acts" ON court_acts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Judges and prosecutors can manage court acts" ON court_acts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Создаем новые политики для судебных заседаний
CREATE POLICY "Everyone can view court sessions" ON court_sessions
    FOR SELECT USING (true);

CREATE POLICY "Judges can manage court sessions" ON court_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Создаем политики для участников дел
CREATE POLICY "Everyone can view case participants" ON case_participants
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage case participants" ON case_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Создаем политики для документов дел
CREATE POLICY "Everyone can view case documents" ON case_documents
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage case documents" ON case_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Создаем политики для событий дел
CREATE POLICY "Everyone can view case events" ON case_events
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage case events" ON case_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Даем права на вставку, обновление и удаление для авторизованных пользователей
GRANT ALL ON cases TO authenticated;
GRANT ALL ON court_acts TO authenticated;
GRANT ALL ON court_sessions TO authenticated;
GRANT ALL ON case_participants TO authenticated;
GRANT ALL ON case_documents TO authenticated;
GRANT ALL ON case_events TO authenticated;

-- Даем права на использование последовательностей
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Проверяем что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cases', 'court_acts', 'court_sessions', 'case_participants', 'case_documents', 'case_events');

-- Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('cases', 'court_acts', 'court_sessions', 'case_participants', 'case_documents', 'case_events');
