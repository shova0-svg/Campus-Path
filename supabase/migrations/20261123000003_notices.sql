-- Campus Path notices: sourced from the institute site, moderated by admins,
-- deduplicated, and pushed to students when approved.

create table if not exists public.notice_sources (
  institute_id text primary key references public.institutes(id) on delete cascade,
  label text not null default '',
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notices (
  id text primary key,
  institute_id text not null references public.institutes(id) on delete cascade,
  title text not null,
  url text not null default '',
  published_date text not null default '',
  image text,
  source_url text not null default '',
  source text not null default 'fetched' check (source in ('fetched', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institute_id, title, published_date)
);

create index if not exists notices_institute_status_idx
  on public.notices(institute_id, status, published_date desc);

alter table public.notice_sources enable row level security;
alter table public.notices enable row level security;

drop trigger if exists trg_notice_sources_updated on public.notice_sources;
create trigger trg_notice_sources_updated before update on public.notice_sources
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_notices_updated on public.notices;
create trigger trg_notices_updated before update on public.notices
  for each row execute function public.touch_updated_at();

-- Public sees approved notices only; institute admins see and manage all.
drop policy if exists "notices read approved" on public.notices;
create policy "notices read approved" on public.notices for select to anon, authenticated
  using (status = 'approved' or public.is_institute_admin(institute_id));
drop policy if exists "notices admin write" on public.notices;
create policy "notices admin write" on public.notices for all to authenticated
  using (public.is_institute_admin(institute_id))
  with check (public.is_institute_admin(institute_id));

drop policy if exists "notice sources admin read" on public.notice_sources;
create policy "notice sources admin read" on public.notice_sources for select to authenticated
  using (public.is_institute_admin(institute_id) or public.is_super_admin());
drop policy if exists "notice sources admin write" on public.notice_sources;
create policy "notice sources admin write" on public.notice_sources for all to authenticated
  using (public.is_super_admin() or public.is_institute_admin(institute_id))
  with check (public.is_super_admin() or public.is_institute_admin(institute_id));
