-- =====================================================
-- ИСПРАВЛЕНИЕ ОГРАНИЧЕНИЙ БАЗЫ ДАННЫХ
-- =====================================================

-- Проверяем существующие ограничения
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Удаляем существующие ограничения, если они есть
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gov_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_faction_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_leader_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_office_role_check;

-- Создаем новые ограничения, соответствующие нашим типам
ALTER TABLE profiles ADD CONSTRAINT profiles_gov_role_check 
    CHECK (gov_role IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'));

ALTER TABLE profiles ADD CONSTRAINT profiles_faction_check 
    CHECK (faction IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG'));

ALTER TABLE profiles ADD CONSTRAINT profiles_leader_role_check 
    CHECK (leader_role IS NULL OR leader_role IN ('GOVERNOR', 'DIRECTOR_WN', 'DIRECTOR_FIB', 'CHIEF_LSPD', 'SHERIFF_LSCSD', 'CHIEF_EMS', 'COLONEL_SANG'));

ALTER TABLE profiles ADD CONSTRAINT profiles_office_role_check 
    CHECK (office_role IS NULL OR office_role IN ('GOVERNOR', 'VICE_GOVERNOR', 'MIN_FINANCE', 'MIN_JUSTICE', 'BAR_ASSOCIATION', 'GOV_STAFF', 'MIN_DEFENSE', 'MIN_SECURITY', 'MIN_HEALTH', 'OTHER'));

-- Проверяем, что ограничения созданы
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Обновляем существующие записи, если нужно
UPDATE profiles SET gov_role = 'NONE' WHERE gov_role NOT IN ('NONE', 'PROSECUTOR', 'JUDGE', 'TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE');
UPDATE profiles SET faction = 'CIVILIAN' WHERE faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG');

-- Проверяем, что все данные корректны
SELECT 'Profiles table constraints fixed successfully' as status;
