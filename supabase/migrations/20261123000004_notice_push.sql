-- Marks an approved notice as pushed so the sync function never sends it twice.
alter table public.notices add column if not exists pushed_at timestamptz;
create index if not exists notices_push_idx on public.notices(status, pushed_at);
