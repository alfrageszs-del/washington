-- =========================
-- A) ENUM TYPES (idempotent)
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'department_type') then
    create type public.department_type as enum (
      'GOVERNOR','VICE_GOVERNOR','MIN_FINANCE','MIN_JUSTICE','BAR_ASSOCIATION',
      'GOV_STAFF','MIN_DEFENSE','MIN_SECURITY','MIN_HEALTH','OTHER'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'faction_type') then
    create type public.faction_type as enum ('CIVILIAN','GOV','COURT','WN','FIB','LSPD','LSCSD','EMS','SANG');
  end if;

  if not exists (select 1 from pg_type where typname = 'gov_role_type') then
    create type public.gov_role_type as enum ('NONE','PROSECUTOR','JUDGE','TECH_ADMIN','ATTORNEY_GENERAL','CHIEF_JUSTICE');
  end if;

  if not exists (select 1 from pg_type where typname = 'leader_role_type') then
    create type public.leader_role_type as enum (
      'GOVERNOR','DIRECTOR_WN','DIRECTOR_FIB','CHIEF_LSPD','SHERIFF_LSCSD','CHIEF_EMS','COLONEL_SANG'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status_type') then
    create type public.appointment_status_type as enum ('PENDING','APPROVED','REJECTED','DONE','CANCELLED');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_status_type') then
    create type public.verification_status_type as enum ('PENDING','APPROVED','REJECTED');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_kind_type') then
    create type public.verification_kind_type as enum ('ACCOUNT','PROSECUTOR','JUDGE','OFFICE','FACTION_MEMBER');
  end if;

  if not exists (select 1 from pg_type where typname = 'fine_status_type') then
    create type public.fine_status_type as enum ('UNPAID','PAID','CANCELLED');
  end if;

  if not exists (select 1 from pg_type where typname = 'warrant_type_type') then
    create type public.warrant_type_type as enum ('ARREST','SEARCH','SEIZURE','DETENTION');
  end if;

  if not exists (select 1 from pg_type where typname = 'warrant_status_type') then
    create type public.warrant_status_type as enum ('ACTIVE','EXECUTED','REVOKED','EXPIRED');
  end if;

  if not exists (select 1 from pg_type where typname = 'role_change_request_type') then
    create type public.role_change_request_type as enum ('FACTION','GOV_ROLE','LEADER_ROLE','OFFICE_ROLE');
  end if;

  if not exists (select 1 from pg_type where typname = 'role_change_request_status') then
    create type public.role_change_request_status as enum ('PENDING','APPROVED','REJECTED');
  end if;
end $$;


-- =====================================
-- B) COMMON TRIGGERS / HELPER FUNCTIONS
-- =====================================

-- updated_at auto
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- формат ника: только буквы (латиница/кириллица) + один пробел между именем и фамилией
create or replace function public.nickname_is_valid(n text)
returns boolean language sql immutable as $$
  select n ~ '^[A-Za-zА-Яа-яЁё]+ [A-Za-zА-Яа-яЁё]+$'
$$;

-- Кто тех.админ
create or replace function public.is_tech_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.gov_role = 'TECH_ADMIN');
$$;

-- Судебный блок (прокуроры/судьи/генпрок/председатель ВС)
create or replace function public.is_judicial(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.gov_role in ('PROSECUTOR','JUDGE','ATTORNEY_GENERAL','CHIEF_JUSTICE')
  );
$$;

-- Держатель кабинета (назначен в office_role)
create or replace function public.is_office_holder(uid uuid, dept public.department_type)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.office_role = dept
  );
$$;

-- Проверка прав на рассмотрение заявок на верификацию
create or replace function public.can_review_verification(uid uuid, kind public.verification_kind_type)
returns boolean language sql stable as $$
  select
    case kind
      when 'ACCOUNT'     then public.is_tech_admin(uid)
      when 'PROSECUTOR'  then exists(select 1 from public.profiles p where p.id=uid and p.gov_role in ('ATTORNEY_GENERAL','TECH_ADMIN'))
      when 'JUDGE'       then exists(select 1 from public.profiles p where p.id=uid and p.gov_role in ('CHIEF_JUSTICE','TECH_ADMIN'))
      when 'OFFICE'      then public.is_tech_admin(uid)  -- можно расширить до губернатора/вице
      when 'FACTION_MEMBER' then public.is_tech_admin(uid) -- или лидер фракции по твоему желанию
    end;
$$;


-- ==================================
-- C) TABLES
-- ==================================

-- PROFILES
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  nickname     text not null,
  static_id    text not null,
  discord      text,
  faction      public.faction_type not null default 'CIVILIAN',
  gov_role     public.gov_role_type not null default 'NONE',
  is_verified  boolean not null default false,
  leader_role  public.leader_role_type,
  office_role  public.department_type,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint nickname_format_ok check (public.nickname_is_valid(nickname))
);
create unique index if not exists profiles_static_id_uq on public.profiles (static_id);
create unique index if not exists profiles_nickname_uq  on public.profiles (nickname);
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();


-- APPOINTMENTS
create table if not exists public.appointments (
  id                   uuid primary key default gen_random_uuid(),
  created_by           uuid not null references auth.users (id) on delete cascade,
  department           public.department_type not null,
  subject              text not null,
  preferred_datetime   timestamptz,
  status               public.appointment_status_type not null default 'PENDING',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists appt_by_dept_idx on public.appointments (department, created_at desc);
create index if not exists appt_by_creator_idx on public.appointments (created_by, created_at desc);
create trigger appt_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();


-- GOVERNMENT ACTS
create table if not exists public.government_acts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  summary       text,
  content       text not null,
  source_url    text,
  is_published  boolean not null default true,
  published_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists govacts_pub_idx on public.government_acts (is_published, published_at desc);
create trigger govacts_set_updated_at before update on public.government_acts
for each row execute function public.set_updated_at();


-- COURT ACTS
create table if not exists public.court_acts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  summary       text,
  content       text not null,
  source_url    text,
  is_published  boolean not null default true,
  published_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists courtacts_pub_idx on public.court_acts (is_published, published_at desc);
create trigger courtacts_set_updated_at before update on public.court_acts
for each row execute function public.set_updated_at();


-- VERIFICATION REQUESTS
create table if not exists public.verification_requests (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid not null references auth.users (id) on delete cascade,
  kind               public.verification_kind_type not null,
  comment            text,
  status             public.verification_status_type not null default 'PENDING',
  target_department  public.department_type,
  target_faction     public.faction_type,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists verreq_by_kind_status on public.verification_requests (kind, status, created_at desc);
create index if not exists verreq_by_creator     on public.verification_requests (created_by, created_at desc);
create trigger verreq_set_updated_at before update on public.verification_requests
for each row execute function public.set_updated_at();


-- FINES
create table if not exists public.fines (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid not null references auth.users (id) on delete cascade,
  offender_id        uuid,
  offender_static_id text not null,
  offender_name      text not null,
  issuer_faction     public.faction_type not null,
  amount             integer not null check (amount >= 0),
  reason             text not null,
  status             public.fine_status_type not null default 'UNPAID',
  issued_at          timestamptz not null default now(),
  paid_at            timestamptz,
  updated_at         timestamptz not null default now()
);
create index if not exists fines_by_subject_idx on public.fines (offender_static_id, issued_at desc);
create trigger fines_set_updated_at before update on public.fines
for each row execute function public.set_updated_at();


-- WARRANTS (ORDERS)
create table if not exists public.warrants (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid not null references auth.users (id) on delete cascade,
  subject_id         uuid,
  subject_static_id  text not null,
  subject_name       text not null,
  issuer_faction     public.faction_type not null,
  warrant_type       public.warrant_type_type not null,
  description        text not null,
  status             public.warrant_status_type not null default 'ACTIVE',
  issued_at          timestamptz not null default now(),
  executed_at        timestamptz,
  revoked_at         timestamptz,
  expires_at         timestamptz,
  updated_at         timestamptz not null default now()
);
create index if not exists warrants_by_subject_idx on public.warrants (subject_static_id, issued_at desc);
create trigger warrants_set_updated_at before update on public.warrants
for each row execute function public.set_updated_at();


-- ROLE CHANGE REQUESTS
create table if not exists public.role_change_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  requested_by      uuid not null references auth.users (id) on delete cascade,
  request_type      public.role_change_request_type not null,
  current_value     text,
  requested_value   text not null,
  reason            text not null,
  status            public.role_change_request_status not null default 'PENDING',
  reviewed_by       uuid,
  review_comment    text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists rcr_by_user_idx on public.role_change_requests (user_id, created_at desc);
create index if not exists rcr_by_status_idx on public.role_change_requests (status, created_at desc);
create trigger rcr_set_updated_at before update on public.role_change_requests
for each row execute function public.set_updated_at();


-- =====================================================
-- D) BUSINESS GUARDS (triggers to protect sensitive cols)
-- =====================================================

-- Запрет обычному юзеру менять "чувствительные" поля своего профиля
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
declare
  i_am_admin boolean;
begin
  i_am_admin := public.is_tech_admin(auth.uid());

  if not i_am_admin then
    -- запрет менять служебные роли и верификацию
    if new.gov_role is distinct from old.gov_role
       or new.faction  is distinct from old.faction
       or new.leader_role is distinct from old.leader_role
       or new.office_role is distinct from old.office_role
       or new.is_verified is distinct from old.is_verified
    then
      raise exception 'Forbidden: sensitive fields can be changed only by admin';
    end if;

    -- nickname формат контролится constraint’ом, но ок
    if not public.nickname_is_valid(new.nickname) then
      raise exception 'Invalid nickname format';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard_bu on public.profiles;
create trigger profiles_guard_bu
before update on public.profiles
for each row execute function public.profiles_guard();


-- ======================
-- E) ROW LEVEL SECURITY
-- ======================

-- PROFILES
alter table public.profiles enable row level security;

-- читать профили можно всем залогиненным (для отображения подписей/авторов)
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
  on public.profiles for select
  using (auth.uid() is not null);

-- обновлять свой профиль (без чувствительных полей — см. триггер)
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- тех.админ может обновлять любые профили
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles for update
  using (public.is_tech_admin(auth.uid()))
  with check (true);


-- APPOINTMENTS
alter table public.appointments enable row level security;

-- видеть: автор своей записи, держатель соответствующего кабинета, тех.админ
drop policy if exists appt_select on public.appointments;
create policy appt_select on public.appointments for select
using (
  created_by = auth.uid()
  or public.is_tech_admin(auth.uid())
  or public.is_office_holder(auth.uid(), department)
);

-- создавать: любой залогиненный
drop policy if exists appt_insert on public.appointments;
create policy appt_insert on public.appointments for insert
with check (auth.uid() is not null);

-- обновлять/удалять: автор, офис по направлению, тех.админ
drop policy if exists appt_update on public.appointments;
create policy appt_update on public.appointments for update
using (
  created_by = auth.uid()
  or public.is_tech_admin(auth.uid())
  or public.is_office_holder(auth.uid(), department)
)
with check (true);

drop policy if exists appt_delete on public.appointments;
create policy appt_delete on public.appointments for delete
using (
  created_by = auth.uid()
  or public.is_tech_admin(auth.uid())
  or public.is_office_holder(auth.uid(), department)
);


-- GOVERNMENT ACTS
alter table public.government_acts enable row level security;

-- читать: все опубликованные, плюс автор/админ видят свои черновики
drop policy if exists govacts_select on public.government_acts;
create policy govacts_select on public.government_acts for select
using (
  is_published = true
  or author_id = auth.uid()
  or public.is_tech_admin(auth.uid())
);

-- создавать могут залогиненные (контролируешь UI), редактировать/удалять — автор/админ
drop policy if exists govacts_insert on public.government_acts;
create policy govacts_insert on public.government_acts for insert
with check (auth.uid() is not null);

drop policy if exists govacts_update on public.government_acts;
create policy govacts_update on public.government_acts for update
using (author_id = auth.uid() or public.is_tech_admin(auth.uid()))
with check (author_id = auth.uid() or public.is_tech_admin(auth.uid()));

drop policy if exists govacts_delete on public.government_acts;
create policy govacts_delete on public.government_acts for delete
using (author_id = auth.uid() or public.is_tech_admin(auth.uid()));


-- COURT ACTS (аналогично)
alter table public.court_acts enable row level security;

drop policy if exists courtacts_select on public.court_acts;
create policy courtacts_select on public.court_acts for select
using (
  is_published = true
  or author_id = auth.uid()
  or public.is_tech_admin(auth.uid())
);

drop policy if exists courtacts_insert on public.court_acts;
create policy courtacts_insert on public.court_acts for insert
with check (auth.uid() is not null);

drop policy if exists courtacts_update on public.court_acts;
create policy courtacts_update on public.court_acts for update
using (author_id = auth.uid() or public.is_tech_admin(auth.uid()))
with check (author_id = auth.uid() or public.is_tech_admin(auth.uid()));

drop policy if exists courtacts_delete on public.court_acts;
create policy courtacts_delete on public.court_acts for delete
using (author_id = auth.uid() or public.is_tech_admin(auth.uid()));


-- VERIFICATION REQUESTS
alter table public.verification_requests enable row level security;

-- читать: автор заявки или тот, кто вправе её рассматривать
drop policy if exists verreq_select on public.verification_requests;
create policy verreq_select on public.verification_requests for select
using (
  created_by = auth.uid()
  or public.can_review_verification(auth.uid(), kind)
);

-- создавать: любой залогиненный, от своего имени
drop policy if exists verreq_insert on public.verification_requests;
create policy verreq_insert on public.verification_requests for insert
with check (created_by = auth.uid());

-- обновлять (менять статус): только уполномоченные
drop policy if exists verreq_update on public.verification_requests;
create policy verreq_update on public.verification_requests for update
using (public.can_review_verification(auth.uid(), kind))
with check (public.can_review_verification(auth.uid(), kind));

-- удалять: автор может удалить свою «PENDING», админ — любую
drop policy if exists verreq_delete on public.verification_requests;
create policy verreq_delete on public.verification_requests for delete
using (
  (created_by = auth.uid() and status = 'PENDING')
  or public.is_tech_admin(auth.uid())
);


-- FINES (штрафы) — доступ только судебному блоку; субъект видит свои штрафы (read-only)
alter table public.fines enable row level security;

drop policy if exists fines_select_judicial on public.fines;
create policy fines_select_judicial on public.fines for select
using (
  public.is_judicial(auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.static_id = offender_static_id
  )
);

drop policy if exists fines_cud_judicial on public.fines;
create policy fines_cud_judicial on public.fines for all
using (public.is_judicial(auth.uid()))
with check (public.is_judicial(auth.uid()));


-- WARRANTS (ордера) — доступ только судебному блоку; субъект видит свои ордера (read-only)
alter table public.warrants enable row level security;

drop policy if exists warrants_select_judicial on public.warrants;
create policy warrants_select_judicial on public.warrants for select
using (
  public.is_judicial(auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.static_id = subject_static_id
  )
);

drop policy if exists warrants_cud_judicial on public.warrants;
create policy warrants_cud_judicial on public.warrants for all
using (public.is_judicial(auth.uid()))
with check (public.is_judicial(auth.uid()));


-- ROLE CHANGE REQUESTS
alter table public.role_change_requests enable row level security;

-- читать: сам пользователь (user_id), автор запроса (requested_by) и тех.админ
drop policy if exists rcr_select on public.role_change_requests;
create policy rcr_select on public.role_change_requests for select
using (
  user_id = auth.uid() or requested_by = auth.uid() or public.is_tech_admin(auth.uid())
);

-- создавать: залогиненный; создатель фиксируется в requested_by (проверяется в check)
drop policy if exists rcr_insert on public.role_change_requests;
create policy rcr_insert on public.role_change_requests for insert
with check (requested_by = auth.uid());

-- обновлять/удалять: только тех.админ (упростили — модерация централизована)
drop policy if exists rcr_update_admin on public.role_change_requests;
create policy rcr_update_admin on public.role_change_requests for update
using (public.is_tech_admin(auth.uid()))
with check (public.is_tech_admin(auth.uid()));

drop policy if exists rcr_delete_admin on public.role_change_requests;
create policy rcr_delete_admin on public.role_change_requests for delete
using (public.is_tech_admin(auth.uid()));
