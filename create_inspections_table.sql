-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ПРОВЕРОК И НАДЗОРА
-- =====================================================

-- Создаем ENUM для типов проверок
CREATE TYPE inspection_type_enum AS ENUM ('scheduled', 'unscheduled', 'follow_up');

-- Создаем ENUM для статусов проверок
CREATE TYPE inspection_status_enum AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Создаем таблицу проверок
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    inspector_id UUID NOT NULL REFERENCES profiles(id),
    target_entity VARCHAR(255) NOT NULL,
    inspection_type inspection_type_enum NOT NULL DEFAULT 'scheduled',
    status inspection_status_enum NOT NULL DEFAULT 'planned',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    findings TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_target_entity ON inspections(target_entity);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_start_date ON inspections(start_date);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(inspection_type);

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspections_updated_at 
    BEFORE UPDATE ON inspections 
    FOR EACH ROW EXECUTE FUNCTION update_inspections_updated_at();

-- Включаем RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Создаем политики безопасности
CREATE POLICY "Everyone can view inspections" ON inspections
    FOR SELECT USING (true);

CREATE POLICY "Inspectors can manage inspections" ON inspections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.gov_role IN ('TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE')
        )
    );

-- Даем права на вставку, обновление и удаление для авторизованных пользователей
GRANT ALL ON inspections TO authenticated;

-- Проверяем создание таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'inspections';
