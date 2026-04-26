
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_single_active_admin()
returns trigger as $$
begin
  if new.role = 'admin' and coalesce(new.status, 'Active') <> 'Removed' then
    if exists (
      select 1
      from public.users existing_admin
      where existing_admin.role = 'admin'
        and coalesce(existing_admin.status, 'Active') <> 'Removed'
        and (tg_op = 'INSERT' or existing_admin.id <> new.id)
    ) then
      raise exception 'Only one active admin account is allowed in public.users.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function public.derive_display_name_from_email(input_email text)
returns text as $$
declare
  local_part text;
begin
  local_part := split_part(lower(coalesce(input_email, 'patient@example.com')), '@', 1);
  local_part := replace(replace(replace(local_part, '.', ' '), '_', ' '), '-', ' ');
  return initcap(trim(local_part));
end;
$$ language plpgsql immutable;

create or replace function public.sync_auth_user_into_public_users()
returns trigger as $$
declare
  safe_email text := lower(trim(coalesce(new.email, '')));
  derived_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    public.derive_display_name_from_email(new.email)
  );
  requested_role text := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'patient')));
  resolved_role text := case
    when requested_role in ('admin', 'doctor', 'nurse', 'receptionist', 'patient', 'wardboy')
      then requested_role
    else 'patient'
  end;
  auth_confirmed_at timestamptz := coalesce(new.email_confirmed_at, new.confirmed_at);
  next_auth_status text := case
    when auth_confirmed_at is not null or new.last_sign_in_at is not null then 'active'
    else 'pending_confirmation'
  end;
begin
  if safe_email = '' then
    return new;
  end if;

  update public.users
  set auth_user_id = new.id,
      email = safe_email,
      name = case
        when coalesce(trim(name), '') = '' then derived_name
        else name
      end,
      role = case
        when coalesce(status, 'Active') = 'Removed' then role
        when lower(coalesce(role, '')) in ('', 'patient') then resolved_role
        else role
      end,
      auth_status = case
        when coalesce(status, 'Active') = 'Removed' then 'disabled'
        else next_auth_status
      end,
      confirmation_sent_at = case
        when auth_confirmed_at is null then coalesce(confirmation_sent_at, now())
        else confirmation_sent_at
      end,
      confirmed_at = coalesce(auth_confirmed_at, confirmed_at),
      last_login = coalesce(new.last_sign_in_at, last_login),
      updated_at = now()
  where auth_user_id = new.id
     or lower(email) = safe_email;

  if not found then
    insert into public.users (
      auth_user_id,
      email,
      name,
      role,
      status,
      auth_status,
      confirmation_sent_at,
      confirmed_at,
      last_login,
      removed_at
    )
    values (
      new.id,
      safe_email,
      derived_name,
      resolved_role,
      'Active',
      next_auth_status,
      case when auth_confirmed_at is null then now() else null end,
      auth_confirmed_at,
      new.last_sign_in_at,
      null
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace function public.mark_removed_auth_user_in_public_users()
returns trigger as $$
begin
  update public.users
  set status = 'Removed',
      auth_status = 'disabled',
      removed_at = coalesce(removed_at, now()),
      updated_at = now()
  where auth_user_id = old.id
     or lower(email) = lower(coalesce(old.email, ''));

  return old;
end;
$$ language plpgsql security definer set search_path = public, auth;

create table if not exists public.users (
  id bigint generated always as identity primary key,
  auth_user_id uuid,
  email text not null unique,
  name text,
  role text not null default 'patient',
  department text,
  depid bigint,
  phone text,
  address text,
  gender text,
  shift text,
  shift_start text,
  shift_end text,
  qualification text,
  specialization text,
  experience integer,
  salary numeric,
  status text default 'Active',
  bloodgroup text,
  emergencyphoneno text,
  disease text,
  auth_status text default 'active',
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  last_login timestamptz,
  removed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists department text;
alter table public.users add column if not exists depid bigint;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists address text;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists shift text;
alter table public.users add column if not exists shift_start text;
alter table public.users add column if not exists shift_end text;
alter table public.users add column if not exists qualification text;
alter table public.users add column if not exists specialization text;
alter table public.users add column if not exists experience integer;
alter table public.users add column if not exists salary numeric;
alter table public.users add column if not exists status text default 'Active';
alter table public.users add column if not exists bloodgroup text;
alter table public.users add column if not exists emergencyphoneno text;
alter table public.users add column if not exists disease text;
alter table public.users add column if not exists auth_status text default 'active';
alter table public.users add column if not exists confirmation_sent_at timestamptz;
alter table public.users add column if not exists confirmed_at timestamptz;
alter table public.users add column if not exists last_login timestamptz;
alter table public.users add column if not exists removed_at timestamptz;
alter table public.users add column if not exists created_at timestamptz default now();
alter table public.users add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_key'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_key unique (auth_user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end;
$$;

create table if not exists public.login_events (
  id bigint generated always as identity primary key,
  user_email text,
  event text,
  message text,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  patient_id bigint,
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  doctor_id bigint,
  doctor_name text,
  doctor_email text,
  department text,
  depid bigint,
  appointmentdate timestamptz not null default now(),
  date timestamptz,
  time text,
  disease text,
  note text,
  reason text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments add column if not exists patient_id bigint;
alter table public.appointments add column if not exists patient_name text;
alter table public.appointments add column if not exists patient_email text;
alter table public.appointments add column if not exists patient_phone text;
alter table public.appointments add column if not exists doctor_id bigint;
alter table public.appointments add column if not exists doctor_name text;
alter table public.appointments add column if not exists doctor_email text;
alter table public.appointments add column if not exists department text;
alter table public.appointments add column if not exists depid bigint;
alter table public.appointments add column if not exists appointmentdate timestamptz default now();
alter table public.appointments add column if not exists date timestamptz;
alter table public.appointments add column if not exists time text;
alter table public.appointments add column if not exists disease text;
alter table public.appointments add column if not exists note text;
alter table public.appointments add column if not exists reason text;
alter table public.appointments add column if not exists status text default 'Pending';
alter table public.appointments add column if not exists created_at timestamptz default now();
alter table public.appointments add column if not exists updated_at timestamptz default now();

create table if not exists public.applications (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  role text not null,
  department text,
  coverletter text,
  licensenumber text,
  yearsexperience integer,
  shiftpreference text,
  languages text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.applications add column if not exists name text;
alter table public.applications add column if not exists email text;
alter table public.applications add column if not exists role text;
alter table public.applications add column if not exists department text;
alter table public.applications add column if not exists coverletter text;
alter table public.applications add column if not exists licensenumber text;
alter table public.applications add column if not exists yearsexperience integer;
alter table public.applications add column if not exists shiftpreference text;
alter table public.applications add column if not exists languages text;
alter table public.applications add column if not exists status text default 'Pending';
alter table public.applications add column if not exists created_at timestamptz default now();
alter table public.applications add column if not exists updated_at timestamptz default now();

create table if not exists public.wardboytasks (
  id bigint generated always as identity primary key,
  wardboy_id bigint,
  wardboy_name text,
  description text not null,
  status text default 'Pending',
  assigned_by_role text,
  assigned_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.wardboytasks add column if not exists wardboy_id bigint;
alter table public.wardboytasks add column if not exists wardboy_name text;
alter table public.wardboytasks add column if not exists description text;
alter table public.wardboytasks add column if not exists status text default 'Pending';
alter table public.wardboytasks add column if not exists assigned_by_role text;
alter table public.wardboytasks add column if not exists assigned_by_name text;
alter table public.wardboytasks add column if not exists created_at timestamptz default now();
alter table public.wardboytasks add column if not exists updated_at timestamptz default now();

create table if not exists public.departments (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.departments add column if not exists name text;
alter table public.departments add column if not exists created_at timestamptz default now();
alter table public.departments add column if not exists updated_at timestamptz default now();

create table if not exists public.wards (
  id bigint generated always as identity primary key,
  wardno text not null unique,
  depid bigint,
  totalbeds integer not null default 0,
  availablebeds integer not null default 0,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.wards add column if not exists wardno text;
alter table public.wards add column if not exists depid bigint;
alter table public.wards add column if not exists totalbeds integer default 0;
alter table public.wards add column if not exists availablebeds integer default 0;
alter table public.wards add column if not exists status text default 'Active';
alter table public.wards add column if not exists created_at timestamptz default now();
alter table public.wards add column if not exists updated_at timestamptz default now();

create unique index if not exists departments_name_unique on public.departments (name);
create unique index if not exists wards_wardno_unique on public.wards (wardno);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_auth_user_id_idx on public.users (auth_user_id);
create index if not exists users_auth_status_idx on public.users (auth_status);
create index if not exists users_depid_idx on public.users (depid);
create index if not exists appointments_patient_email_idx on public.appointments (patient_email);
create index if not exists wardboytasks_wardboy_id_idx on public.wardboytasks (wardboy_id);

insert into public.departments (name)
values
  ('Emergency'),
  ('Surgical'),
  ('Pediatrics'),
  ('Orthopedics'),
  ('Radiology')
on conflict (name) do nothing;

insert into public.wards (wardno, depid, totalbeds, availablebeds, status)
values
  ('E-101', (select id from public.departments where name = 'Emergency' limit 1), 20, 20, 'Active'),
  ('S-201', (select id from public.departments where name = 'Surgical' limit 1), 18, 18, 'Active'),
  ('P-301', (select id from public.departments where name = 'Pediatrics' limit 1), 22, 22, 'Active'),
  ('O-401', (select id from public.departments where name = 'Orthopedics' limit 1), 16, 16, 'Active'),
  ('R-501', (select id from public.departments where name = 'Radiology' limit 1), 12, 12, 'Active')
on conflict (wardno) do nothing;

update public.users as app_user
set auth_user_id = auth_account.id,
    email = lower(auth_account.email),
    confirmed_at = coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at, app_user.confirmed_at),
    last_login = coalesce(auth_account.last_sign_in_at, app_user.last_login),
    auth_status = case
      when coalesce(app_user.status, 'Active') = 'Removed' then 'disabled'
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at, auth_account.last_sign_in_at) is not null then 'active'
      else coalesce(app_user.auth_status, 'pending_confirmation')
    end,
    confirmation_sent_at = case
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at) is null
        then coalesce(app_user.confirmation_sent_at, now())
      else app_user.confirmation_sent_at
    end,
    updated_at = now()
from auth.users as auth_account
where lower(app_user.email) = lower(auth_account.email)
  and (app_user.auth_user_id is distinct from auth_account.id or app_user.auth_user_id is null);

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
before update on public.users
for each row execute function public.update_timestamp();

drop trigger if exists users_single_admin_guard on public.users;
create trigger users_single_admin_guard
before insert or update on public.users
for each row execute function public.enforce_single_active_admin();

drop trigger if exists on_auth_user_created_or_updated on auth.users;
create trigger on_auth_user_created_or_updated
after insert or update on auth.users
for each row execute function public.sync_auth_user_into_public_users();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row execute function public.mark_removed_auth_user_in_public_users();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
before update on public.appointments
for each row execute function public.update_timestamp();

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
before update on public.applications
for each row execute function public.update_timestamp();

drop trigger if exists wardboytasks_updated_at on public.wardboytasks;
create trigger wardboytasks_updated_at
before update on public.wardboytasks
for each row execute function public.update_timestamp();

drop trigger if exists wards_updated_at on public.wards;
create trigger wards_updated_at
before update on public.wards
for each row execute function public.update_timestamp();

drop trigger if exists departments_updated_at on public.departments;
create trigger departments_updated_at
before update on public.departments
for each row execute function public.update_timestamp();

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

alter table public.users enable row level security;
alter table public.login_events enable row level security;
alter table public.appointments enable row level security;
alter table public.applications enable row level security;
alter table public.wardboytasks enable row level security;
alter table public.departments enable row level security;
alter table public.wards enable row level security;

drop policy if exists users_all_access on public.users;
create policy users_all_access
on public.users
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists login_events_all_access on public.login_events;
create policy login_events_all_access
on public.login_events
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists appointments_all_access on public.appointments;
create policy appointments_all_access
on public.appointments
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists applications_all_access on public.applications;
create policy applications_all_access
on public.applications
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists wardboytasks_all_access on public.wardboytasks;
create policy wardboytasks_all_access
on public.wardboytasks
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists departments_all_access on public.departments;
create policy departments_all_access
on public.departments
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists wards_all_access on public.wards;
create policy wards_all_access
on public.wards
for all
to anon, authenticated
using (true)
with check (true);
