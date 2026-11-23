-- Sohoj Rasta / Campus Path — display-name profile used by the auth provider.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles for select to authenticated
  using (id = auth.uid());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users created before this table existed.
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(coalesce(email, ''), '@', 1))
from auth.users
on conflict (id) do nothing;
