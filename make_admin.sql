-- CareSphere primary admin repair script
-- This keeps Sehar <seharmeharnsj@gmail.com> as the only active admin profile.
-- Run this after the Supabase Auth account exists for the same email.

update public.users
set role = 'patient',
    updated_at = now()
where role = 'admin'
  and lower(email) <> 'seharmeharnsj@gmail.com'
  and coalesce(status, 'Active') <> 'Removed';

-- Remove any stale placeholder row for this email that points to the wrong auth user.
delete from public.users
where lower(email) = 'seharmeharnsj@gmail.com'
  and auth_user_id is not null
  and auth_user_id <> (
    select id
    from auth.users
    where lower(email) = 'seharmeharnsj@gmail.com'
    limit 1
  );

-- If a disabled/removed row is linked to Sehar's auth account, restore that exact row.
update public.users as existing_user
set email = 'seharmeharnsj@gmail.com',
    name = 'Sehar',
    role = 'admin',
    status = 'Active',
    auth_status = case
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at, auth_account.last_sign_in_at) is not null then 'active'
      else 'pending_confirmation'
    end,
    confirmation_sent_at = case
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at) is null
        then coalesce(existing_user.confirmation_sent_at, now())
      else existing_user.confirmation_sent_at
    end,
    confirmed_at = coalesce(
      auth_account.email_confirmed_at,
      auth_account.confirmed_at,
      existing_user.confirmed_at
    ),
    last_login = coalesce(auth_account.last_sign_in_at, existing_user.last_login),
    removed_at = null,
    updated_at = now()
from auth.users as auth_account
where lower(auth_account.email) = 'seharmeharnsj@gmail.com'
  and existing_user.auth_user_id = auth_account.id;

-- If an email row exists but is not linked yet, link and restore it.
update public.users as existing_user
set auth_user_id = auth_account.id,
    email = 'seharmeharnsj@gmail.com',
    name = 'Sehar',
    role = 'admin',
    status = 'Active',
    auth_status = case
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at, auth_account.last_sign_in_at) is not null then 'active'
      else 'pending_confirmation'
    end,
    confirmation_sent_at = case
      when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at) is null
        then coalesce(existing_user.confirmation_sent_at, now())
      else existing_user.confirmation_sent_at
    end,
    confirmed_at = coalesce(
      auth_account.email_confirmed_at,
      auth_account.confirmed_at,
      existing_user.confirmed_at
    ),
    last_login = coalesce(auth_account.last_sign_in_at, existing_user.last_login),
    removed_at = null,
    updated_at = now()
from auth.users as auth_account
where lower(auth_account.email) = 'seharmeharnsj@gmail.com'
  and lower(existing_user.email) = 'seharmeharnsj@gmail.com';

-- Create the admin row if it still does not exist.
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
select
  auth_account.id,
  'seharmeharnsj@gmail.com',
  'Sehar',
  'admin',
  'Active',
  case
    when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at, auth_account.last_sign_in_at) is not null then 'active'
    else 'pending_confirmation'
  end,
  case
    when coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at) is null then now()
    else null
  end,
  coalesce(auth_account.email_confirmed_at, auth_account.confirmed_at),
  auth_account.last_sign_in_at,
  null::timestamptz
from auth.users as auth_account
where lower(auth_account.email) = 'seharmeharnsj@gmail.com'
  and not exists (
    select 1
    from public.users as existing_user
    where existing_user.auth_user_id = auth_account.id
       or lower(existing_user.email) = 'seharmeharnsj@gmail.com'
  );

-- Last safety pass: Sehar must be active and not removed.
update public.users
set name = 'Sehar',
    role = 'admin',
    status = 'Active',
    auth_status = case
      when confirmed_at is not null or last_login is not null then 'active'
      else coalesce(auth_status, 'pending_confirmation')
    end,
    removed_at = null,
    updated_at = now()
where lower(email) = 'seharmeharnsj@gmail.com'
   or auth_user_id = (
     select id
     from auth.users
     where lower(email) = 'seharmeharnsj@gmail.com'
     limit 1
   );

select id, auth_user_id, name, email, role, status, auth_status, removed_at
from public.users
where lower(email) = 'seharmeharnsj@gmail.com'
   or auth_user_id = (
     select id
     from auth.users
     where lower(email) = 'seharmeharnsj@gmail.com'
     limit 1
   );
