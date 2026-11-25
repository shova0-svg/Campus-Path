-- Global AI circuit breaker + privacy-friendly per-request log (no message text).
create table if not exists public.ai_global_usage (
  day date primary key default current_date,
  count integer not null default 0 check (count >= 0)
);

create or replace function public.ai_global_increment(p_limit integer)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare used integer;
begin
  if p_limit <= 0 then return 0; end if;
  select count into used from public.ai_global_usage where day = current_date for update;
  if not found then
    insert into public.ai_global_usage (day, count) values (current_date, 1);
    return 1;
  end if;
  if used >= p_limit then return -1; end if;
  update public.ai_global_usage set count = used + 1 where day = current_date;
  return used + 1;
end;
$$;

create table if not exists public.ai_request_log (
  id uuid primary key default gen_random_uuid(),
  day date not null default current_date,
  user_hash text not null,
  mode text not null check (mode in ('campus', 'general', 'mixed')),
  model text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  latency_ms integer not null default 0,
  status integer not null,
  created_at timestamptz not null default now()
);

alter table public.ai_global_usage enable row level security;
alter table public.ai_request_log enable row level security;

create or replace function public.ai_log_request(
  p_user_hash text, p_mode text, p_model text,
  p_tokens_in integer, p_tokens_out integer, p_latency integer, p_status integer
)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.ai_request_log
    (user_hash, mode, model, tokens_in, tokens_out, latency_ms, status)
  values (p_user_hash, p_mode, p_model, p_tokens_in, p_tokens_out, p_latency, p_status);
end;
$$;

revoke all on function public.ai_global_increment(integer) from public, anon;
revoke all on function public.ai_log_request(text, text, text, integer, integer, integer, integer) from public, anon;
grant execute on function public.ai_global_increment(integer) to authenticated;
grant execute on function public.ai_log_request(text, text, text, integer, integer, integer, integer) to authenticated;
