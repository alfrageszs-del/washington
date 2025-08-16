-- =====================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИК БЕЗОПАСНОСТИ ДЛЯ ШТРАФОВ
-- =====================================================

-- Включаем RLS для таблицы штрафов
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Everyone can view fines" ON fines;
DROP POLICY IF EXISTS "Law enforcement can manage fines" ON fines;

-- Создаем новые политики для штрафов
CREATE POLICY "Everyone can view fines" ON fines
    FOR SELECT USING (true);

CREATE POLICY "Law enforcement can manage fines" ON fines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
            OR profiles.faction IN ('LSPD', 'LSCSD', 'FIB')
        )
    );

-- Даем права на вставку, обновление и удаление для авторизованных пользователей
GRANT ALL ON fines TO authenticated;

-- Проверяем что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'fines';

-- Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fines';
