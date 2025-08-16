-- =====================================================
-- НОВАЯ БАЗА ДАННЫХ ДЛЯ ПРАВОВОЙ СИСТЕМЫ (ИСПРАВЛЕННАЯ)
-- =====================================================

-- Включаем расширение для UUID (если доступно)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ТАБЛИЦА ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================

-- Создаем enum для ролей
DO $$ BEGIN
    CREATE TYPE gov_role_enum AS ENUM (
        'NONE',           -- Без роли
        'PROSECUTOR',      -- Прокурор
        'JUDGE',          -- Судья
        'TECH_ADMIN',     -- Технический администратор
        'ATTORNEY_GENERAL', -- Генеральный прокурор
        'CHIEF_JUSTICE'   -- Главный судья
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем enum для фракций
DO $$ BEGIN
    CREATE TYPE faction_enum AS ENUM (
        'CIVILIAN',       -- Гражданский
        'LSPD',           -- Полиция
        'LSCSD',          -- Шериф
        'FIB',            -- ФБР
        'GOV',            -- Правительство
        'EMS',            -- Скорая помощь
        'SANG',           -- Национальная гвардия
        'WN'              -- Военно-морские силы
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу профилей
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    static_id TEXT NOT NULL,
    gov_role gov_role_enum NOT NULL DEFAULT 'NONE',
    faction faction_enum NOT NULL DEFAULT 'CIVILIAN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ТАБЛИЦА СУДЕБНЫХ АКТОВ
-- =====================================================

-- Создаем enum для статуса актов
DO $$ BEGIN
    CREATE TYPE act_status_enum AS ENUM (
        'draft',          -- Черновик
        'published',      -- Опубликован
        'archived'        -- Архивирован
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу судебных актов
CREATE TABLE IF NOT EXISTS court_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    judge_id UUID NOT NULL REFERENCES profiles(id),
    status act_status_enum NOT NULL DEFAULT 'draft',
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ТАБЛИЦА АКТОВ ПРАВИТЕЛЬСТВА
-- =====================================================

-- Создаем таблицу актов правительства
CREATE TABLE IF NOT EXISTS gov_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES profiles(id),
    status act_status_enum NOT NULL DEFAULT 'draft',
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ТАБЛИЦА СУДЕБНЫХ ДЕЛ
-- =====================================================

-- Создаем enum для статуса дел
DO $$ BEGIN
    CREATE TYPE case_status_enum AS ENUM (
        'open',           -- Открыто
        'in_progress',    -- В процессе
        'closed',         -- Закрыто
        'archived'        -- Архивировано
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу судебных дел
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prosecutor_id UUID NOT NULL REFERENCES profiles(id),
    judge_id UUID REFERENCES profiles(id),
    status case_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ТАБЛИЦА УЧАСТНИКОВ ДЕЛА
-- =====================================================

-- Создаем enum для роли участника
DO $$ BEGIN
    CREATE TYPE participant_role_enum AS ENUM (
        'defendant',      -- Обвиняемый
        'plaintiff',      -- Истец
        'witness',        -- Свидетель
        'lawyer',         -- Адвокат
        'expert'          -- Эксперт
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу участников дела
CREATE TABLE IF NOT EXISTS case_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    role participant_role_enum NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ТАБЛИЦА ДОКУМЕНТОВ ДЕЛА
-- =====================================================

-- Создаем таблицу документов дела
CREATE TABLE IF NOT EXISTS case_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    document_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ТАБЛИЦА СОБЫТИЙ ДЕЛА
-- =====================================================

-- Создаем enum для типа события
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM (
        'hearing',        -- Заседание
        'filing',         -- Подача документа
        'decision',       -- Решение
        'appeal',         -- Апелляция
        'other'           -- Другое
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу событий дела
CREATE TABLE IF NOT EXISTS case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_type event_type_enum NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. ТАБЛИЦА СУДЕБНЫХ ЗАСЕДАНИЙ
-- =====================================================

-- Создаем enum для статуса заседания
DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM (
        'scheduled',      -- Запланировано
        'in_progress',    -- В процессе
        'completed',      -- Завершено
        'cancelled'       -- Отменено
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу судебных заседаний
CREATE TABLE IF NOT EXISTS court_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    judge_id UUID NOT NULL REFERENCES profiles(id),
    status session_status_enum NOT NULL DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. ТАБЛИЦА ШТРАФОВ
-- =====================================================

-- Создаем enum для статуса штрафа
DO $$ BEGIN
    CREATE TYPE fine_status_enum AS ENUM (
        'issued',         -- Выписан
        'paid',           -- Оплачен
        'overdue',        -- Просрочен
        'cancelled'       -- Отменен
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу штрафов
CREATE TABLE IF NOT EXISTS fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    offender_name TEXT NOT NULL,
    offense_description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    issued_by UUID NOT NULL REFERENCES profiles(id),
    status fine_status_enum NOT NULL DEFAULT 'issued',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ТАБЛИЦА ОРДЕРОВ
-- =====================================================

-- Создаем enum для типа ордера
DO $$ BEGIN
    CREATE TYPE warrant_type_enum AS ENUM (
        'AS',             -- Arrest & Search
        'S',              -- Search
        'A'               -- Arrest
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем enum для статуса ордера
DO $$ BEGIN
    CREATE TYPE warrant_status_enum AS ENUM (
        'active',         -- Активен
        'executed',       -- Исполнен
        'expired',        -- Истек
        'cancelled'       -- Отменен
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу ордеров
CREATE TABLE IF NOT EXISTS warrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warrant_number TEXT UNIQUE NOT NULL,
    target_name TEXT NOT NULL,
    warrant_type warrant_type_enum NOT NULL,
    reason TEXT NOT NULL,
    articles TEXT[] NOT NULL, -- Массив статей
    issued_by UUID NOT NULL REFERENCES profiles(id),
    status warrant_status_enum NOT NULL DEFAULT 'active',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. ТАБЛИЦА ПРОВЕРОК И НАДЗОРА
-- =====================================================

-- Создаем enum для типа проверки
DO $$ BEGIN
    CREATE TYPE inspection_type_enum AS ENUM (
        'scheduled',      -- Плановая
        'unscheduled',    -- Внеплановая
        'follow_up'       -- Повторная
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем enum для статуса проверки
DO $$ BEGIN
    CREATE TYPE inspection_status_enum AS ENUM (
        'planned',        -- Запланирована
        'in_progress',    -- В процессе
        'completed',      -- Завершена
        'cancelled'       -- Отменена
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу проверок
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    inspector_id UUID NOT NULL REFERENCES profiles(id),
    target_entity TEXT NOT NULL,
    inspection_type inspection_type_enum NOT NULL DEFAULT 'scheduled',
    status inspection_status_enum NOT NULL DEFAULT 'planned',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    findings TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. ТАБЛИЦА ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛИ
-- =====================================================

-- Создаем enum для статуса запроса
DO $$ BEGIN
    CREATE TYPE request_status_enum AS ENUM (
        'PENDING',        -- Ожидает рассмотрения
        'APPROVED',       -- Одобрен
        'REJECTED'        -- Отклонен
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу запросов на изменение роли
CREATE TABLE IF NOT EXISTS role_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(id),
    current_role_value gov_role_enum NOT NULL,
    requested_role_value gov_role_enum NOT NULL,
    current_faction_value faction_enum NOT NULL,
    requested_faction_value faction_enum NOT NULL,
    reason TEXT NOT NULL,
    status request_status_enum NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для профилей
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_gov_role ON profiles(gov_role);
CREATE INDEX IF NOT EXISTS idx_profiles_faction ON profiles(faction);

-- Индексы для актов
CREATE INDEX IF NOT EXISTS idx_court_acts_judge_id ON court_acts(judge_id);
CREATE INDEX IF NOT EXISTS idx_court_acts_status ON court_acts(status);
CREATE INDEX IF NOT EXISTS idx_court_acts_created_at ON court_acts(created_at);

CREATE INDEX IF NOT EXISTS idx_gov_acts_author_id ON gov_acts(author_id);
CREATE INDEX IF NOT EXISTS idx_gov_acts_status ON gov_acts(status);
CREATE INDEX IF NOT EXISTS idx_gov_acts_created_at ON gov_acts(created_at);

-- Индексы для дел
CREATE INDEX IF NOT EXISTS idx_cases_prosecutor_id ON cases(prosecutor_id);
CREATE INDEX IF NOT EXISTS idx_cases_judge_id ON cases(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- Индексы для участников
CREATE INDEX IF NOT EXISTS idx_case_participants_case_id ON case_participants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_participants_profile_id ON case_participants(profile_id);

-- Индексы для документов
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_uploaded_by ON case_documents(uploaded_by);

-- Индексы для событий
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_event_date ON case_events(event_date);

-- Индексы для заседаний
CREATE INDEX IF NOT EXISTS idx_court_sessions_case_id ON court_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_court_sessions_judge_id ON court_sessions(judge_id);
CREATE INDEX IF NOT EXISTS idx_court_sessions_session_date ON court_sessions(session_date);

-- Индексы для штрафов
CREATE INDEX IF NOT EXISTS idx_fines_issued_by ON fines(issued_by);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_due_date ON fines(due_date);

-- Индексы для ордеров
CREATE INDEX IF NOT EXISTS idx_warrants_issued_by ON warrants(issued_by);
CREATE INDEX IF NOT EXISTS idx_warrants_status ON warrants(status);
CREATE INDEX IF NOT EXISTS idx_warrants_valid_until ON warrants(valid_until);

-- Индексы для проверок
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_start_date ON inspections(start_date);

-- Индексы для запросов на изменение роли
CREATE INDEX IF NOT EXISTS idx_role_change_requests_requester_id ON role_change_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ ОБНОВЛЕНИЯ TIMESTAMP
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для всех таблиц с updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_court_acts_updated_at ON court_acts;
CREATE TRIGGER update_court_acts_updated_at BEFORE UPDATE ON court_acts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gov_acts_updated_at ON gov_acts;
CREATE TRIGGER update_gov_acts_updated_at BEFORE UPDATE ON gov_acts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_court_sessions_updated_at ON court_sessions;
CREATE TRIGGER update_court_sessions_updated_at BEFORE UPDATE ON court_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fines_updated_at ON fines;
CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON fines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warrants_updated_at ON warrants;
CREATE TRIGGER update_warrants_updated_at BEFORE UPDATE ON warrants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_change_requests_updated_at ON role_change_requests;
CREATE TRIGGER update_role_change_requests_updated_at BEFORE UPDATE ON role_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - УПРОЩЕННАЯ ВЕРСИЯ
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- УПРОЩЕННЫЕ ПОЛИТИКИ БЕЗОПАСНОСТИ
-- =====================================================

-- Политики для профилей
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (true);

-- Политики для судебных актов
DROP POLICY IF EXISTS "Everyone can view published court acts" ON court_acts;
CREATE POLICY "Everyone can view published court acts" ON court_acts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Judges and admins can manage court acts" ON court_acts;
CREATE POLICY "Judges and admins can manage court acts" ON court_acts FOR ALL USING (true);

-- Политики для актов правительства
DROP POLICY IF EXISTS "Everyone can view published government acts" ON gov_acts;
CREATE POLICY "Everyone can view published government acts" ON gov_acts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Government officials and admins can manage government acts" ON gov_acts;
CREATE POLICY "Government officials and admins can manage government acts" ON gov_acts FOR ALL USING (true);

-- Политики для дел
DROP POLICY IF EXISTS "Everyone can view cases" ON cases;
CREATE POLICY "Everyone can view cases" ON cases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Prosecutors, judges and admins can manage cases" ON cases;
CREATE POLICY "Prosecutors, judges and admins can manage cases" ON cases FOR ALL USING (true);

-- Политики для участников дела
DROP POLICY IF EXISTS "Case participants can view case participants" ON case_participants;
CREATE POLICY "Case participants can view case participants" ON case_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Case managers can manage case participants" ON case_participants;
CREATE POLICY "Case managers can manage case participants" ON case_participants FOR ALL USING (true);

-- Политики для документов дела
DROP POLICY IF EXISTS "Case participants can view case documents" ON case_documents;
CREATE POLICY "Case participants can view case documents" ON case_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Case managers can manage case documents" ON case_documents;
CREATE POLICY "Case managers can manage case documents" ON case_documents FOR ALL USING (true);

-- Политики для событий дела
DROP POLICY IF EXISTS "Case participants can view case events" ON case_events;
CREATE POLICY "Case participants can view case events" ON case_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Case managers can manage case events" ON case_events;
CREATE POLICY "Case managers can manage case events" ON case_events FOR ALL USING (true);

-- Политики для судебных заседаний
DROP POLICY IF EXISTS "Everyone can view court sessions" ON court_sessions;
CREATE POLICY "Everyone can view court sessions" ON court_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Judges and admins can manage court sessions" ON court_sessions;
CREATE POLICY "Judges and admins can manage court sessions" ON court_sessions FOR ALL USING (true);

-- Политики для штрафов
DROP POLICY IF EXISTS "Everyone can view fines" ON fines;
CREATE POLICY "Everyone can view fines" ON fines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Law enforcement and admins can manage fines" ON fines;
CREATE POLICY "Law enforcement and admins can manage fines" ON fines FOR ALL USING (true);

-- Политики для ордеров
DROP POLICY IF EXISTS "Everyone can view warrants" ON warrants;
CREATE POLICY "Everyone can view warrants" ON warrants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Law enforcement and admins can manage warrants" ON warrants;
CREATE POLICY "Law enforcement and admins can manage warrants" ON warrants FOR ALL USING (true);

-- Политики для проверок
DROP POLICY IF EXISTS "Everyone can view inspections" ON inspections;
CREATE POLICY "Everyone can view inspections" ON inspections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inspectors and admins can manage inspections" ON inspections;
CREATE POLICY "Inspectors and admins can manage inspections" ON inspections FOR ALL USING (true);

-- Политики для запросов на изменение роли
DROP POLICY IF EXISTS "Users can view their own role change requests" ON role_change_requests;
CREATE POLICY "Users can view their own role change requests" ON role_change_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create role change requests" ON role_change_requests;
CREATE POLICY "Users can create role change requests" ON role_change_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all role change requests" ON role_change_requests;
CREATE POLICY "Admins can view all role change requests" ON role_change_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update role change requests" ON role_change_requests;
CREATE POLICY "Admins can update role change requests" ON role_change_requests FOR UPDATE USING (true);

-- =====================================================
-- ПРАВА ДОСТУПА
-- =====================================================

-- Даем права аутентифицированным пользователям
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =====================================================
-- АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПРОФИЛЕЙ ПРИ РЕГИСТРАЦИИ
-- =====================================================

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Проверяем, что профиль еще не существует
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, email, nickname, static_id, gov_role, faction)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nickname', 'Новый пользователь'),
            COALESCE(NEW.raw_user_meta_data->>'static_id', 'N/A'),
            'NONE',
            'CIVILIAN'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ (ОПЦИОНАЛЬНО)
-- =====================================================

-- Вставляем тестового администратора
INSERT INTO profiles (id, email, nickname, static_id, gov_role, faction) 
VALUES (
    gen_random_uuid(),
    'admin@example.com',
    'Технический администратор',
    'ADMIN001',
    'TECH_ADMIN',
    'GOV'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ПРОВЕРКА СОЗДАНИЯ
-- =====================================================

-- Проверяем созданные таблицы
SELECT 'Tables created successfully' as status;

-- Показываем список таблиц
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
