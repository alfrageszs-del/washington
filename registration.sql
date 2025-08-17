-- =========================
-- A) ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- =========================

create or replace function public.nickname_is_valid(n text)
returns boolean
language sql
immutable
as $$
  select n ~ '^[A-Za-zА-Яа-яЁё]+ [A-Za-zА-Яа-яЁё]+$'
$$;

create or replace function public.random_letters(n int)
returns text
language sql
as $$
  select string_agg(
           substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1 + floor(random()*26)::int, 1),
           ''
         )
  from generate_series(1, n);
$$;

-- =========================================
-- B) ТРИГГЕР-ФУНКЦИЯ СОЗДАНИЯ ПРОФИЛЯ (ЖЁСТКО)
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  meta         jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  nick_in      text  := nullif(meta->>'nickname',   '');
  full_in      text  := nullif(meta->>'full_name',  '');
  static_in    text  := nullif(meta->>'static_id',  '');
  discord_in   text  := nullif(meta->>'discord',    '');

  static_v     text;
  nick_v       text;
  full_v       text;
  email_v      text;
begin
  -- static_id всегда есть
  static_v := coalesce(static_in, 'uid-' || replace(left(new.id::text, 8), '-', ''));

  -- валидный NickName (Имя Фамилия), иначе Temp XXXXXXXX
  if nick_in is null or not public.nickname_is_valid(nick_in) then
    nick_v := 'Temp ' || public.random_letters(8);
  else
    nick_v := nick_in;
  end if;

  -- full_name обязателен -> дублируем ник, если пусто
  full_v := coalesce(full_in, nick_v);

  -- email обязателен -> берём реальный или <static_id>@local.email
  email_v := coalesce(new.email, lower(static_v) || '@local.email');

  insert into public.profiles (
    id, email, nickname, discord, full_name, static_id,
    is_verified, faction,            gov_role,
    created_at, updated_at
  )
  values (
    new.id, email_v, nick_v, discord_in, full_v, static_v,
    false,  'CIVILIAN'::public.faction_enum,
            'NONE'::public.gov_role_enum,
    now(),  now()
  )
  on conflict (id) do update
    set email      = excluded.email,
        nickname   = excluded.nickname,
        discord    = excluded.discord,
        full_name  = excluded.full_name,
        static_id  = excluded.static_id,
        updated_at = now();

  return new;
exception when others then
  -- не валим регистрацию, но пишем в лог
  perform pg_notify('handle_new_user_error', sqlstate || ' ' || sqlerrm);
  return new;
end;
$$;

-- Делаем владельцем postgres (обходит RLS)
alter function public.handle_new_user() owner to postgres;

-- ======================================
-- C) ПОЛИТИКА (опционально, но полезно)
-- ======================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self'
  ) then
    create policy profiles_insert_self
      on public.profiles
      for insert
      to authenticated
      with check (id = auth.uid());
  end if;
end$$;

-- ====================================
-- D) ПЕРЕСОЗДАТЬ ТРИГГЕР НА auth.users
-- ====================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ===========================================
-- E) БЭКФИЛЛ ДЛЯ УЖЕ СУЩЕСТВУЮЩИХ ПОЛЬЗОВАТЕЛЕЙ
-- ===========================================

insert into public.profiles (
  id, email, nickname, discord, full_name, static_id,
  is_verified, faction,            gov_role,
  created_at, updated_at
)
select
  u.id,
  coalesce(u.email, 'uid-'||replace(left(u.id::text,8),'-','')||'@local.email') as email,
  case
    when public.nickname_is_valid(coalesce((u.raw_user_meta_data->>'nickname')::text, '')) then
      (u.raw_user_meta_data->>'nickname')::text
    else
      'Temp ' || public.random_letters(8)
  end as nickname,
  null, -- discord неизвестен
  coalesce((u.raw_user_meta_data->>'full_name')::text,
           case when public.nickname_is_valid(coalesce((u.raw_user_meta_data->>'nickname')::text,'')) 
                then (u.raw_user_meta_data->>'nickname')::text
                else 'Temp ' || public.random_letters(8)
           end) as full_name,
  coalesce((u.raw_user_meta_data->>'static_id')::text,
           'uid-'||replace(left(u.id::text,8),'-','')) as static_id,
  false,
  'CIVILIAN'::public.faction_enum,
  'NONE'::public.gov_role_enum,
  now(), now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =========================
-- F) ПРОВЕРКА ТРИГГЕРА
-- =========================

-- Смотрим, что триггер реально существует и включён
select tgname, tgenabled
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname = 'on_auth_user_created';
