-- Sohoj Rasta — Phase 3: Web Push subscriptions, dedupe log and cron schedule.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  user_agent text not null default ''
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  class_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, class_key)
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_log enable row level security;

drop policy if exists "push own select" on public.push_subscriptions;
create policy "push own select" on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "push own insert" on public.push_subscriptions;
create policy "push own insert" on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "push own delete" on public.push_subscriptions;
create policy "push own delete" on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "notif log own select" on public.notification_log;
create policy "notif log own select" on public.notification_log for select to authenticated
  using (user_id = auth.uid());
-- inserts are made by the service-role Edge Function only (no policy needed).

-- ---------- pg_cron: call the reminder Edge Function every 5 minutes ----------
-- Requires extensions pg_cron + pg_net (Lovable Cloud enables pg_cron on request).
-- Replace the project ref placeholder via Lovable editor if needed.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not enabled — schedule manually in Lovable Cloud';
    return;
  end if;
  perform cron.unschedule('sohoj-class-reminders') where exists (
    select 1 from cron.job where jobname = 'sohoj-class-reminders'
  );
  perform cron.schedule(
    'sohoj-class-reminders',
    '*/5 * * * *',
    $cron$select net.http_post(
      url := current_setting('app.settings.functions_url') || '/send-class-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    )$cron$
  );
end $$;
