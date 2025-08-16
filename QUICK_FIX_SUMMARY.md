# БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ SQL

## Проблема:
```
ERROR: 42601: syntax error at or near "current_role"
LINE 365: current_role gov_role_enum NOT NULL,
```

## Причина:
`current_role` - это зарезервированное слово в PostgreSQL.

## Решение:
Заменил зарезервированные слова на безопасные названия:

- `current_role` → `current_role_value`
- `requested_role` → `requested_role_value`  
- `current_faction` → `current_faction_value`
- `requested_faction` → `requested_faction_value`

## Файл для использования:
`NEW_DATABASE_SETUP_FIXED.sql` - содержит исправленную версию

## Что делать:
1. Скопировать содержимое `NEW_DATABASE_SETUP_FIXED.sql`
2. Выполнить в Supabase SQL Editor
3. Перезапустить приложение

## Дополнительные исправления:
- ✅ Исправлена ошибка с зарезервированными словами
- ✅ Добавлен автоматический триггер для создания профилей при регистрации
- ✅ Пользователи теперь автоматически попадают в базу данных

## Проверка:
После выполнения должны быть созданы все таблицы без ошибок, и регистрация должна работать корректно.
