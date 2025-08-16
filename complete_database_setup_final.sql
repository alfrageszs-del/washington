-- =====================================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ (ФИНАЛЬНАЯ ВЕРСИЯ)
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- СОЗДАНИЕ ENUM ТИПОВ ДЛЯ РОЛЕЙ
-- =====================================================

-- ENUM для государственных ролей
CREATE TYPE gov_role_enum AS ENUM (
    'NONE',
    'PROSECUTOR',
    'JUDGE',
    'TECH_ADMIN',
    'ATTORNEY_GENERAL',
    'CHIEF_JUSTICE'
);

-- ENUM для фракций
CREATE TYPE faction_enum AS ENUM (
    'CIVILIAN',
    'GOV',
    'COURT',
    'WN',
    'FIB',
    'LSPD',
    'LSCSD',
    'EMS',
    'SANG'
);

-- ENUM для лидерских ролей
CREATE TYPE leader_role_enum AS ENUM (
    'GOVERNOR',
    'DIRECTOR_WN',
    'DIRECTOR_FIB',
    'CHIEF_LSPD',
    'SHERIFF_LSCSD',
    'CHIEF_EMS',
    'COLONEL_SANG'
);

-- ENUM для офисных ролей
CREATE TYPE office_role_enum AS ENUM (
    'GOVERNOR',
    'VICE_GOVERNOR',
    'MIN_FINANCE',
    'MIN_JUSTICE',
    'BAR_ASSOCIATION',
    'GOV_STAFF',
    'MIN_DEFENSE',
    'MIN_SECURITY',
    'MIN_HEALTH',
    'OTHER'
);

-- ENUM для типов запросов на изменение ролей
CREATE TYPE role_change_request_type_enum AS ENUM (
    'FACTION',
    'GOV_ROLE',
    'LEADER_ROLE',
    'OFFICE_ROLE'
);

-- ENUM для статусов запросов на изменение ролей
CREATE TYPE role_change_request_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- ENUM для типов уведомлений
CREATE TYPE notification_type_enum AS ENUM (
    'document',
    'court',
    'fine',
    'wanted',
    'system',
    'role_change'
);

-- ENUM для приоритетов уведомлений
CREATE TYPE notification_priority_enum AS ENUM (
    'low',
    'medium',
    'high'
);

-- ENUM для статусов документов
CREATE TYPE document_status_enum AS ENUM (
    'draft',
    'published',
    'archived'
);

-- ENUM для статусов штрафов
CREATE TYPE fine_status_enum AS ENUM (
    'active',
    'paid',
    'cancelled'
);

-- ENUM для статусов розыска
CREATE TYPE wanted_status_enum AS ENUM (
    'active',
    'caught',
    'cancelled'
);

-- ENUM для типов дел
CREATE TYPE case_type_enum AS ENUM (
    'criminal',
    'civil',
    'administrative'
);

-- ENUM для статусов дел
CREATE TYPE case_status_enum AS ENUM (
    'active',
    'closed',
    'pending'
);

-- ENUM для типов адвокатов
CREATE TYPE lawyer_type_enum AS ENUM (
    'government',
    'private'
);

-- ENUM для статусов адвокатов
CREATE TYPE lawyer_status_enum AS ENUM (
    'available',
    'busy',
    'unavailable'
);

-- ENUM для статусов запросов на адвоката
CREATE TYPE lawyer_request_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'assigned'
);

-- ENUM для статусов договоров адвокатов
CREATE TYPE lawyer_contract_status_enum AS ENUM (
    'active',
    'completed',
    'terminated'
);

-- ENUM для типов судебных заседаний
CREATE TYPE court_session_type_enum AS ENUM (
    'open',
    'closed'
);

-- ENUM для статусов судебных заседаний
CREATE TYPE court_session_status_enum AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);

-- ENUM для статусов проверок
CREATE TYPE inspection_status_enum AS ENUM (
    'scheduled',
    'in_progress',
    'completed'
);

-- =====================================================
-- ТАБЛИЦА ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT NOT NULL,
    static_id TEXT NOT NULL UNIQUE,
    faction faction_enum NOT NULL DEFAULT 'CIVILIAN',
    gov_role gov_role_enum NOT NULL DEFAULT 'NONE',
    leader_role leader_role_enum,
    office_role office_role_enum,
    discord TEXT,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS role_change_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_type role_change_request_type_enum NOT NULL,
    current_value TEXT,
    requested_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status role_change_request_status_enum NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_comment TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА УВЕДОМЛЕНИЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    priority notification_priority_enum NOT NULL DEFAULT 'medium',
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ДЕЛ
-- =====================================================

CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT NOT NULL UNIQUE,
    type case_type_enum NOT NULL,
    status case_status_enum NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prosecutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lawyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА АКТОВ СУДА
-- =====================================================

CREATE TABLE IF NOT EXISTS court_acts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    case_number TEXT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    judge_name TEXT,
    defendant_static_id TEXT,
    defendant_name TEXT,
    articles TEXT[],
    decision TEXT,
    status document_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА АКТОВ ПРАВИТЕЛЬСТВА
-- =====================================================

CREATE TABLE IF NOT EXISTS gov_acts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    act_number TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    department TEXT,
    status document_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ШТРАФОВ
-- =====================================================

CREATE TABLE IF NOT EXISTS fines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    defendant_static_id TEXT NOT NULL,
    defendant_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    officer_name TEXT,
    department TEXT,
    status fine_status_enum NOT NULL DEFAULT 'active',
    due_date DATE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА РОЗЫСКА
-- =====================================================

CREATE TABLE IF NOT EXISTS wanted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    suspect_static_id TEXT NOT NULL,
    suspect_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    reward DECIMAL(10,2),
    department TEXT,
    status wanted_status_enum NOT NULL DEFAULT 'active',
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА АДВОКАТОВ
-- =====================================================

CREATE TABLE IF NOT EXISTS lawyers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type lawyer_type_enum NOT NULL,
    specialization TEXT[],
    experience INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    cases_count INTEGER DEFAULT 0,
    status lawyer_status_enum NOT NULL DEFAULT 'available',
    contact TEXT,
    price TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА АДВОКАТА
-- =====================================================

CREATE TABLE IF NOT EXISTS lawyer_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_static_id TEXT NOT NULL,
    case_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status lawyer_request_status_enum NOT NULL DEFAULT 'pending',
    assigned_lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ДОГОВОРОВ АДВОКАТОВ
-- =====================================================

CREATE TABLE IF NOT EXISTS lawyer_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_number TEXT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    contract_terms TEXT NOT NULL,
    fee_amount DECIMAL(10,2),
    fee_currency TEXT DEFAULT 'USD',
    status lawyer_contract_status_enum NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА СУДЕБНЫХ ЗАСЕДАНИЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS court_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    judge_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type court_session_type_enum NOT NULL,
    status court_session_status_enum NOT NULL DEFAULT 'scheduled',
    participants TEXT[],
    description TEXT,
    courtroom TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ПРОВЕРОК
-- =====================================================

CREATE TABLE IF NOT EXISTS inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inspector_name TEXT NOT NULL,
    department TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    findings TEXT,
    recommendations TEXT,
    status inspection_status_enum NOT NULL DEFAULT 'completed',
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для профилей
CREATE INDEX IF NOT EXISTS idx_profiles_static_id ON profiles(static_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faction ON profiles(faction);
CREATE INDEX IF NOT EXISTS idx_profiles_gov_role ON profiles(gov_role);
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);

-- Индексы для запросов на изменение ролей
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_type ON role_change_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_created_at ON role_change_requests(created_at);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Индексы для дел
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(type);

-- Индексы для актов суда
CREATE INDEX IF NOT EXISTS idx_court_acts_case_number ON court_acts(case_number);
CREATE INDEX IF NOT EXISTS idx_court_acts_case_id ON court_acts(case_id);
CREATE INDEX IF NOT EXISTS idx_court_acts_defendant_static_id ON court_acts(defendant_static_id);
CREATE INDEX IF NOT EXISTS idx_court_acts_status ON court_acts(status);

-- Индексы для актов правительства
CREATE INDEX IF NOT EXISTS idx_gov_acts_act_number ON gov_acts(act_number);
CREATE INDEX IF NOT EXISTS idx_gov_acts_status ON gov_acts(status);

-- Индексы для штрафов
CREATE INDEX IF NOT EXISTS idx_fines_defendant_static_id ON fines(defendant_static_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_case_id ON fines(case_id);

-- Индексы для розыска
CREATE INDEX IF NOT EXISTS idx_wanted_suspect_static_id ON wanted(suspect_static_id);
CREATE INDEX IF NOT EXISTS idx_wanted_status ON wanted(status);
CREATE INDEX IF NOT EXISTS idx_wanted_case_id ON wanted(case_id);

-- Индексы для адвокатов
CREATE INDEX IF NOT EXISTS idx_lawyers_type ON lawyers(type);
CREATE INDEX IF NOT EXISTS idx_lawyers_status ON lawyers(status);

-- Индексы для запросов на адвоката
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_client_id ON lawyer_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_status ON lawyer_requests(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_case_id ON lawyer_requests(case_id);

-- Индексы для договоров адвокатов
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_lawyer_id ON lawyer_contracts(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_client_id ON lawyer_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_status ON lawyer_contracts(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_case_id ON lawyer_contracts(case_id);

-- Индексы для судебных заседаний
CREATE INDEX IF NOT EXISTS idx_court_sessions_date ON court_sessions(date);
CREATE INDEX IF NOT EXISTS idx_court_sessions_status ON court_sessions(status);
CREATE INDEX IF NOT EXISTS idx_court_sessions_case_id ON court_sessions(case_id);

-- Индексы для проверок
CREATE INDEX IF NOT EXISTS idx_inspections_department ON inspections(department);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_case_id ON inspections(case_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Политики для профилей
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

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

-- Политики для уведомлений
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Политики для дел
CREATE POLICY "Everyone can view cases" ON cases
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage cases" ON cases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- Политики для актов суда
CREATE POLICY "Everyone can view published court acts" ON court_acts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Judges and prosecutors can manage court acts" ON court_acts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- Политики для актов правительства
CREATE POLICY "Everyone can view published government acts" ON gov_acts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Government officials can manage government acts" ON gov_acts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.faction = 'GOV'
        )
    );

-- Политики для штрафов
CREATE POLICY "Everyone can view fines" ON fines
    FOR SELECT USING (true);

CREATE POLICY "Law enforcement can manage fines" ON fines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.faction IN ('LSPD', 'LSCSD', 'FIB')
        )
    );

-- Политики для розыска
CREATE POLICY "Everyone can view wanted" ON wanted
    FOR SELECT USING (true);

CREATE POLICY "Law enforcement can manage wanted" ON wanted
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.faction IN ('LSPD', 'LSCSD', 'FIB')
        )
    );

-- Политики для адвокатов
CREATE POLICY "Everyone can view lawyers" ON lawyers
    FOR SELECT USING (true);

CREATE POLICY "Lawyers can manage their own profile" ON lawyers
    FOR ALL USING (auth.uid() = user_id);

-- Политики для запросов на адвоката
CREATE POLICY "Users can view their own lawyer requests" ON lawyer_requests
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can create lawyer requests" ON lawyer_requests
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Law enforcement can view all lawyer requests" ON lawyer_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.faction IN ('LSPD', 'LSCSD', 'FIB', 'COURT')
        )
    );

-- Политики для договоров адвокатов
CREATE POLICY "Everyone can view lawyer contracts" ON lawyer_contracts
    FOR SELECT USING (true);

CREATE POLICY "Lawyers can manage their contracts" ON lawyer_contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lawyers 
            WHERE lawyers.user_id = auth.uid() 
            AND lawyers.id = lawyer_contracts.lawyer_id
        )
    );

-- Политики для судебных заседаний
CREATE POLICY "Everyone can view court sessions" ON court_sessions
    FOR SELECT USING (true);

CREATE POLICY "Judges can manage court sessions" ON court_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'CHIEF_JUSTICE')
        )
    );

-- Политики для проверок
CREATE POLICY "Everyone can view inspections" ON inspections
    FOR SELECT USING (true);

CREATE POLICY "Inspectors can manage inspections" ON inspections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.faction IN ('EMS', 'GOV')
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

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
BEGIN
    -- Извлекаем nickname из метаданных
    user_nickname := COALESCE(
        NEW.raw_user_meta_data->>'nickname',
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    
    -- Извлекаем static_id из метаданных
    user_static_id := COALESCE(
        NEW.raw_user_meta_data->>'static_id',
        NEW.raw_user_meta_data->>'localmail',
        'ID_' || substr(NEW.id::text, 1, 8)
    );
    
    -- Создаем профиль
    INSERT INTO public.profiles (id, nickname, static_id)
    VALUES (NEW.id, user_nickname, user_static_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Триггер для создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Триггеры для обновления updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_change_requests_updated_at 
    BEFORE UPDATE ON role_change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_acts_updated_at 
    BEFORE UPDATE ON court_acts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gov_acts_updated_at 
    BEFORE UPDATE ON gov_acts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at 
    BEFORE UPDATE ON fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wanted_updated_at 
    BEFORE UPDATE ON wanted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at 
    BEFORE UPDATE ON lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_requests_updated_at 
    BEFORE UPDATE ON lawyer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_contracts_updated_at 
    BEFORE UPDATE ON lawyer_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_sessions_updated_at 
    BEFORE UPDATE ON court_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at 
    BEFORE UPDATE ON inspections
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

-- Удаляем старую функцию search_documents если она существует
DROP FUNCTION IF EXISTS search_documents(TEXT);

-- Функция для глобального поиска документов (улучшенная)
CREATE OR REPLACE FUNCTION search_documents(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    static_id TEXT,
    case_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    -- Поиск по актам суда
    SELECT 
        ca.id,
        ca.title,
        ca.content,
        'court_act'::TEXT as type,
        ca.defendant_static_id as static_id,
        ca.case_number,
        ca.created_at
    FROM court_acts ca
    WHERE ca.status = 'published'
    AND (
        ca.title ILIKE '%' || search_term || '%'
        OR ca.content ILIKE '%' || search_term || '%'
        OR ca.defendant_static_id ILIKE '%' || search_term || '%'
        OR ca.defendant_name ILIKE '%' || search_term || '%'
        OR ca.case_number ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по актам правительства
    SELECT 
        ga.id,
        ga.title,
        ga.content,
        'government_act'::TEXT as type,
        NULL::TEXT as static_id,
        ga.act_number as case_number,
        ga.created_at
    FROM gov_acts ga
    WHERE ga.status = 'published'
    AND (
        ga.title ILIKE '%' || search_term || '%'
        OR ga.content ILIKE '%' || search_term || '%'
        OR ga.act_number ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по штрафам
    SELECT 
        f.id,
        f.reason as title,
        f.reason as content,
        'fine'::TEXT as type,
        f.defendant_static_id as static_id,
        NULL::TEXT as case_number,
        f.created_at
    FROM fines f
    WHERE f.status = 'active'
    AND (
        f.defendant_static_id ILIKE '%' || search_term || '%'
        OR f.defendant_name ILIKE '%' || search_term || '%'
        OR f.reason ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по розыску
    SELECT 
        w.id,
        w.reason as title,
        w.reason as content,
        'wanted'::TEXT as type,
        w.suspect_static_id as static_id,
        NULL::TEXT as case_number,
        w.created_at
    FROM wanted w
    WHERE w.status = 'active'
    AND (
        w.suspect_static_id ILIKE '%' || search_term || '%'
        OR w.suspect_name ILIKE '%' || search_term || '%'
        OR w.reason ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по делам
    SELECT 
        c.id,
        c.title,
        c.description as content,
        'case'::TEXT as type,
        NULL::TEXT as static_id,
        c.case_number,
        c.created_at
    FROM cases c
    WHERE (
        c.title ILIKE '%' || search_term || '%'
        OR c.description ILIKE '%' || search_term || '%'
        OR c.case_number ILIKE '%' || search_term || '%'
    )
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ПРОВЕРКИ И ВАЛИДАЦИЯ
-- =====================================================

-- Проверяем, что все ENUM типы созданы
SELECT 'All ENUM types created successfully' as status;

-- Проверяем, что все таблицы созданы
SELECT 'All tables created successfully' as status;

-- Проверяем индексы
SELECT 'Indexes created successfully' as status;

-- Проверяем политики RLS
SELECT 'RLS policies created successfully' as status;

-- Проверяем триггеры
SELECT 'Triggers created successfully' as status;

-- Проверяем функции
SELECT 'Functions created successfully' as status;

-- =====================================================
-- ГОТОВО!
-- =====================================================

SELECT 'Complete database setup finished successfully!' as status;
