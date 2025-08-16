# ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С РЕГИСТРАЦИЕЙ

## Проблема:
При регистрации аккаунта пользователь НЕ попадает в базу данных (таблицу `profiles`).

## Причина:
Supabase создает пользователя только в таблице `auth.users`, но не в нашей таблице `profiles`.

## Решение:
Добавлен автоматический триггер, который создает профиль при регистрации.

## Что добавлено в SQL:

### 1. Функция автоматического создания профиля:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, gov_role, faction)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Новый пользователь'),
        'PROSECUTOR',
        'LSPD'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Триггер на таблицу auth.users:
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Как это работает:

1. **Пользователь регистрируется** через Supabase Auth
2. **Создается запись** в таблице `auth.users`
3. **Срабатывает триггер** `on_auth_user_created`
4. **Автоматически создается** запись в таблице `profiles`
5. **Пользователь получает** роль `PROSECUTOR` и фракцию `LSPD`

## Для получения имени пользователя:

### В форме регистрации добавьте поле `full_name` и передайте его в `user_metadata`:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Иван Иванов'  // Это поле попадет в профиль
    }
  }
})
```

## Проверка:

1. Выполните обновленный SQL файл `NEW_DATABASE_SETUP_FIXED.sql`
2. Зарегистрируйте нового пользователя
3. Проверьте таблицу `profiles` - должна появиться новая запись
4. Пользователь автоматически получит роль и фракцию

## Результат:
Теперь при каждой регистрации пользователь автоматически попадает в базу данных! 🎉
