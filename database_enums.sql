-- =====================================================
-- ENUM'Ы ДЛЯ СИСТЕМЫ WASHINGTON
-- =====================================================
-- Этот файл создает ENUM'ы для всех ролей и типов из supabase/client.ts
-- Запускать ПОСЛЕ основного database_schema.sql

-- =====================================================
-- 1. ENUM'Ы ДЛЯ ДЕПАРТАМЕНТОВ
-- =====================================================

-- Создаем ENUM для департаментов
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_enum') THEN
        CREATE TYPE department_enum AS ENUM (
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
    END IF;
END $$;

-- =====================================================
-- 2. ENUM'Ы ДЛЯ ФРАКЦИЙ
-- =====================================================

-- Создаем ENUM для фракций
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faction_enum') THEN
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
    END IF;
END $$;

-- =====================================================
-- 3. ENUM'Ы ДЛЯ ГОСУДАРСТВЕННЫХ РОЛЕЙ
-- =====================================================

-- Создаем ENUM для государственных ролей
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gov_role_enum') THEN
        CREATE TYPE gov_role_enum AS ENUM (
            'NONE',
            'PROSECUTOR',
            'JUDGE',
            'TECH_ADMIN',
            'ATTORNEY_GENERAL',
            'CHIEF_JUSTICE'
        );
    END IF;
END $$;

-- =====================================================
-- 4. ENUM'Ы ДЛЯ ЛИДЕРСКИХ РОЛЕЙ
-- =====================================================

-- Создаем ENUM для лидерских ролей
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leader_role_enum') THEN
        CREATE TYPE leader_role_enum AS ENUM (
            'GOVERNOR',
            'DIRECTOR_WN',
            'DIRECTOR_FIB',
            'CHIEF_LSPD',
            'SHERIFF_LSCSD',
            'CHIEF_EMS',
            'COLONEL_SANG'
        );
    END IF;
END $$;

-- =====================================================
-- 5. ENUM'Ы ДЛЯ СТАТУСОВ НАЗНАЧЕНИЙ
-- =====================================================

-- Создаем ENUM для статусов назначений
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_enum') THEN
        CREATE TYPE appointment_status_enum AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'DONE',
            'CANCELLED'
        );
    END IF;
END $$;

-- =====================================================
-- 6. ENUM'Ы ДЛЯ СТАТУСОВ ВЕРИФИКАЦИИ
-- =====================================================

-- Создаем ENUM для статусов верификации
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED'
        );
    END IF;
END $$;

-- =====================================================
-- 7. ENUM'Ы ДЛЯ ТИПОВ ВЕРИФИКАЦИИ
-- =====================================================

-- Создаем ENUM для типов верификации
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_kind_enum') THEN
        CREATE TYPE verification_kind_enum AS ENUM (
            'ACCOUNT',
            'PROSECUTOR',
            'JUDGE',
            'OFFICE',
            'FACTION_MEMBER'
        );
    END IF;
END $$;

-- =====================================================
-- 8. ENUM'Ы ДЛЯ ТИПОВ ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================

-- Создаем ENUM для типов запросов на изменение ролей
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_change_request_type_enum') THEN
        CREATE TYPE role_change_request_type_enum AS ENUM (
            'FACTION',
            'GOV_ROLE',
            'LEADER_ROLE',
            'OFFICE_ROLE'
        );
    END IF;
END $$;

-- =====================================================
-- 9. ENUM'Ы ДЛЯ СТАТУСОВ ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
-- =====================================================

-- Создаем ENUM для статусов запросов на изменение ролей
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_change_request_status_enum') THEN
        CREATE TYPE role_change_request_status_enum AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED'
        );
    END IF;
END $$;

-- =====================================================
-- 10. ENUM'Ы ДЛЯ ТИПОВ ОРДЕРОВ
-- =====================================================

-- Создаем ENUM для типов ордеров
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warrant_type_enum') THEN
        CREATE TYPE warrant_type_enum AS ENUM (
            'AS',
            'S',
            'A'
        );
    END IF;
END $$;

-- =====================================================
-- 11. ENUM'Ы ДЛЯ СТАТУСОВ ОРДЕРОВ
-- =====================================================

-- Создаем ENUM для статусов ордеров
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warrant_status_enum') THEN
        CREATE TYPE warrant_status_enum AS ENUM (
            'active',
            'executed',
            'expired',
            'cancelled'
        );
    END IF;
END $$;

-- =====================================================
-- 12. ENUM'Ы ДЛЯ СТАТУСОВ ШТРАФОВ
-- =====================================================

-- Создаем ENUM для статусов штрафов
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fine_status_enum') THEN
        CREATE TYPE fine_status_enum AS ENUM (
            'UNPAID',
            'PAID',
            'CANCELLED'
        );
    END IF;
END $$;

-- =====================================================
-- 13. ENUM'Ы ДЛЯ СТАТУСОВ ИНСПЕКЦИЙ
-- =====================================================

-- Создаем ENUM для статусов инспекций
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status_enum') THEN
        CREATE TYPE inspection_status_enum AS ENUM (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;
END $$;

-- =====================================================
-- 14. ENUM'Ы ДЛЯ СТАТУСОВ ДЕЛ
-- =====================================================

-- Создаем ENUM для статусов дел
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status_enum') THEN
        CREATE TYPE case_status_enum AS ENUM (
            'open',
            'in_progress',
            'closed',
            'archived'
        );
    END IF;
END $$;

-- =====================================================
-- 15. ENUM'Ы ДЛЯ СТАТУСОВ АДВОКАТОВ
-- =====================================================

-- Создаем ENUM для статусов адвокатов
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lawyer_status_enum') THEN
        CREATE TYPE lawyer_status_enum AS ENUM (
            'ACTIVE',
            'SUSPENDED',
            'REVOKED'
        );
    END IF;
END $$;

-- =====================================================
-- 16. ENUM'Ы ДЛЯ СТАТУСОВ АКТОВ
-- =====================================================

-- Создаем ENUM для статусов актов
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'act_status_enum') THEN
        CREATE TYPE act_status_enum AS ENUM (
            'DRAFT',
            'PUBLISHED',
            'ARCHIVED'
        );
    END IF;
END $$;

-- =====================================================
-- 17. ENUM'Ы ДЛЯ СТАТУСОВ ЗАСЕДАНИЙ СУДА
-- =====================================================

-- Создаем ENUM для статусов заседаний суда
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'court_session_status_enum') THEN
        CREATE TYPE court_session_status_enum AS ENUM (
            'scheduled',
            'in_progress',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- =====================================================
-- 18. ПРОВЕРКА СОЗДАНИЯ ВСЕХ ENUM'ОВ
-- =====================================================

-- Выводим список всех созданных ENUM'ов
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    'department_enum',
    'faction_enum', 
    'gov_role_enum',
    'leader_role_enum',
    'appointment_status_enum',
    'verification_status_enum',
    'verification_kind_enum',
    'role_change_request_type_enum',
    'role_change_request_status_enum',
    'warrant_type_enum',
    'warrant_status_enum',
    'fine_status_enum',
    'inspection_status_enum',
    'case_status_enum',
    'lawyer_status_enum',
    'act_status_enum',
    'court_session_status_enum'
)
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Выводим сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE 'Все ENUM''ы для системы WASHINGTON созданы успешно!';
    RAISE NOTICE 'Теперь можно использовать их в таблицах для обеспечения целостности данных.';
END $$;
