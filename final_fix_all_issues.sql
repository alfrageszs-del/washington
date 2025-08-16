-- =====================================================
-- ИТОГОВЫЙ СКРИПТ ИСПРАВЛЕНИЯ ВСЕХ ПРОБЛЕМ
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- СОЗДАНИЕ НЕДОСТАЮЩИХ ТАБЛИЦ
-- =====================================================

-- Создаем таблицу для участников дел, если её нет
CREATE TABLE IF NOT EXISTS case_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    static_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для документов дел, если её нет
CREATE TABLE IF NOT EXISTS case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для событий дел, если её нет
CREATE TABLE IF NOT EXISTS case_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event VARCHAR(255) NOT NULL,
    description TEXT,
    document_id UUID REFERENCES case_documents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем ENUM для типов ордеров
CREATE TYPE warrant_type_enum AS ENUM ('AS');

-- Создаем ENUM для статусов ордеров
CREATE TYPE warrant_status_enum AS ENUM ('active', 'expired', 'executed');

-- Создаем таблицу ордеров
CREATE TABLE IF NOT EXISTS warrants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type warrant_type_enum NOT NULL DEFAULT 'AS',
    target_name VARCHAR(255) NOT NULL,
    target_id VARCHAR(100),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    warrant_url TEXT NOT NULL,
    articles TEXT[] NOT NULL,
    description TEXT,
    issued_by VARCHAR(255) NOT NULL,
    issued_by_id UUID NOT NULL REFERENCES profiles(id),
    status warrant_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИК БЕЗОПАСНОСТИ
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE warrants ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Everyone can view cases" ON cases;
DROP POLICY IF EXISTS "Judges and prosecutors can manage cases" ON cases;
DROP POLICY IF EXISTS "Everyone can view published court acts" ON court_acts;
DROP POLICY IF EXISTS "Judges and prosecutors can manage court acts" ON court_acts;
DROP POLICY IF EXISTS "Everyone can view court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Judges can manage court sessions" ON court_sessions;
DROP POLICY IF EXISTS "Everyone can view fines" ON fines;
DROP POLICY IF EXISTS "Law enforcement can manage fines" ON fines;

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

-- Создаем политики для штрафов
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

-- Создаем политики для ордеров
CREATE POLICY "Everyone can view warrants" ON warrants
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage warrants" ON warrants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- =====================================================
-- НАСТРОЙКА ПРАВ ДОСТУПА
-- =====================================================

-- Даем права на вставку, обновление и удаление для авторизованных пользователей
GRANT ALL ON cases TO authenticated;
GRANT ALL ON court_acts TO authenticated;
GRANT ALL ON court_sessions TO authenticated;
GRANT ALL ON case_participants TO authenticated;
GRANT ALL ON case_documents TO authenticated;
GRANT ALL ON case_events TO authenticated;
GRANT ALL ON fines TO authenticated;
GRANT ALL ON warrants TO authenticated;

-- Даем права на использование последовательностей
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- СОЗДАНИЕ ИНДЕКСОВ И ТРИГГЕРОВ
-- =====================================================

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_case_participants_case_id ON case_participants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_participants_user_id ON case_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);

-- Создаем индексы для ордеров
CREATE INDEX IF NOT EXISTS idx_warrants_target_name ON warrants(target_name);
CREATE INDEX IF NOT EXISTS idx_warrants_target_id ON warrants(target_id);
CREATE INDEX IF NOT EXISTS idx_warrants_issued_by_id ON warrants(issued_by_id);
CREATE INDEX IF NOT EXISTS idx_warrants_status ON warrants(status);
CREATE INDEX IF NOT EXISTS idx_warrants_valid_until ON warrants(valid_until);

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применяем триггер к таблицам
CREATE TRIGGER update_case_participants_updated_at 
    BEFORE UPDATE ON case_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_documents_updated_at 
    BEFORE UPDATE ON case_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warrants_updated_at 
    BEFORE UPDATE ON warrants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================================

-- Проверяем что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cases', 'court_acts', 'court_sessions', 'case_participants', 'case_documents', 'case_events', 'fines', 'warrants');

-- Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('cases', 'court_acts', 'court_sessions', 'case_participants', 'case_documents', 'case_events', 'fines', 'warrants');

-- Проверяем существование таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('case_participants', 'case_documents', 'case_events', 'warrants');

-- Проверяем права доступа
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('cases', 'court_acts', 'court_sessions', 'case_participants', 'case_documents', 'case_events', 'fines', 'warrants')
AND grantee = 'authenticated';
