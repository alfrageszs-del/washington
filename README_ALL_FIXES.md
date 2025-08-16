# Полное руководство по исправлению проблем в базе данных WASHINGTON

## Описание

Этот документ содержит инструкции по применению всех исправлений для системы WASHINGTON. Все файлы исправлений созданы для решения конкретных проблем без изменения существующей структуры базы данных.

## Порядок применения исправлений

### Шаг 1: Основная схема базы данных
```bash
# Применяем основную схему
psql -d your_database -f database_schema.sql
```

### Шаг 2: Основные исправления (Версия 2)
```bash
# Применяем исправления версии 2
psql -d your_database -f fix_database_issues_v2.sql
```

### Шаг 3: Исправление проблем с role_change_requests
```bash
# Исправляем проблему с requested_faction_value
psql -d your_database -f fix_role_change_requests.sql
```

### Шаг 4: Создание ENUM'ов для всех ролей
```bash
# Создаем ENUM'ы для обеспечения целостности данных
psql -d your_database -f database_enums.sql
```

### Шаг 5: Применение ENUM'ов к таблицам
```bash
# Автоматически применяем ENUM'ы ко всем соответствующим полям
psql -d your_database -f apply_enums_to_tables_complete.sql
```

## Описание файлов исправлений

### 1. `fix_database_issues_v2.sql`
**Решает проблемы:**
- ✅ Регистрация пользователей (функция `handle_new_user`)
- ✅ Отсутствующие колонки в таблицах (`status`, `created_at`, `current_faction_value`, `current_role_value`)
- ✅ Связи между таблицами (`cases.prosecutor_id`, `cases.judge_id`, `inspections.inspector_id`)
- ✅ Дополнение таблицы `lawyers`
- ✅ Обновление RLS политик

### 2. `fix_role_change_requests.sql`
**Решает проблему:**
- ✅ Отсутствующая колонка `requested_faction_value` в таблице `role_change_requests`
- ✅ Ошибка "Could not find the 'requested_faction_value' column of 'role_change_requests' in the schema cache"

### 3. `database_enums.sql`
**Создает ENUM'ы для:**
- ✅ Департаменты (`department_enum`)
- ✅ Фракции (`faction_enum`)
- ✅ Государственные роли (`gov_role_enum`)
- ✅ Лидерские роли (`leader_role_enum`)
- ✅ Статусы назначений (`appointment_status_enum`)
- ✅ Статусы верификации (`verification_status_enum`)
- ✅ Типы верификации (`verification_kind_enum`)
- ✅ Типы запросов на изменение ролей (`role_change_request_type_enum`)
- ✅ Статусы запросов на изменение ролей (`role_change_request_status_enum`)
- ✅ Типы ордеров (`warrant_type_enum`)
- ✅ Статусы ордеров (`warrant_status_enum`)
- ✅ Статусы штрафов (`fine_status_enum`)
- ✅ Статусы инспекций (`inspection_status_enum`)
- ✅ Статусы дел (`case_status_enum`)
- ✅ Статусы адвокатов (`lawyer_status_enum`)
- ✅ Статусы актов (`act_status_enum`)

### 4. `apply_enums_to_tables_complete.sql` (ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ - ИСПРАВЛЕННАЯ)
**Автоматически применяет ENUM'ы к:**
- ✅ **profiles** - faction, gov_role, leader_role, office_role
- ✅ **appointments** - department, status
- ✅ **verification_requests** - kind, status
- ✅ **role_change_requests** - request_type, status
- ✅ **gov_acts** - status
- ✅ **court_acts** - status
- ✅ **warrants** - warrant_type, status
- ✅ **cases** - status
- ✅ **court_sessions** - status
- ✅ **lawyers** - status
- ✅ **lawyer_requests** - status
- ✅ **lawyer_contracts** - status
- ✅ **inspections** - status
- ✅ **fines** - issuer_faction, status

**🛡️ Безопасность:** Проверяет все существующие значения перед конвертацией, пропускает колонки с недопустимыми значениями

**🔧 Исправления:** 
- Сначала удаляет RLS политики, обновляет колонки, затем восстанавливает политики
- **ИСПРАВЛЕНО:** Правильно обрабатывает разные названия колонок (`created_by` vs `requested_by` vs `user_id`)
- **ИСПРАВЛЕНО:** Добавляет политики для таблиц без колонки `created_by`

**📋 Полнота:** Обновляет ВСЕ необходимые колонки во ВСЕХ таблицах

**🐛 Исправленные ошибки:**
- `ERROR: 42703: column "created_by" does not exist` - исправлено для `role_change_requests` (использует `requested_by`)
- `ERROR: 42703: column "created_by" does not exist` - исправлено для `lawyer_requests` (использует `user_id`)
- `ERROR: 42703: column "created_by" does not exist` - исправлено для `lawyer_contracts` (использует `client_id`)

## Проблемы, которые исправляются

### 🔧 **Основные проблемы:**
1. **Регистрация пользователей** - данные не переносятся в таблицу `profiles`
2. **Отсутствующие колонки** - `status`, `created_at`, `current_faction_value`, `current_role_value`
3. **Связи между таблицами** - ошибки "Could not find a relationship between..."
4. **Запросы на изменение ролей** - ошибки с колонками `requested_faction_value`
5. **Заголовок страницы "Дела"** - изменен с "Судебные дела" на "Дела"

### 🎯 **Конкретные ошибки:**
- `column gov_acts.status does not exist`
- `column court_acts.status does not exist`
- `column fines.created_at does not exist`
- `Could not find the 'current_faction_value' column of 'role_change_requests' in the schema cache`
- `Could not find the 'current_role_value' column of 'role_change_requests' in the schema cache`
- `Could not find the 'requested_faction_value' column of 'role_change_requests' in the schema cache`
- `Could not find a relationship between 'cases' and 'profiles' in the schema cache`
- `Could not find a relationship between 'inspections' and 'profiles' in the schema cache`

## Безопасность и особенности

### 🛡️ **Безопасность:**
- Все файлы используют `DO $$` блоки для безопасного добавления колонок
- Проверки существования объектов перед выполнением операций
- Использование `DROP ... IF EXISTS` для безопасного удаления
- Все операции идемпотентны (безопасны при повторном выполнении)

### 🔄 **Особенности:**
- Файлы можно запускать многократно без вреда
- Проверки существования предотвращают ошибки дублирования
- Переименование колонок происходит только при необходимости
- Все внешние ключи правильно настроены для связей между таблицами

## Проверка результата

После выполнения всех файлов вы увидите:
- ✅ Статус всех добавленных колонок
- ✅ Подтверждение создания функции `handle_new_user`
- ✅ Подтверждение создания триггера `on_auth_user_created`
- ✅ Статус всех связей между таблицами
- ✅ Список всех созданных ENUM'ов
- ✅ Статус применения ENUM'ов ко всем таблицам
- ✅ Сообщения об успешном завершении

## Требования

- PostgreSQL 9.2 или выше (для `DROP ... IF EXISTS`)
- Права на создание функций, триггеров и типов данных
- Существующая база данных с таблицами из `database_schema.sql`

## Примечания

- **Порядок важен** - файлы должны применяться в указанной последовательности
- **ENUM'ы** создаются для обеспечения целостности данных на уровне базы
- **Все исправления** совместимы с существующей структурой
- **Проверки** встроены в каждый файл для подтверждения успешного выполнения

## Изменения в коде приложения

- Заголовок страницы "Дела" изменен с "Судебные дела" на "Дела"
- Комментарий в SQL схеме обновлен для соответствия
- Все типы из `supabase/client.ts` теперь имеют соответствующие ENUM'ы в базе данных

## Преимущества ENUM'ов

### 🎯 **Целостность данных:**
- **Строгая типизация** - невозможно вставить недопустимые значения
- **Валидация на уровне БД** - ошибки перехватываются до приложения
- **Консистентность** - все значения соответствуют определенным типам

### 🚀 **Производительность:**
- **Быстрые запросы** - ENUM'ы оптимизированы для сравнений
- **Эффективные индексы** - лучшая производительность при фильтрации
- **Меньше места** - ENUM'ы занимают меньше места чем TEXT

### 🛡️ **Безопасность:**
- **Защита от ошибок** - предотвращение опечаток и неверных значений
- **Валидация** - автоматическая проверка корректности данных
- **Аудит** - четкое понимание допустимых значений

## Поддержка

После применения всех исправлений система должна работать корректно со всеми связями между таблицами и без ошибок "column does not exist" или "relationship not found". Все поля теперь используют строгую типизацию ENUM вместо простых TEXT полей.

### 🔍 **Если некоторые колонки не обновились:**

Если в выводе `apply_enums_to_tables.sql` вы видите "TEXT (needs update)" для некоторых колонок, это означает, что в них есть значения, не соответствующие ENUM'ам. В этом случае:

1. **Проверьте данные** - посмотрите какие значения содержатся в проблемных колонках
2. **Очистите недопустимые значения** - замените их на допустимые или NULL
3. **Запустите скрипт повторно** - он автоматически обновит колонки после исправления данных

### 📊 **Пример проверки проблемных данных:**
```sql
-- Проверяем какие значения есть в проблемной колонке
SELECT DISTINCT faction FROM profiles WHERE faction IS NOT NULL;

-- Если есть недопустимые значения, исправляем их
UPDATE profiles SET faction = 'CIVILIAN' WHERE faction NOT IN ('CIVILIAN', 'GOV', 'COURT', 'WN', 'FIB', 'LSPD', 'LSCSD', 'EMS', 'SANG');
```
