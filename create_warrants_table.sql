-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ОРДЕРОВ
-- =====================================================

-- Создаем ENUM для типов ордеров
CREATE TYPE warrant_type_enum AS ENUM ('AS');

-- Создаем ENUM для статусов ордеров
CREATE TYPE warrant_status_enum AS ENUM ('active', 'expired', 'executed');

-- Создаем таблицу ордеров
CREATE TABLE IF NOT EXISTS warrants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type warrant_type_enum NOT NULL DEFAULT 'AS',
    target_name VARCHAR(255) NOT NULL,
    target_id VARCHAR(100),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    warrant_url TEXT NOT NULL,
    articles TEXT[] NOT NULL,
    description TEXT,
    issued_by VARCHAR(255) NOT NULL,
    issued_by_id UUID NOT NULL REFERENCES profiles(id),
    status warrant_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_warrants_target_name ON warrants(target_name);
CREATE INDEX IF NOT EXISTS idx_warrants_target_id ON warrants(target_id);
CREATE INDEX IF NOT EXISTS idx_warrants_issued_by_id ON warrants(issued_by_id);
CREATE INDEX IF NOT EXISTS idx_warrants_status ON warrants(status);
CREATE INDEX IF NOT EXISTS idx_warrants_valid_until ON warrants(valid_until);

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_warrants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_warrants_updated_at 
    BEFORE UPDATE ON warrants 
    FOR EACH ROW EXECUTE FUNCTION update_warrants_updated_at();

-- Включаем RLS
ALTER TABLE warrants ENABLE ROW LEVEL SECURITY;

-- Создаем политики безопасности
CREATE POLICY "Everyone can view warrants" ON warrants
    FOR SELECT USING (true);

CREATE POLICY "Judges and prosecutors can manage warrants" ON warrants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('JUDGE', 'PROSECUTOR', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE', 'TECH_ADMIN')
        )
    );

-- Даем права на вставку, обновление и удаление для авторизованных пользователей
GRANT ALL ON warrants TO authenticated;

-- Проверяем создание таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'warrants';
