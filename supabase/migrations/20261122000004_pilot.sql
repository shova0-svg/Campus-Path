-- Sohoj Rasta — Phase 4: pilot feedback + privacy-friendly usage analytics.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  institute_id text not null references public.institutes(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  category text not null check (category in ('bug','missing_room','wrong_routine','idea')),
  message text not null default '',
  page text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists feedback_institute_idx on public.feedback(institute_id, created_at desc);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  institute_id text not null references public.institutes(id) on delete cascade,
  event text not null check (event in ('app_open','qr_scan','search','journey_view','reminder_enabled')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_institute_idx on public.usage_events(institute_id, created_at desc);

alter table public.feedback enable row level security;
alter table public.usage_events enable row level security;

-- feedback: students insert their own; institute admins read their institute's rows.
drop policy if exists "feedback own insert" on public.feedback;
create policy "feedback own insert" on public.feedback for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "feedback admin read" on public.feedback;
create policy "feedback admin read" on public.feedback for select to authenticated
  using (public.is_institute_admin(institute_id));

-- usage_events: any signed-in user logs an event; institute admins read aggregates.
drop policy if exists "usage own insert" on public.usage_events;
create policy "usage own insert" on public.usage_events for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);
drop policy if exists "usage admin read" on public.usage_events;
create policy "usage admin read" on public.usage_events for select to authenticated
  using (public.is_institute_admin(institute_id));
