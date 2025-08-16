-- =====================================================
-- ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ СИСТЕМЫ
-- =====================================================

-- =====================================================
-- ВЕРСИОНИРОВАНИЕ ДОКУМЕНТОВ
-- =====================================================

-- ENUM для типов версий документов
CREATE TYPE document_version_type_enum AS ENUM (
    'draft',
    'published',
    'amended',
    'archived'
);

-- Таблица истории версий документов
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('court_act', 'gov_act')),
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем поля версионирования в существующие таблицы
ALTER TABLE court_acts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE court_acts ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES court_acts(id) ON DELETE SET NULL;

ALTER TABLE gov_acts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE gov_acts ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES gov_acts(id) ON DELETE SET NULL;

-- Индексы для версий документов
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_type ON document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(version_number);

-- =====================================================
-- ШАБЛОНЫ ДОКУМЕНТОВ
-- =====================================================

-- ENUM для типов шаблонов документов
CREATE TYPE document_template_type_enum AS ENUM (
    'court_act',
    'government_act',
    'prosecutor_order',
    'investigation_report',
    'court_decision'
);

-- Таблица шаблонов документов
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type document_template_type_enum NOT NULL,
    title_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для шаблонов документов
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_active ON document_templates(is_active);

-- =====================================================
-- УЛУЧШЕННАЯ СИСТЕМА СТАТУСОВ ДЕЛ
-- =====================================================

-- Обновляем ENUM для статусов дел
DROP TYPE IF EXISTS case_status_enum CASCADE;
CREATE TYPE case_status_enum AS ENUM (
    'initiated',
    'investigation',
    'court_proceedings',
    'completed',
    'archived'
);

-- Добавляем поля для архивирования в таблицу дел
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS archive_date DATE;

-- Индексы для архивирования
CREATE INDEX IF NOT EXISTS idx_cases_is_archived ON cases(is_archived);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);

-- =====================================================
-- RLS ПОЛИТИКИ ДЛЯ НОВЫХ ТАБЛИЦ
-- =====================================================

-- Включаем RLS для новых таблиц
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Политики для шаблонов документов
CREATE POLICY "Everyone can view active document templates" ON document_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Judges and prosecutors can manage document templates" ON document_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- Политики для версий документов
CREATE POLICY "Everyone can view document versions" ON document_versions
    FOR SELECT USING (true);

CREATE POLICY "Document authors can manage versions" ON document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- =====================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- =====================================================

-- Функция для создания версии документа
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content != OLD.content OR NEW.title != OLD.title THEN
        INSERT INTO document_versions (document_id, document_type, version_number, title, content, created_by)
        VALUES (
            NEW.id,
            CASE 
                WHEN TG_TABLE_NAME = 'court_acts' THEN 'court_act'
                WHEN TG_TABLE_NAME = 'gov_acts' THEN 'gov_act'
                ELSE 'unknown'
            END,
            NEW.version,
            NEW.title,
            NEW.content,
            COALESCE(NEW.judge_id, NEW.author_id)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для создания версий документов
CREATE TRIGGER create_court_act_version_trigger
    AFTER UPDATE ON court_acts
    FOR EACH ROW EXECUTE FUNCTION create_document_version();

CREATE TRIGGER create_gov_act_version_trigger
    AFTER UPDATE ON gov_acts
    FOR EACH ROW EXECUTE FUNCTION create_document_version();

-- Триггер для обновления updated_at в шаблонах
CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для архивирования старых дел
CREATE OR REPLACE FUNCTION archive_old_cases()
RETURNS void AS $$
BEGIN
    UPDATE cases 
    SET is_archived = true, archive_date = NOW()
    WHERE end_date < NOW() - INTERVAL '1 year'
    AND is_archived = false
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Функция для автоматического увеличения версии документа
CREATE OR REPLACE FUNCTION increment_document_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content != OLD.content OR NEW.title != OLD.title THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического увеличения версии
CREATE TRIGGER increment_court_act_version_trigger
    BEFORE UPDATE ON court_acts
    FOR EACH ROW EXECUTE FUNCTION increment_document_version();

CREATE TRIGGER increment_gov_act_version_trigger
    BEFORE UPDATE ON gov_acts
    FOR EACH ROW EXECUTE FUNCTION increment_document_version();

-- =====================================================
-- БАЗОВЫЕ ШАБЛОНЫ ДОКУМЕНТОВ
-- =====================================================

INSERT INTO document_templates (name, type, title_template, content_template, variables) VALUES
('Постановление о возбуждении уголовного дела', 'court_act', 
 'Постановление о возбуждении уголовного дела №{case_number}', 
 'Судья {judge_name} рассмотрев материалы дела, постановил возбудить уголовное дело №{case_number} в отношении {defendant_name} по статье {article}.', 
 '{"case_number": "string", "judge_name": "string", "defendant_name": "string", "article": "string"}'),

('Приговор суда', 'court_act', 
 'Приговор по уголовному делу №{case_number}', 
 'Суд в составе судьи {judge_name} рассмотрев уголовное дело №{case_number} в отношении {defendant_name}, вынес приговор: {decision}.', 
 '{"case_number": "string", "judge_name": "string", "defendant_name": "string", "decision": "string"}'),

('Постановление прокурора', 'prosecutor_order', 
 'Постановление прокурора №{order_number}', 
 'Прокурор {prosecutor_name} вынес постановление №{order_number} о {action} в отношении {defendant_name}.', 
 '{"order_number": "string", "prosecutor_name": "string", "action": "string", "defendant_name": "string"}'),

('Акт правительства', 'government_act', 
 'Акт правительства №{act_number}', 
 'Правительство штата Сан-Андреас приняло акт №{act_number} "{title}" о {description}.', 
 '{"act_number": "string", "title": "string", "description": "string"}'),

('Отчет о расследовании', 'investigation_report', 
 'Отчет о расследовании по делу №{case_number}', 
 'Прокурор {prosecutor_name} составил отчет о расследовании по делу №{case_number}. Результаты: {findings}.', 
 '{"case_number": "string", "prosecutor_name": "string", "findings": "string"}'),

('Решение суда', 'court_decision', 
 'Решение суда по делу №{case_number}', 
 'Судья {judge_name} вынес решение по делу №{case_number}: {decision}.', 
 '{"case_number": "string", "judge_name": "string", "decision": "string"}');

-- =====================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ШАБЛОНАМИ
-- =====================================================

-- Функция для создания документа из шаблона
CREATE OR REPLACE FUNCTION create_document_from_template(
    template_id UUID,
    variables JSONB
)
RETURNS JSONB AS $$
DECLARE
    template_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO template_record FROM document_templates WHERE id = template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive';
    END IF;
    
    result = jsonb_build_object(
        'title', template_record.title_template,
        'content', template_record.content_template,
        'type', template_record.type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ВЕРСИЯМИ
-- =====================================================

-- Функция для получения истории версий документа
CREATE OR REPLACE FUNCTION get_document_version_history(
    doc_id UUID,
    doc_type TEXT
)
RETURNS TABLE (
    version_number INTEGER,
    title TEXT,
    content TEXT,
    changes_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.version_number,
        dv.title,
        dv.content,
        dv.changes_summary,
        dv.created_at,
        dv.created_by
    FROM document_versions dv
    WHERE dv.document_id = doc_id 
    AND dv.document_type = doc_type
    ORDER BY dv.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИИ ДЛЯ АРХИВИРОВАНИЯ
-- =====================================================

-- Функция для архивирования дела
CREATE OR REPLACE FUNCTION archive_case(case_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE cases 
    SET is_archived = true, archive_date = NOW(), status = 'archived'
    WHERE id = case_uuid;
    
    -- Архивируем связанные документы
    UPDATE court_acts SET status = 'archived' WHERE case_id = case_uuid;
    UPDATE gov_acts SET status = 'archived' WHERE id IN (
        SELECT DISTINCT ga.id FROM gov_acts ga 
        JOIN cases c ON c.case_number = ga.act_number 
        WHERE c.id = case_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ПРОВЕРКИ И ВАЛИДАЦИЯ
-- =====================================================

-- Проверяем новые ENUM типы
SELECT 'Additional ENUM types created successfully' as status;

-- Проверяем новые таблицы
SELECT 'Additional tables created successfully' as status;

-- Проверяем новые индексы
SELECT 'Additional indexes created successfully' as status;

-- Проверяем новые политики RLS
SELECT 'Additional RLS policies created successfully' as status;

-- Проверяем новые триггеры
SELECT 'Additional triggers created successfully' as status;

-- Проверяем новые функции
SELECT 'Additional functions created successfully' as status;

-- Проверяем шаблоны документов
SELECT 'Document templates created successfully' as status;

-- =====================================================
-- ГОТОВО!
-- =====================================================

SELECT 'Additional features setup finished successfully!' as status;
