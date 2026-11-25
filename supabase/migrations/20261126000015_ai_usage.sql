-- Per-user daily AI question counter. Atomic increment via RPC only.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai usage own read" on public.ai_usage;
create policy "ai usage own read" on public.ai_usage for select to authenticated
  using (user_id = auth.uid());

create or replace function public.ai_usage_increment(p_limit integer)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare used integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select count into used from public.ai_usage
  where user_id = auth.uid() and day = current_date
  for update;
  if not found then
    insert into public.ai_usage (user_id, day, count)
    values (auth.uid(), current_date, 1);
    return 1;
  end if;
  if used >= p_limit then return -1; end if;
  update public.ai_usage set count = used + 1
  where user_id = auth.uid() and day = current_date;
  return used + 1;
end;
$$;

revoke all on function public.ai_usage_increment(integer) from public, anon;
grant execute on function public.ai_usage_increment(integer) to authenticated;
