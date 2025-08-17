-- =====================================================
-- СОЗДАНИЕ ENUM'ОВ ДЛЯ УВЕДОМЛЕНИЙ
-- =====================================================

-- 1. Создаем ENUM для типов уведомлений
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'document',      -- Документы
        'court',         -- Суд
        'fine',          -- Штрафы
        'wanted',        -- Ордера на арест
        'system',        -- Система
        'role_change'    -- Изменение роли
    );
    RAISE NOTICE 'ENUM notification_type_enum создан успешно';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ENUM notification_type_enum уже существует';
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка создания ENUM notification_type_enum: %', SQLERRM;
END $$;

-- 2. Создаем ENUM для приоритетов уведомлений
DO $$ BEGIN
    CREATE TYPE notification_priority_enum AS ENUM (
        'low',           -- Низкий приоритет
        'medium',        -- Средний приоритет
        'high'           -- Высокий приоритет
    );
    RAISE NOTICE 'ENUM notification_priority_enum создан успешно';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ENUM notification_priority_enum уже существует';
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка создания ENUM notification_priority_enum: %', SQLERRM;
END $$;

-- 3. Проверяем создание ENUM'ов
SELECT 
    'ENUM creation status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum')
        THEN 'SUCCESS - notification_type_enum created'
        ELSE 'FAILED - notification_type_enum not created'
    END as type_enum_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority_enum')
        THEN 'SUCCESS - notification_priority_enum created'
        ELSE 'FAILED - notification_priority_enum not created'
    END as priority_enum_status;

-- 4. Показываем детали созданных ENUM'ов
SELECT 
    'ENUM details' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('notification_type_enum', 'notification_priority_enum')
ORDER BY t.typname, e.enumsortorder;

-- 5. Проверяем, что ENUM'ы можно использовать в таблицах
DO $$
DECLARE
    test_type notification_type_enum;
    test_priority notification_priority_enum;
BEGIN
    -- Тестируем типы
    test_type := 'system'::notification_type_enum;
    test_priority := 'medium'::notification_priority_enum;
    
    RAISE NOTICE 'Тест ENUM''ов: type=%, priority=%', test_type, test_priority;
    RAISE NOTICE 'ENUM''ы работают корректно!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка тестирования ENUM''ов: %', SQLERRM;
END $$;

-- 6. Показываем все ENUM'ы в базе данных
SELECT 
    'All ENUMs in database' as info,
    t.typname as enum_name,
    t.typtype as type_category,
    n.nspname as schema_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typtype = 'e'  -- 'e' означает ENUM
ORDER BY n.nspname, t.typname;

-- 7. Проверяем права доступа к ENUM'ам
SELECT 
    'ENUM permissions' as check_type,
    t.typname as enum_name,
    r.rolname as role_name,
    p.privilege_type,
    p.is_grantable
FROM pg_type t
CROSS JOIN (SELECT 'authenticated'::name UNION SELECT 'anon' UNION SELECT 'service_role') r(rolname)
LEFT JOIN information_schema.role_table_grants p ON p.table_name = t.typname
WHERE t.typname IN ('notification_type_enum', 'notification_priority_enum')
ORDER BY t.typname, r.rolname;

-- 8. Даем права на использование ENUM'ов
GRANT USAGE ON TYPE notification_type_enum TO authenticated;
GRANT USAGE ON TYPE notification_type_enum TO anon;
GRANT USAGE ON TYPE notification_type_enum TO service_role;

GRANT USAGE ON TYPE notification_priority_enum TO authenticated;
GRANT USAGE ON TYPE notification_priority_enum TO anon;
GRANT USAGE ON TYPE notification_priority_enum TO service_role;

-- 9. Финальная проверка
SELECT 
    'Final ENUM status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum')
        THEN 'SUCCESS - Type ENUM exists'
        ELSE 'FAILED - Type ENUM missing'
    END as type_enum_final,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority_enum')
        THEN 'SUCCESS - Priority ENUM exists'
        ELSE 'FAILED - Priority ENUM missing'
    END as priority_enum_final,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.role_table_grants 
            WHERE table_name = 'notification_type_enum' 
            AND grantee = 'authenticated' 
            AND privilege_type = 'USAGE'
        )
        THEN 'SUCCESS - Permissions granted'
        ELSE 'FAILED - Permissions not granted'
    END as permissions_status;

RAISE NOTICE 'Создание ENUM''ов для уведомлений завершено!';
RAISE NOTICE 'Теперь можно создавать таблицу notifications с этими ENUM''ами.';
