-- =====================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ СИСТЕМЫ WASHINGTON
-- =====================================================

-- Включение расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ТАБЛИЦА ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT UNIQUE NOT NULL,
    discord TEXT,
    full_name TEXT NOT NULL,
    static_id TEXT UNIQUE,
    faction TEXT CHECK (faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    gov_role TEXT CHECK (gov_role IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')),
    leader_role TEXT CHECK (leader_role IN ('GOVERNOR', 'DIRECTOR_WN', 'DIRECTOR_FIB', 'CHIEF_LSPD', 'SHERIFF_LSCSD', 'CHIEF_EMS', 'COLONEL_SANG')),
    office_role TEXT CHECK (office_role IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА НАЗНАЧЕНИЙ
-- =====================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED')) DEFAULT 'PENDING',
    reason TEXT,
    preferred_datetime TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА ВЕРИФИКАЦИЮ
-- =====================================================
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    kind TEXT CHECK (kind IN ('FACTION_MEMBER', 'PROSECUTOR', 'JUDGE')) NOT NULL,
    target_faction TEXT CHECK (target_faction IN ('WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')),
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================
CREATE TABLE role_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type TEXT CHECK (request_type IN ('FACTION', 'GOV_ROLE', 'LEADER_ROLE', 'OFFICE_ROLE')) NOT NULL,
    current_value TEXT,
    requested_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id),
    review_comment TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ГОСУДАРСТВЕННЫХ АКТОВ
-- =====================================================
CREATE TABLE gov_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА СУДЕБНЫХ АКТОВ
-- =====================================================
CREATE TABLE court_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ОРДЕРОВ
-- =====================================================
CREATE TABLE warrants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warrant_number TEXT UNIQUE NOT NULL,
    target_name TEXT NOT NULL,
    warrant_type TEXT CHECK (warrant_type IN ('AS', 'S', 'A')) NOT NULL,
    reason TEXT NOT NULL,
    articles TEXT[] NOT NULL,
    issued_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('active', 'executed', 'expired', 'cancelled')) DEFAULT 'active',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ДЕЛ
-- =====================================================
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА СОБЫТИЙ ПО ДЕЛАМ
-- =====================================================
CREATE TABLE case_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА СУДЕБНЫХ СЕССИЙ
-- =====================================================
CREATE TABLE court_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА АДВОКАТОВ
-- =====================================================
CREATE TABLE lawyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    specialization TEXT,
    status TEXT CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ЗАПРОСОВ НА АДВОКАТСКУЮ ЛИЦЕНЗИЮ
-- =====================================================
CREATE TABLE lawyer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type TEXT CHECK (request_type IN ('LICENSE', 'SPECIALIZATION', 'STATUS_CHANGE')) NOT NULL,
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА АДВОКАТСКИХ КОНТРАКТОВ
-- =====================================================
CREATE TABLE lawyer_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ИНСПЕКЦИЙ
-- =====================================================
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ШТРАФОВ
-- =====================================================
CREATE TABLE fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    offender_id UUID REFERENCES profiles(id),
    offender_static_id TEXT NOT NULL,
    offender_name TEXT NOT NULL,
    issuer_faction TEXT CHECK (issuer_faction IN ('WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG')) NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('UNPAID', 'PAID', 'CANCELLED')) DEFAULT 'UNPAID',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================

-- Индексы для profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);
CREATE INDEX idx_profiles_faction ON profiles(faction);
CREATE INDEX idx_profiles_gov_role ON profiles(gov_role);
CREATE INDEX idx_profiles_is_verified ON profiles(is_verified);

-- Индексы для appointments
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_department ON appointments(department);

-- Индексы для verification_requests
CREATE INDEX idx_verification_requests_created_by ON verification_requests(created_by);
CREATE INDEX idx_verification_requests_kind ON verification_requests(kind);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- Индексы для role_change_requests
CREATE INDEX idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX idx_role_change_requests_request_type ON role_change_requests(request_type);

-- Индексы для gov_acts
CREATE INDEX idx_gov_acts_created_by ON gov_acts(created_by);
CREATE INDEX idx_gov_acts_published ON gov_acts(published);
CREATE INDEX idx_gov_acts_act_number ON gov_acts(act_number);

-- Индексы для court_acts
CREATE INDEX idx_court_acts_created_by ON court_acts(created_by);
CREATE INDEX idx_court_acts_published ON court_acts(published);
CREATE INDEX idx_court_acts_act_number ON court_acts(act_number);

-- Индексы для warrants
CREATE INDEX idx_warrants_issued_by ON warrants(issued_by);
CREATE INDEX idx_warrants_status ON warrants(status);
CREATE INDEX idx_warrants_warrant_type ON warrants(warrant_type);
CREATE INDEX idx_warrants_valid_until ON warrants(valid_until);

-- Индексы для cases
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_status ON cases(status);

-- Индексы для court_sessions
CREATE INDEX idx_court_sessions_created_by ON court_sessions(created_by);
CREATE INDEX idx_court_sessions_session_date ON court_sessions(session_date);

-- Индексы для lawyers
CREATE INDEX idx_lawyers_user_id ON lawyers(user_id);
CREATE INDEX idx_lawyers_status ON lawyers(status);

-- Индексы для fines
CREATE INDEX idx_fines_created_by ON fines(created_by);
CREATE INDEX idx_fines_offender_id ON fines(offender_id);
CREATE INDEX idx_fines_status ON fines(status);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ ОБНОВЛЕНИЯ updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применяем триггер ко всем таблицам с updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_change_requests_updated_at BEFORE UPDATE ON role_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gov_acts_updated_at BEFORE UPDATE ON gov_acts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_acts_updated_at BEFORE UPDATE ON court_acts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warrants_updated_at BEFORE UPDATE ON warrants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_sessions_updated_at BEFORE UPDATE ON court_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lawyer_requests_updated_at BEFORE UPDATE ON lawyer_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lawyer_contracts_updated_at BEFORE UPDATE ON lawyer_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON fines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Политики для profiles (пользователи могут читать все профили, редактировать только свой)
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- ВАЖНО: Система может создавать профили (для функции handle_new_user)
CREATE POLICY "System can create profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Политики для appointments (записаться на прием может любой залогиненный юзер)
CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update appointments" ON appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Политики для verification_requests
CREATE POLICY "Users can view verification requests" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "Users can create verification requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update verification requests" ON verification_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Политики для role_change_requests
CREATE POLICY "Users can view role change requests" ON role_change_requests FOR SELECT USING (true);
CREATE POLICY "Users can create role change requests" ON role_change_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Admins can update role change requests" ON role_change_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);

-- Политики для gov_acts (акты правительства - прокуратура)
CREATE POLICY "Users can view government acts" ON gov_acts FOR SELECT USING (true);
CREATE POLICY "Authorized users can create government acts" ON gov_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'PROSECUTOR'))
);
CREATE POLICY "Authors can update own acts" ON gov_acts FOR UPDATE USING (auth.uid() = created_by);

-- Политики для court_acts (судебные акты - судьи)
CREATE POLICY "Users can view court acts" ON court_acts FOR SELECT USING (true);
CREATE POLICY "Authorized users can create court acts" ON court_acts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'CHIEF_JUSTICE', 'JUDGE'))
);
CREATE POLICY "Authors can update own acts" ON court_acts FOR UPDATE USING (auth.uid() = created_by);

-- Политики для warrants (ордера - тех. админы, прокуроры, ген. прок, судьи, ПВС)
CREATE POLICY "Users can view warrants" ON warrants FOR SELECT USING (true);
CREATE POLICY "Authorized users can create warrants" ON warrants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'PROSECUTOR', 'JUDGE'))
);
CREATE POLICY "Authorized users can update warrants" ON warrants FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'PROSECUTOR', 'JUDGE'))
);

-- Политики для cases (дела - тех. админы, прокуроры, ген. прок, судьи, ПВС)
CREATE POLICY "Users can view cases" ON cases FOR SELECT USING (true);
CREATE POLICY "Authorized users can create cases" ON cases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'PROSECUTOR', 'JUDGE'))
);
CREATE POLICY "Users can update own cases" ON cases FOR UPDATE USING (auth.uid() = created_by);

-- Политики для court_sessions
CREATE POLICY "Users can view court sessions" ON court_sessions FOR SELECT USING (true);
CREATE POLICY "Authorized users can create court sessions" ON court_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'))
);
CREATE POLICY "Authors can update own sessions" ON court_sessions FOR UPDATE USING (auth.uid() = created_by);

-- Политики для lawyers
CREATE POLICY "Users can view lawyers" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Users can create lawyer profiles" ON lawyers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lawyer profile" ON lawyers FOR UPDATE USING (auth.uid() = user_id);

-- Политики для lawyer_requests (запрос адвоката может публиковать любой залогиненный юзер)
CREATE POLICY "Users can view lawyer requests" ON lawyer_requests FOR SELECT USING (true);
CREATE POLICY "Users can create lawyer requests" ON lawyer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lawyer requests" ON lawyer_requests FOR UPDATE USING (auth.uid() = user_id);

-- Политики для inspections (инспекции - лидер EMS, Минздрав, Ген. прок, Губернатор)
CREATE POLICY "Users can view inspections" ON inspections FOR SELECT USING (true);
CREATE POLICY "Authorized users can create inspections" ON inspections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           (gov_role IN ('ATTORNEY_GENERAL') OR 
            leader_role IN ('CHIEF_EMS', 'GOVERNOR') OR
            office_role IN ('MIN_HEALTH')))
);

-- Политики для fines (штрафы - тех. админы, прокуроры, ген. прок, судьи, ПВС)
CREATE POLICY "Users can view fines" ON fines FOR SELECT USING (true);
CREATE POLICY "Authorized users can create fines" ON fines FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 
           gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'PROSECUTOR', 'JUDGE'))
);

-- =====================================================
-- ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ
-- =====================================================

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nickname TEXT;
    user_static_id TEXT;
    user_discord TEXT;
    user_faction TEXT;
BEGIN
    -- Извлекаем данные из метаданных с проверками
    user_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', 'User');
    user_static_id := COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8));
    user_discord := NEW.raw_user_meta_data->>'discord';
    user_faction := COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN');
    
    -- Создаем профиль
    INSERT INTO public.profiles (
        id,
        nickname,
        static_id,
        email,
        discord,
        faction,
        gov_role,
        is_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_nickname,
        user_static_id,
        NEW.email,
        user_discord,
        user_faction,
        'NONE',
        false,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Записываем ошибку в лог, но не прерываем регистрацию
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Функция для проверки прав доступа
CREATE OR REPLACE FUNCTION check_user_permissions(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND gov_role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- =====================================================

COMMENT ON TABLE profiles IS 'Профили пользователей системы';
COMMENT ON TABLE appointments IS 'Назначения на должности';
COMMENT ON TABLE verification_requests IS 'Запросы на верификацию ролей';
COMMENT ON TABLE role_change_requests IS 'Запросы на изменение ролей';
COMMENT ON TABLE gov_acts IS 'Государственные акты и постановления';
COMMENT ON TABLE court_acts IS 'Судебные акты и решения';
COMMENT ON TABLE warrants IS 'Ордера на арест, обыск и изъятие';
COMMENT ON TABLE cases IS 'Дела';
COMMENT ON TABLE case_events IS 'События по делам';
COMMENT ON TABLE court_sessions IS 'Судебные сессии';
COMMENT ON TABLE lawyers IS 'Адвокаты';
COMMENT ON TABLE lawyer_requests IS 'Запросы на адвокатскую деятельность';
COMMENT ON TABLE lawyer_contracts IS 'Контракты адвокатов с клиентами';
COMMENT ON TABLE inspections IS 'Инспекции и проверки';
COMMENT ON TABLE fines IS 'Штрафы и взыскания';

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Проверяем, что все таблицы созданы
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
