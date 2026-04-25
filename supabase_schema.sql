-- Supabase schema for CareSphere Hospital app

-- users table: contains staff, doctors, wardboys, and patient-type profiles
create table if not exists public.users (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text,
  role text not null,
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
  experience text,
  salary numeric,
  status text default 'Active',
  bloodgroup text,
  emergencyphoneno text,
  disease text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- appointments table
create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  doctor_name text,
  doctor_email text,
  department text,
  date date not null,
  time text not null,
  reason text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- applications table
create table if not exists public.applications (
  id bigint generated always as identity primary key,
  patient_name text not null,
  patient_email text not null,
  phone text,
  disease text,
  status text default 'Pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- wardboytasks table
create table if not exists public.wardboytasks (
  id bigint generated always as identity primary key,
  wardboy_id bigint,
  wardboy_name text,
  description text,
  status text default 'Pending',
  assigned_by_role text,
  assigned_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- departments table
create table if not exists public.departments (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz default now()
);

-- wards table
create table if not exists public.wards (
  id bigint generated always as identity primary key,
  wardno text not null,
  depid bigint,
  totalbeds integer not null default 0,
  availablebeds integer not null default 0,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- optional: trigger to keep updated_at in sync
create function public.update_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_timestamp();

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.update_timestamp();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.update_timestamp();

create trigger wardboytasks_updated_at
  before update on public.wardboytasks
  for each row execute function public.update_timestamp();

create trigger wards_updated_at
  before update on public.wards
  for each row execute function public.update_timestamp();

create trigger departments_updated_at
  before update on public.departments
  for each row execute function public.update_timestamp();
