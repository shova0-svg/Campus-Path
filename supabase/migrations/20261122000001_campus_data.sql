-- Sohoj Rasta — Phase 1: campus data in Supabase with offline-friendly stable ids.
-- Read tables are public (anon SELECT) so a cached/pre-login app can still read.
-- Writes are enforced by RLS using SECURITY DEFINER helpers (no recursive policies).

create extension if not exists pgcrypto;

-- ---------- shared helpers ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- tables ----------
create table if not exists public.institutes (
  id text primary key,
  name text not null,
  division text not null default '',
  is_government boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildings (
  id text primary key,
  institute_id text not null references public.institutes(id) on delete cascade,
  name text not null,
  look text not null default '',
  style text not null default '',
  is_academic boolean not null default false,
  distances jsonb not null default '{}'::jsonb,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists buildings_institute_idx on public.buildings(institute_id);

create table if not exists public.rooms (
  id text primary key,
  institute_id text not null references public.institutes(id) on delete cascade,
  building_id text not null references public.buildings(id) on delete cascade,
  room_no text not null default '',
  name text not null,
  type text not null default 'classroom' check (type in ('classroom','lab','office','facility')),
  floor integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rooms_institute_idx on public.rooms(institute_id);
create index if not exists rooms_building_idx on public.rooms(building_id);

create table if not exists public.routines (
  id text primary key,
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null default '',
  semester integer not null default 1,
  "group" text not null default '',
  shift text not null default 'Morning',
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists routines_institute_idx on public.routines(institute_id);

create table if not exists public.teachers (
  id text primary key,
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null default '',
  name text not null,
  designation text not null default '',
  phone text not null default '',
  email text not null default '',
  photo_url text not null default '',
  room_no text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teachers_institute_idx on public.teachers(institute_id);
create index if not exists teachers_department_idx on public.teachers(institute_id, department);

create table if not exists public.institute_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null default '',
  institute_id text references public.institutes(id) on delete cascade,
  role text not null check (role in ('super_admin','institute_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null default '',
  semester integer not null default 1,
  "group" text not null default '',
  shift text not null default 'Morning',
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
drop trigger if exists trg_institutes_updated on public.institutes;
create trigger trg_institutes_updated before update on public.institutes
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_buildings_updated on public.buildings;
create trigger trg_buildings_updated before update on public.buildings
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_rooms_updated on public.rooms;
create trigger trg_rooms_updated before update on public.rooms
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_routines_updated on public.routines;
create trigger trg_routines_updated before update on public.routines
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_teachers_updated on public.teachers;
create trigger trg_teachers_updated before update on public.teachers
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_admins_updated on public.institute_admins;
create trigger trg_admins_updated before update on public.institute_admins
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_student_updated on public.student_profiles;
create trigger trg_student_updated before update on public.student_profiles
  for each row execute function public.touch_updated_at();

-- ---------- SECURITY DEFINER role helpers (avoid recursive RLS) ----------
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from public.institute_admins ia
    where ia.user_id = auth.uid() and ia.role = 'super_admin'
  );
$$;

create or replace function public.is_institute_admin(_institute_id text)
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select public.is_super_admin() or exists (
    select 1 from public.institute_admins ia
    where ia.user_id = auth.uid()
      and ia.role = 'institute_admin'
      and (ia.institute_id = _institute_id or ia.institute_id is null)
  );
$$;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_institute_admin(text) from public;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_institute_admin(text) to anon, authenticated;

-- ---------- max 5 institute admins trigger ----------
create or replace function public.enforce_admin_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if new.role = 'institute_admin' and new.institute_id is not null then
    select count(*) into n
    from public.institute_admins
    where role = 'institute_admin' and institute_id = new.institute_id
      and (tg_op <> 'UPDATE' or id <> new.id);
    if n >= 5 then
      raise exception 'Per institute max 5 admins allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_limit on public.institute_admins;
create trigger trg_admin_limit before insert or update on public.institute_admins
  for each row execute function public.enforce_admin_limit();

-- ---------- RLS ----------
alter table public.institutes enable row level security;
alter table public.buildings enable row level security;
alter table public.rooms enable row level security;
alter table public.routines enable row level security;
alter table public.teachers enable row level security;
alter table public.institute_admins enable row level security;
alter table public.student_profiles enable row level security;

-- read: public
drop policy if exists "institutes read" on public.institutes;
create policy "institutes read" on public.institutes for select to anon, authenticated using (true);
drop policy if exists "institutes write" on public.institutes;
create policy "institutes write" on public.institutes for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "buildings read" on public.buildings;
create policy "buildings read" on public.buildings for select to anon, authenticated using (true);
drop policy if exists "buildings write" on public.buildings;
create policy "buildings write" on public.buildings for all to authenticated
  using (public.is_institute_admin(institute_id)) with check (public.is_institute_admin(institute_id));

drop policy if exists "rooms read" on public.rooms;
create policy "rooms read" on public.rooms for select to anon, authenticated using (true);
drop policy if exists "rooms write" on public.rooms;
create policy "rooms write" on public.rooms for all to authenticated
  using (public.is_institute_admin(institute_id)) with check (public.is_institute_admin(institute_id));

drop policy if exists "routines read" on public.routines;
create policy "routines read" on public.routines for select to anon, authenticated using (true);
drop policy if exists "routines write" on public.routines;
create policy "routines write" on public.routines for all to authenticated
  using (public.is_institute_admin(institute_id)) with check (public.is_institute_admin(institute_id));

drop policy if exists "teachers read" on public.teachers;
create policy "teachers read" on public.teachers for select to anon, authenticated using (true);
drop policy if exists "teachers write" on public.teachers;
create policy "teachers write" on public.teachers for all to authenticated
  using (public.is_institute_admin(institute_id)) with check (public.is_institute_admin(institute_id));

-- admins: own row read, super admin full write
drop policy if exists "admins read own" on public.institute_admins;
create policy "admins read own" on public.institute_admins for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "admins write super" on public.institute_admins;
create policy "admins write super" on public.institute_admins for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- student profiles: own row only
drop policy if exists "student own select" on public.student_profiles;
create policy "student own select" on public.student_profiles for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "student own insert" on public.student_profiles;
create policy "student own insert" on public.student_profiles for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "student own update" on public.student_profiles;
create policy "student own update" on public.student_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- super-admin RPC to add an institute admin by email ----------
create or replace function public.add_institute_admin_by_email(p_email text, p_institute_id text)
returns void language plpgsql security definer set search_path = public, auth
as $$
declare target uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Not allowed';
  end if;
  select id into target from auth.users where lower(email) = lower(p_email);
  if target is null then
    raise exception 'No user with that email';
  end if;
  insert into public.institute_admins (user_id, email, institute_id, role)
  values (target, lower(p_email), p_institute_id, 'institute_admin')
  on conflict (user_id) do nothing;
end;
$$;
revoke all on function public.add_institute_admin_by_email(text, text) from public;
grant execute on function public.add_institute_admin_by_email(text, text) to authenticated;

-- ---------- idempotent super admin seed ----------
insert into public.institute_admins (user_id, email, institute_id, role)
select id, lower(email), null, 'super_admin'
from auth.users
where lower(email) = 'shovaslks@gmail.com'
on conflict (user_id) do nothing;
