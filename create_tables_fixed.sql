-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦ ДЛЯ ПРАВОВОЙ СИСТЕМЫ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ТАБЛИЦЫ ПРОФИЛЕЙ И АУТЕНТИФИКАЦИИ
-- =====================================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT NOT NULL,
    static_id TEXT NOT NULL UNIQUE,
    discord TEXT,
    faction TEXT NOT NULL DEFAULT 'CIVILIAN' CHECK (faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    gov_role TEXT NOT NULL DEFAULT 'NONE' CHECK (gov_role IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    leader_role TEXT CHECK (leader_role IN ('GOVERNOR', 'DIRECTOR_WN', 'DIRECTOR_FIB', 'CHIEF_LSPD', 'SHERIFF_LSCSD', 'CHIEF_EMS', 'COLONEL_SANG')),
    office_role TEXT CHECK (office_role IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заявок на верификацию
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('ACCOUNT', 'PROSECUTOR', 'JUDGE', 'OFFICE', 'FACTION_MEMBER')),
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    target_department TEXT CHECK (target_department IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')),
    target_faction TEXT CHECK (target_faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица запросов на изменение ролей
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

-- Таблица заявок на приём
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')),
    subject TEXT NOT NULL,
    preferred_datetime TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦЫ ДОКУМЕНТОВ И ПРАВОВЫХ АКТОВ
-- =====================================================

-- Таблица правительственных актов (исправленное название)
CREATE TABLE IF NOT EXISTS gov_acts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    source_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица судебных актов
CREATE TABLE IF NOT EXISTS court_acts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    source_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица штрафов
CREATE TABLE IF NOT EXISTS fines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    offender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    offender_static_id TEXT NOT NULL,
    offender_name TEXT NOT NULL,
    issuer_faction TEXT NOT NULL CHECK (issuer_faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'CANCELLED')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица ордеров (розыскных)
CREATE TABLE IF NOT EXISTS warrants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject_static_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    issuer_faction TEXT NOT NULL CHECK (issuer_faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    warrant_type TEXT NOT NULL CHECK (warrant_type IN ('ARREST', 'SEARCH', 'SEIZURE', 'DETENTION')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXECUTED', 'REVOKED', 'EXPIRED')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦЫ ДЛЯ НОВЫХ ФУНКЦИЙ
-- =====================================================

-- Таблица уведомлений
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

-- Таблица судебных заседаний
CREATE TABLE IF NOT EXISTS court_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    judge_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT NOT NULL DEFAULT 'open' CHECK (type IN ('open', 'closed')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    participants TEXT[] DEFAULT '{}',
    description TEXT,
    courtroom TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица адвокатов
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('government', 'private')),
    specialization TEXT[] DEFAULT '{}',
    experience INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    cases_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'unavailable')),
    contact TEXT,
    price TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица запросов на адвоката
CREATE TABLE IF NOT EXISTS lawyer_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_static_id TEXT NOT NULL,
    case_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'assigned')),
    assigned_lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица контрактов с частными адвокатами
CREATE TABLE IF NOT EXISTS lawyer_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_number TEXT,
    contract_terms TEXT NOT NULL,
    fee_amount INTEGER,
    fee_currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица дел (группировка документов)
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('criminal', 'civil', 'administrative')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
    start_date DATE NOT NULL,
    end_date DATE,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prosecutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица участников дел
CREATE TABLE IF NOT EXISTS case_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    static_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица документов в делах
CREATE TABLE IF NOT EXISTS case_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица событий в делах (таймлайн)
CREATE TABLE IF NOT EXISTS case_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    event TEXT NOT NULL,
    description TEXT,
    document_id UUID REFERENCES case_documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица проверок (прокуратура/EMS)
CREATE TABLE IF NOT EXISTS inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prosecutor', 'ems')),
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    date DATE NOT NULL,
    duration TEXT,
    location TEXT NOT NULL,
    inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inspector_name TEXT NOT NULL,
    target TEXT NOT NULL,
    description TEXT NOT NULL,
    findings TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица документов проверок
CREATE TABLE IF NOT EXISTS inspection_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для профилей
CREATE INDEX IF NOT EXISTS idx_profiles_static_id ON profiles(static_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faction ON profiles(faction);
CREATE INDEX IF NOT EXISTS idx_profiles_gov_role ON profiles(gov_role);

-- Индексы для запросов на изменение ролей
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_type ON role_change_requests(request_type);

-- Индексы для документов
CREATE INDEX IF NOT EXISTS idx_gov_acts_published ON gov_acts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_court_acts_published ON court_acts(is_published, published_at);

-- Индексы для штрафов и ордеров
CREATE INDEX IF NOT EXISTS idx_fines_offender_static_id ON fines(offender_static_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_warrants_subject_static_id ON warrants(subject_static_id);
CREATE INDEX IF NOT EXISTS idx_warrants_status ON warrants(status);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Индексы для судебных заседаний
CREATE INDEX IF NOT EXISTS idx_court_sessions_date ON court_sessions(date);
CREATE INDEX IF NOT EXISTS idx_court_sessions_status ON court_sessions(status);

-- Индексы для адвокатов
CREATE INDEX IF NOT EXISTS idx_lawyers_type ON lawyers(type);
CREATE INDEX IF NOT EXISTS idx_lawyers_status ON lawyers(status);

-- Индексы для дел
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(type);

-- Индексы для проверок
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_documents ENABLE ROW LEVEL SECURITY;

-- Политики для профилей
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (except roles)" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Политики для публичных документов
CREATE POLICY "Anyone can view published government acts" ON gov_acts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Anyone can view published court acts" ON court_acts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Anyone can view public inspections" ON inspections
    FOR SELECT USING (is_public = true);

-- Политики для судебных заседаний
CREATE POLICY "Anyone can view court sessions" ON court_sessions
    FOR SELECT USING (true);

-- Политики для адвокатов
CREATE POLICY "Anyone can view lawyers" ON lawyers
    FOR SELECT USING (true);

-- Политики для дел
CREATE POLICY "Anyone can view cases" ON cases
    FOR SELECT USING (true);

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

-- Триггеры для обновления updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_change_requests_updated_at BEFORE UPDATE ON role_change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gov_acts_updated_at BEFORE UPDATE ON gov_acts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_acts_updated_at BEFORE UPDATE ON court_acts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warrants_updated_at BEFORE UPDATE ON warrants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_sessions_updated_at BEFORE UPDATE ON court_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_requests_updated_at BEFORE UPDATE ON lawyer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_contracts_updated_at BEFORE UPDATE ON lawyer_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для создания уведомления при новом штрафе
CREATE OR REPLACE FUNCTION create_fine_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.offender_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, priority)
        VALUES (
            NEW.offender_id,
            'fine',
            'Новый штраф',
            'Вам выписан штраф на сумму ' || NEW.amount || ' за: ' || NEW.reason,
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_fine_notification_trigger
    AFTER INSERT ON fines
    FOR EACH ROW EXECUTE FUNCTION create_fine_notification();

-- Функция для создания уведомления при новом ордере
CREATE OR REPLACE FUNCTION create_warrant_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, priority)
        VALUES (
            NEW.subject_id,
            'wanted',
            'Новый ордер',
            'В отношении вас выдан ордер: ' || NEW.description,
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_warrant_notification_trigger
    AFTER INSERT ON warrants
    FOR EACH ROW EXECUTE FUNCTION create_warrant_notification();

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

CREATE TRIGGER create_role_change_notification_trigger
    AFTER UPDATE ON role_change_requests
    FOR EACH ROW EXECUTE FUNCTION create_role_change_notification();

-- Функция для поиска документов по StaticID или nickname
CREATE OR REPLACE FUNCTION search_documents(search_term TEXT)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    static_id TEXT,
    nickname TEXT,
    date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    url TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Поиск в штрафах
    SELECT 
        f.id::UUID,
        'fine'::TEXT as type,
        'Штраф: ' || f.reason as title,
        f.offender_static_id as static_id,
        f.offender_name as nickname,
        f.issued_at as date,
        f.status,
        '/fines/' || f.id as url
    FROM fines f
    WHERE f.offender_static_id ILIKE '%' || search_term || '%'
       OR f.offender_name ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    -- Поиск в ордерах
    SELECT 
        w.id::UUID,
        'wanted'::TEXT as type,
        'Ордер: ' || w.warrant_type || ' - ' || w.description as title,
        w.subject_static_id as static_id,
        w.subject_name as nickname,
        w.issued_at as date,
        w.status,
        '/wanted/' || w.id as url
    FROM warrants w
    WHERE w.subject_static_id ILIKE '%' || search_term || '%'
       OR w.subject_name ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    -- Поиск в правительственных актах
    SELECT 
        ga.id::UUID,
        'government_act'::TEXT as type,
        ga.title,
        NULL as static_id,
        NULL as nickname,
        ga.published_at as date,
        CASE WHEN ga.is_published THEN 'published' ELSE 'draft' END as status,
        '/acts-government/' || ga.id as url
    FROM gov_acts ga
    WHERE ga.title ILIKE '%' || search_term || '%'
       OR ga.content ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    -- Поиск в судебных актах
    SELECT 
        ca.id::UUID,
        'court_act'::TEXT as type,
        ca.title,
        NULL as static_id,
        NULL as nickname,
        ca.published_at as date,
        CASE WHEN ca.is_published THEN 'published' ELSE 'draft' END as status,
        '/acts-court/' || ca.id as url
    FROM court_acts ca
    WHERE ca.title ILIKE '%' || search_term || '%'
       OR ca.content ILIKE '%' || search_term || '%'
    
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;
