-- =====================================================
-- ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ БАЗЫ ДАННЫХ
-- =====================================================

-- 1. Проверяем существование таблиц
SELECT 'Tables check' as check_type, 
       table_name, 
       table_type 
FROM information_schema.tables 
WHERE table_name IN ('court_acts', 'gov_acts', 'cases', 'fines')
ORDER BY table_name;

-- 2. Проверяем структуру таблицы court_acts
SELECT 'court_acts columns' as check_type,
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'court_acts'
ORDER BY ordinal_position;

-- 3. Проверяем структуру таблицы gov_acts
SELECT 'gov_acts columns' as check_type,
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'gov_acts'
ORDER BY ordinal_position;

-- 4. Проверяем RLS для таблиц
SELECT 'RLS status' as check_type,
       schemaname, 
       tablename, 
       rowsecurity 
FROM pg_tables 
WHERE tablename IN ('court_acts', 'gov_acts', 'cases', 'fines');

-- 5. Проверяем политики безопасности
SELECT 'Policies' as check_type,
       schemaname, 
       tablename, 
       policyname, 
       permissive, 
       cmd, 
       qual
FROM pg_policies 
WHERE tablename IN ('court_acts', 'gov_acts', 'cases', 'fines');

-- 6. Проверяем права доступа
SELECT 'Grants' as check_type,
       grantee, 
       table_name, 
       privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('court_acts', 'gov_acts', 'cases', 'fines')
AND grantee = 'authenticated';

-- 7. Проверяем количество записей в таблицах
SELECT 'Record count' as check_type,
       'court_acts' as table_name,
       COUNT(*) as record_count
FROM court_acts
UNION ALL
SELECT 'Record count' as check_type,
       'gov_acts' as table_name,
       COUNT(*) as record_count
FROM gov_acts;
