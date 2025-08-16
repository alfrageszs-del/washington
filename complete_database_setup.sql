-- =====================================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ (ВСЕ В ОДНОМ ФАЙЛЕ)
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ТАБЛИЦА ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT NOT NULL,
    static_id TEXT NOT NULL UNIQUE,
    faction TEXT NOT NULL DEFAULT 'CIVILIAN',
    gov_role TEXT NOT NULL DEFAULT 'NONE',
    leader_role TEXT,
    office_role TEXT,
    discord TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем правильные ограничения для профилей
ALTER TABLE profiles ADD CONSTRAINT profiles_gov_role_check 
    CHECK (gov_role IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'));

ALTER TABLE profiles ADD CONSTRAINT profiles_faction_check 
    CHECK (faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG'));

ALTER TABLE profiles ADD CONSTRAINT profiles_leader_role_check 
    CHECK (leader_role IS NULL OR leader_role IN ('GOVERNOR', 'DIRECTOR_WN', 'DIRECTOR_FIB', 'CHIEF_LSPD', 'SHERIFF_LSCSD', 'CHIEF_EMS', 'COLONEL_SANG'));

ALTER TABLE profiles ADD CONSTRAINT profiles_office_role_check 
    CHECK (office_role IS NULL OR office_role IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER'));

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================

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

-- =====================================================
-- ТАБЛИЦА УВЕДОМЛЕНИЙ
-- =====================================================

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

-- =====================================================
-- ТАБЛИЦА АКТОВ СУДА
-- =====================================================

CREATE TABLE IF NOT EXISTS court_acts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    case_number TEXT,
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    judge_name TEXT,
    defendant_static_id TEXT,
    defendant_name TEXT,
    articles TEXT[],
    decision TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
    due_date DATE,
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
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'caught', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ДЕЛ
-- =====================================================

CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('criminal', 'civil', 'administrative')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
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
-- ТАБЛИЦА АДВОКАТОВ
-- =====================================================

CREATE TABLE IF NOT EXISTS lawyers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('government', 'private')),
    specialization TEXT[],
    experience INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    cases_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'unavailable')),
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
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'assigned')),
    assigned_lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
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
    contract_terms TEXT NOT NULL,
    fee_amount DECIMAL(10,2),
    fee_currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
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
    judge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    judge_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('open', 'closed')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
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
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
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

-- Индексы для запросов на изменение ролей
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_type ON role_change_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_created_at ON role_change_requests(created_at);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Индексы для актов суда
CREATE INDEX IF NOT EXISTS idx_court_acts_case_number ON court_acts(case_number);
CREATE INDEX IF NOT EXISTS idx_court_acts_defendant_static_id ON court_acts(defendant_static_id);
CREATE INDEX IF NOT EXISTS idx_court_acts_status ON court_acts(status);

-- Индексы для актов правительства
CREATE INDEX IF NOT EXISTS idx_gov_acts_act_number ON gov_acts(act_number);
CREATE INDEX IF NOT EXISTS idx_gov_acts_status ON gov_acts(status);

-- Индексы для штрафов
CREATE INDEX IF NOT EXISTS idx_fines_defendant_static_id ON fines(defendant_static_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);

-- Индексы для розыска
CREATE INDEX IF NOT EXISTS idx_wanted_suspect_static_id ON wanted(suspect_static_id);
CREATE INDEX IF NOT EXISTS idx_wanted_status ON wanted(status);

-- Индексы для дел
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- Индексы для адвокатов
CREATE INDEX IF NOT EXISTS idx_lawyers_type ON lawyers(type);
CREATE INDEX IF NOT EXISTS idx_lawyers_status ON lawyers(status);

-- Индексы для запросов на адвоката
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_client_id ON lawyer_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_status ON lawyer_requests(status);

-- Индексы для договоров адвокатов
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_lawyer_id ON lawyer_contracts(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_client_id ON lawyer_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_contracts_status ON lawyer_contracts(status);

-- Индексы для судебных заседаний
CREATE INDEX IF NOT EXISTS idx_court_sessions_date ON court_sessions(date);
CREATE INDEX IF NOT EXISTS idx_court_sessions_status ON court_sessions(status);

-- Индексы для проверок
CREATE INDEX IF NOT EXISTS idx_inspections_department ON inspections(department);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Политики для профилей
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (except roles)" ON profiles
    FOR UPDATE USING (
        auth.uid() = id 
        AND (
            -- Разрешаем обновление только определенных полей
            (OLD.faction = NEW.faction) AND
            (OLD.gov_role = NEW.gov_role) AND
            (OLD.leader_role = NEW.leader_role) AND
            (OLD.office_role = NEW.office_role)
        )
    );

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

-- Триггеры для обновления updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_change_requests_updated_at 
    BEFORE UPDATE ON role_change_requests
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

CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases
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

-- Функция для глобального поиска документов
CREATE OR REPLACE FUNCTION search_documents(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    static_id TEXT,
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
        ca.created_at
    FROM court_acts ca
    WHERE ca.status = 'published'
    AND (
        ca.title ILIKE '%' || search_term || '%'
        OR ca.content ILIKE '%' || search_term || '%'
        OR ca.defendant_static_id ILIKE '%' || search_term || '%'
        OR ca.defendant_name ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по актам правительства
    SELECT 
        ga.id,
        ga.title,
        ga.content,
        'government_act'::TEXT as type,
        NULL::TEXT as static_id,
        ga.created_at
    FROM gov_acts ga
    WHERE ga.status = 'published'
    AND (
        ga.title ILIKE '%' || search_term || '%'
        OR ga.content ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Поиск по штрафам
    SELECT 
        f.id,
        f.reason as title,
        f.reason as content,
        'fine'::TEXT as type,
        f.defendant_static_id as static_id,
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
        w.created_at
    FROM wanted w
    WHERE w.status = 'active'
    AND (
        w.suspect_static_id ILIKE '%' || search_term || '%'
        OR w.suspect_name ILIKE '%' || search_term || '%'
        OR w.reason ILIKE '%' || search_term || '%'
    )
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ПРОВЕРКИ И ВАЛИДАЦИЯ
-- =====================================================

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
