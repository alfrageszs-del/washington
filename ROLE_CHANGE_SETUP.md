# Система запросов на изменение ролей (ОБНОВЛЕННАЯ ВЕРСИЯ)

## 📋 Описание

Система позволяет пользователям запрашивать изменение своих ролей (фракция, государственная роль, лидерская роль, офисная роль), а администраторам - одобрять или отклонять эти запросы. **Пользователи больше не могут изменять роли напрямую в профиле.**

## 🚀 Установка

### 1. База данных

Выполните SQL-скрипт `role_change_system.sql` в вашей базе данных Supabase:

```sql
-- Откройте файл role_change_system.sql и выполните его содержимое
-- в SQL Editor вашего проекта Supabase
```

### 2. TypeScript типы

Добавьте типы из файла `role_change_types.ts` в ваш проект:

```typescript
// Импортируйте типы в нужные файлы
import type { 
  RoleChangeRequest, 
  RoleChangeRequestType, 
  RoleChangeRequestStatus 
} from './role_change_types';
```

### 3. Компоненты

Скопируйте следующие компоненты в ваш проект:

- `app/components/RoleChangeRequestForm.tsx` - форма для создания запроса
- `app/admin/role-requests/page.tsx` - страница администратора
- Обновите `app/account/page.tsx` - добавьте секцию запросов в профиль
- Обновите `components/Navbar.tsx` - добавьте ссылку в админ-меню

## 🔧 Настройка

### Требования к базе данных

Убедитесь, что у вас есть:

1. **Таблица `profiles`** с полями:
   - `id` (UUID, PRIMARY KEY)
   - `faction` (TEXT)
   - `gov_role` (TEXT)
   - `leader_role` (TEXT, nullable)
   - `office_role` (TEXT, nullable)

2. **Таблица `notifications`** (опционально) для уведомлений

3. **Пользователи с ролями** `TECH_ADMIN`, `ATTORNEY_GENERAL`, или `CHIEF_JUSTICE` для управления запросами

### Настройка Supabase

1. Включите Row Level Security (RLS) для таблицы `role_change_requests`
2. Убедитесь, что политики RLS настроены правильно
3. Проверьте, что триггеры созданы и работают

## 📖 Использование

### Для пользователей

1. Зайдите в свой профиль (`/account`)
2. Найдите секцию "Запросы на изменение ролей"
3. Нажмите "Запросить изменение роли"
4. Заполните форму и отправьте запрос
5. Ожидайте рассмотрения администратором

### Для администраторов

1. Зайдите в админ-панель (`/admin/role-requests`)
2. Просмотрите список запросов
3. Для каждого запроса:
   - Прочитайте детали и причину
   - Нажмите "Одобрить" или "Отклонить"
   - При отклонении обязательно укажите причину
4. После одобрения роль пользователя автоматически обновится

## 🔒 Безопасность

- **Пользователи не могут сами изменять свои роли** - поле фракции в профиле теперь только для чтения
- Только администраторы могут одобрять/отклонять запросы
- Все действия логируются
- RLS политики защищают данные
- Автоматические уведомления о статусе запросов
- Обновлена политика профилей для предотвращения прямого изменения ролей

## 🐛 Устранение неполадок

### Ошибка "relation does not exist"

Убедитесь, что таблица `role_change_requests` создана:

```sql
-- Проверьте существование таблицы
SELECT * FROM information_schema.tables 
WHERE table_name = 'role_change_requests';
```

### Ошибка "policy does not exist"

Проверьте RLS политики:

```sql
-- Проверьте политики
SELECT * FROM pg_policies 
WHERE tablename = 'role_change_requests';
```

### Ошибка "function does not exist"

Проверьте функции и триггеры:

```sql
-- Проверьте функции
SELECT * FROM information_schema.routines 
WHERE routine_name LIKE '%role_change%';

-- Проверьте триггеры
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'role_change_requests';
```

### Пользователь не может создать запрос

Проверьте:
1. Авторизован ли пользователь
2. Правильно ли настроены RLS политики
3. Есть ли у пользователя профиль в таблице `profiles`

### Администратор не может видеть запросы

Проверьте:
1. Есть ли у пользователя роль `TECH_ADMIN`, `ATTORNEY_GENERAL`, или `CHIEF_JUSTICE`
2. Правильно ли настроена политика "Admins can view all role change requests"

### Пользователь все еще может изменять фракцию в профиле

Проверьте:
1. Обновлена ли политика профилей в SQL скрипте
2. Правильно ли работает RLS политика "Users can update their own profile (except roles)"

## 📝 Примеры SQL запросов

### Создание запроса (выполняется пользователем)

```sql
INSERT INTO role_change_requests (
    user_id,
    requested_by,
    request_type,
    current_value,
    requested_value,
    reason
) VALUES (
    'user-uuid-here',
    'requesting-user-uuid-here',
    'FACTION',
    'CIVILIAN',
    'LSPD',
    'Хочу вступить в полицию'
);
```

### Одобрение запроса (выполняется администратором)

```sql
-- Обновляем статус запроса
UPDATE role_change_requests 
SET 
    status = 'APPROVED',
    reviewed_by = 'admin-uuid-here',
    review_comment = 'Одобрено',
    reviewed_at = NOW()
WHERE id = 'request-uuid-here';

-- Обновляем профиль пользователя
UPDATE profiles 
SET faction = 'LSPD' 
WHERE id = 'user-uuid-here';
```

### Просмотр всех запросов

```sql
SELECT 
    rcr.*,
    p1.nickname as user_nickname,
    p2.nickname as requester_nickname,
    p3.nickname as reviewer_nickname
FROM role_change_requests rcr
LEFT JOIN profiles p1 ON rcr.user_id = p1.id
LEFT JOIN profiles p2 ON rcr.requested_by = p2.id
LEFT JOIN profiles p3 ON rcr.reviewed_by = p3.id
ORDER BY rcr.created_at DESC;
```

## 🔄 Миграция

При переносе на другой хостинг:

1. Выполните `role_change_system.sql` в новой базе данных
2. Скопируйте компоненты React
3. Обновите переменные окружения (URL и ключи Supabase)
4. Проверьте работу системы

## 📞 Поддержка

При возникновении проблем:

1. Проверьте консоль браузера на ошибки
2. Проверьте логи Supabase
3. Убедитесь, что все SQL-скрипты выполнены
4. Проверьте настройки RLS политик

## 🆕 Новые функции

### Исправления в профиле
- Поле фракции теперь только для чтения
- Добавлена подсказка о необходимости использования системы запросов
- Обновлена функция сохранения профиля

### Улучшения безопасности
- Обновлена RLS политика профилей
- Добавлены проверки в SQL скрипте
- Улучшена валидация данных

### Дополнительные проверки
- SQL скрипт теперь включает проверки создания таблиц, индексов и политик
- Добавлены примеры валидации
- Улучшена документация
