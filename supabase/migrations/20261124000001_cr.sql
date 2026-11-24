-- Class Representatives (CR) and class-only updates.
-- All access rules are enforced here in the database; the client only hides UI.

create table if not exists public.class_representatives (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and char_length(email) <= 254),
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null,
  semester integer not null check (semester between 1 and 6),
  shift integer not null default 1 check (shift in (1, 2)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (email, institute_id, department, semester, shift)
);

create table if not exists public.class_updates (
  id uuid primary key default gen_random_uuid(),
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null,
  semester integer not null,
  shift integer not null,
  type text not null check (type in ('class_off','class_test','exam','assignment','teacher_notice','room_change','general')),
  subject_code text,
  event_date date,
  event_time time,
  title text not null check (char_length(title) between 1 and 100),
  body text check (body is null or char_length(body) <= 1000),
  urgent boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  deleted_at timestamptz
);

create index if not exists class_updates_class_idx
  on public.class_updates(institute_id, department, semester, shift, created_at desc);

alter table public.class_representatives enable row level security;
alter table public.class_updates enable row level security;

-- CR identity helpers. Only verified emails can ever be used as a CR identity.
create or replace function public.current_verified_email()
returns text language sql stable security definer set search_path = public, auth as $$
  select lower(email) from auth.users
  where id = auth.uid() and email_confirmed_at is not null
  limit 1;
$$;

create or replace function public.is_cr_of(
  _institute text, _department text, _semester integer, _shift integer
) returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.class_representatives
    where email = public.current_verified_email()
      and institute_id = _institute and department = _department
      and semester = _semester and shift = _shift
  );
$$;

-- student_profiles.shift is text ('Morning'/'Evening'); map it to 1/2.
create or replace function public.is_student_of(
  _institute text, _department text, _semester integer, _shift integer
) returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.student_profiles
    where user_id = auth.uid()
      and institute_id = _institute and department = _department and semester = _semester
      and (
        (_shift = 1 and lower(trim(shift)) in ('1','1st','first','morning'))
        or (_shift = 2 and lower(trim(shift)) in ('2','2nd','second','evening'))
      )
  );
$$;

create or replace function public.my_cr_assignments()
returns table (
  id uuid, email text, institute_id text, department text,
  semester integer, shift integer, created_at timestamptz
) language sql stable security definer set search_path = public, auth as $$
  select id, email, institute_id, department, semester, shift, created_at
  from public.class_representatives
  where email = public.current_verified_email();
$$;

revoke all on function public.current_verified_email() from public, anon;
revoke all on function public.is_cr_of(text, text, integer, integer) from public, anon;
revoke all on function public.is_student_of(text, text, integer, integer) from public, anon;
revoke all on function public.my_cr_assignments() from public, anon;
grant execute on function public.current_verified_email() to authenticated;
grant execute on function public.is_cr_of(text, text, integer, integer) to authenticated;
grant execute on function public.is_student_of(text, text, integer, integer) to authenticated;
grant execute on function public.my_cr_assignments() to authenticated;

-- Only super admins may manage the CR list; students never read CR emails.
drop policy if exists "cr super select" on public.class_representatives;
create policy "cr super select" on public.class_representatives for select to authenticated
  using (public.is_super_admin());
drop policy if exists "cr super insert" on public.class_representatives;
create policy "cr super insert" on public.class_representatives for insert to authenticated
  with check (public.is_super_admin());
drop policy if exists "cr super update" on public.class_representatives;
create policy "cr super update" on public.class_representatives for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "cr super delete" on public.class_representatives;
create policy "cr super delete" on public.class_representatives for delete to authenticated
  using (public.is_super_admin());

-- Updates are visible only to that class's CR, students and institute admins.
drop policy if exists "class updates read" on public.class_updates;
create policy "class updates read" on public.class_updates for select to authenticated
  using (
    deleted_at is null and (
      public.is_cr_of(institute_id, department, semester, shift)
      or public.is_student_of(institute_id, department, semester, shift)
      or public.is_institute_admin(institute_id)
      or public.is_super_admin()
    )
  );
-- A CR can post only for a class they were assigned to, as themselves.
drop policy if exists "class updates cr insert" on public.class_updates;
create policy "class updates cr insert" on public.class_updates for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_cr_of(institute_id, department, semester, shift)
  );
-- CR edits stay in their class; admins may moderate (soft delete).
drop policy if exists "class updates cr update" on public.class_updates;
create policy "class updates cr update" on public.class_updates for update to authenticated
  using (
    public.is_cr_of(institute_id, department, semester, shift)
    or public.is_institute_admin(institute_id)
    or public.is_super_admin()
  )
  with check (
    public.is_cr_of(institute_id, department, semester, shift)
    or public.is_institute_admin(institute_id)
    or public.is_super_admin()
  );
-- Hard delete: super admin only (everyone else soft-deletes via deleted_at).
drop policy if exists "class updates super delete" on public.class_updates;
create policy "class updates super delete" on public.class_updates for delete to authenticated
  using (public.is_super_admin());

-- At most two CRs per class.
create or replace function public.enforce_cr_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  select count(*) into n from public.class_representatives
  where institute_id = new.institute_id and department = new.department
    and semester = new.semester and shift = new.shift
    and id <> new.id;
  if n >= 2 then
    raise exception 'Max 2 CRs per class allowed';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_cr_limit on public.class_representatives;
create trigger trg_cr_limit before insert or update on public.class_representatives
  for each row execute function public.enforce_cr_limit();

-- Default expiry: end of event_date + 1 day (Dhaka), else 7 days from creation.
create or replace function public.set_class_update_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.expires_at is null then
    if new.event_date is not null then
      new.expires_at := ((new.event_date + 1)::timestamp + time '23:59:59') at time zone 'Asia/Dhaka';
    else
      new.expires_at := now() + interval '7 days';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_class_update_defaults on public.class_updates;
create trigger trg_class_update_defaults before insert on public.class_updates
  for each row execute function public.set_class_update_defaults();

-- CR posts are rate limited and cannot rewrite the class identity or author.
create or replace function public.guard_class_update_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.institute_id <> old.institute_id or new.department <> old.department
      or new.semester <> old.semester or new.shift <> old.shift
      or new.created_by <> old.created_by or new.created_at <> old.created_at then
      raise exception 'Class identity and author cannot be changed';
    end if;
    new.updated_at := now();
  else
    if (select count(*) from public.class_updates
        where created_by = new.created_by
          and created_at >= ((now() at time zone 'Asia/Dhaka')::date::timestamp at time zone 'Asia/Dhaka')) >= 40 then
      raise exception 'Daily post limit reached (40)';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_class_update_guard on public.class_updates;
create trigger trg_class_update_guard before insert or update on public.class_updates
  for each row execute function public.guard_class_update_update();
