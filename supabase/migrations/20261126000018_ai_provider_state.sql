-- Provider health/cooldown state. No client writes; logs never store message text or keys.
create table if not exists public.ai_provider_state (
  provider text primary key,
  model text not null default '',
  last_status integer not null default 0,
  last_error text not null default '',
  cooldown_until timestamptz,
  consecutive_failures integer not null default 0,
  disabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_state enable row level security;

create or replace function public.ai_provider_state_get()
returns table (
  provider text, model text, last_status integer, cooldown_until timestamptz,
  consecutive_failures integer, disabled boolean
)
language sql stable security definer set search_path = public, auth as $$
  select provider, model, last_status, cooldown_until, consecutive_failures, disabled
  from public.ai_provider_state where auth.uid() is not null;
$$;

create or replace function public.ai_provider_state_set(
  p_provider text, p_model text, p_status integer, p_error text,
  p_cooldown_seconds integer, p_disabled boolean
)
returns void language plpgsql security definer set search_path = public, auth as $$
declare failures integer;
begin
  if auth.uid() is null then return; end if;
  if p_status between 200 and 299 then
    insert into public.ai_provider_state (provider, model, last_status, last_error, cooldown_until, consecutive_failures, disabled, updated_at)
    values (p_provider, p_model, p_status, '', null, 0, false, now())
    on conflict (provider) do update set
      model = excluded.model, last_status = excluded.last_status, last_error = '',
      cooldown_until = null, consecutive_failures = 0, disabled = false, updated_at = now();
    return;
  end if;
  select consecutive_failures + 1 into failures
  from public.ai_provider_state where provider = p_provider;
  failures := coalesce(failures, 1);
  insert into public.ai_provider_state (provider, model, last_status, last_error, cooldown_until, consecutive_failures, disabled, updated_at)
  values (
    p_provider, p_model, p_status, left(coalesce(p_error, ''), 240),
    case when p_cooldown_seconds > 0 then now() + (p_cooldown_seconds || ' seconds')::interval else null end,
    failures, p_disabled, now()
  )
  on conflict (provider) do update set
    model = excluded.model, last_status = excluded.last_status, last_error = excluded.last_error,
    cooldown_until = excluded.cooldown_until, consecutive_failures = excluded.consecutive_failures,
    disabled = excluded.disabled, updated_at = now();
end;
$$;

revoke all on function public.ai_provider_state_get() from public, anon;
revoke all on function public.ai_provider_state_set(text, text, integer, text, integer, boolean) from public, anon;
grant execute on function public.ai_provider_state_get() to authenticated;
grant execute on function public.ai_provider_state_set(text, text, integer, text, integer, boolean) to authenticated;
