# 📋 Создание системы уведомлений

## 🎯 Цель
Создать полноценную систему уведомлений для пользователей с поддержкой различных типов и приоритетов.

## 📁 Файлы для создания

### 1. `create_notification_enums.sql` - Создание ENUM'ов
**Что делает:**
- Создает ENUM `notification_type_enum` для типов уведомлений
- Создает ENUM `notification_priority_enum` для приоритетов
- Настраивает права доступа к ENUM'ам

**Типы уведомлений:**
- `document` - Документы
- `court` - Суд
- `fine` - Штрафы
- `wanted` - Ордера на арест
- `system` - Система
- `role_change` - Изменение роли

**Приоритеты:**
- `low` - Низкий
- `medium` - Средний
- `high` - Высокий

### 2. `create_notifications_table_only.sql` - Создание таблицы
**Что делает:**
- Создает таблицу `notifications` с использованием ENUM'ов
- Настраивает RLS политики для безопасности
- Создает индексы для производительности
- Создает триггеры и функции
- Добавляет тестовые уведомления

## 🚀 Порядок применения

### Шаг 1: Создание ENUM'ов
```bash
psql -d your_database -f create_notification_enums.sql
```

**Ожидаемый результат:**
```
NOTICE: ENUM notification_type_enum создан успешно
NOTICE: ENUM notification_priority_enum создан успешно
```

### Шаг 2: Создание таблицы
```bash
psql -d your_database -f create_notifications_table_only.sql
```

**Ожидаемый результат:**
```
NOTICE: ENUM''ы найдены, продолжаем создание таблицы...
NOTICE: Таблица notifications создана успешно!
```

## 🔍 Проверка результата

### Проверка ENUM'ов
```sql
-- Проверяем созданные ENUM'ы
SELECT typname, typtype FROM pg_type 
WHERE typname IN ('notification_type_enum', 'notification_priority_enum');

-- Показываем значения ENUM'ов
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('notification_type_enum', 'notification_priority_enum');
```

### Проверка таблицы
```sql
-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- Проверяем RLS политики
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';

-- Проверяем созданные уведомления
SELECT * FROM notifications;
```

## 🛠️ Использование в коде

### Создание уведомления
```typescript
import { supabase } from '../../lib/supabase/client';

// Создание системного уведомления
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'user-uuid',
    type: 'system',
    title: 'Новое уведомление',
    message: 'Текст уведомления',
    priority: 'medium',
    url: '/some-page'
  });
```

### Загрузка уведомлений пользователя
```typescript
const { data: notifications, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

## 🔒 Безопасность

### RLS политики
- **SELECT**: Пользователи видят только свои уведомления
- **UPDATE**: Пользователи обновляют только свои уведомления
- **DELETE**: Пользователи удаляют только свои уведомления
- **INSERT**: Система может создавать уведомления для любого пользователя

### Права доступа
- `authenticated` - полный доступ к своим уведомлениям
- `anon` - базовый доступ (для регистрации)
- `service_role` - полный доступ (для системных функций)

## 📊 Производительность

### Индексы
- `idx_notifications_user_id` - быстрый поиск по пользователю
- `idx_notifications_created_at` - сортировка по дате
- `idx_notifications_is_read` - фильтрация по статусу
- `idx_notifications_type` - фильтрация по типу

## 🧪 Тестирование

### Автоматические тесты
Скрипты автоматически:
- Проверяют создание ENUM'ов
- Проверяют создание таблицы
- Проверяют RLS политики
- Создают тестовые уведомления
- Показывают результаты проверок

### Ручное тестирование
```sql
-- Тест создания уведомления
INSERT INTO notifications (user_id, type, title, message, priority)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'system',
  'Тестовое уведомление',
  'Это тестовое уведомление для проверки',
  'high'
);

-- Проверка результата
SELECT * FROM notifications WHERE title = 'Тестовое уведомление';
```

## ⚠️ Возможные проблемы

### 1. ENUM'ы не созданы
**Ошибка:** `type "notification_type_enum" does not exist`
**Решение:** Сначала запустите `create_notification_enums.sql`

### 2. Права доступа
**Ошибка:** `permission denied for table notifications`
**Решение:** Проверьте, что RLS политики созданы и права выданы

### 3. Дублирование
**Ошибка:** `duplicate key value violates unique constraint`
**Решение:** Используйте `IF NOT EXISTS` или проверяйте существование

## 🎉 Результат

После успешного выполнения:
✅ **ENUM'ы созданы** для типов и приоритетов  
✅ **Таблица создана** с правильной структурой  
✅ **RLS настроен** для безопасности  
✅ **Индексы созданы** для производительности  
✅ **Функции готовы** для использования  
✅ **Тестовые данные** добавлены  

Теперь система уведомлений готова к использованию! 🚀
