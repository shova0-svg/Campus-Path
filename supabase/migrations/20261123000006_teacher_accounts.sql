-- Teacher accounts: an institute admin links a teacher (from the routine notices)
-- to an auth user so that teacher receives reminders for their own classes.
create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institute_id text not null references public.institutes(id) on delete cascade,
  teacher_name text not null,
  directory_id text,
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teacher_profiles_institute_idx
  on public.teacher_profiles(institute_id, reminder_enabled);

alter table public.teacher_profiles enable row level security;

drop trigger if exists trg_teacher_profiles_updated on public.teacher_profiles;
create trigger trg_teacher_profiles_updated before update on public.teacher_profiles
  for each row execute function public.touch_updated_at();

drop policy if exists "teacher profile own select" on public.teacher_profiles;
create policy "teacher profile own select" on public.teacher_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_institute_admin(institute_id) or public.is_super_admin());
drop policy if exists "teacher profile own update" on public.teacher_profiles;
create policy "teacher profile own update" on public.teacher_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "teacher profile admin write" on public.teacher_profiles;
create policy "teacher profile admin write" on public.teacher_profiles for all to authenticated
  using (public.is_institute_admin(institute_id) or public.is_super_admin())
  with check (public.is_institute_admin(institute_id) or public.is_super_admin());
