-- Class reminders: run the Edge Function every minute.
-- Requires Edge Function secrets CRON_SECRET (shared auth) and CRON_DB_KEY (valid service-role key),
-- plus a Vault secret named campus_path_cron_key containing the same CRON_SECRET value.
-- Create it in the Supabase dashboard (Vault) or with:
--   select vault.create_secret('<service-role key>', 'campus_path_cron_key', 'Campus Path reminder cron');
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('campus-path-class-reminders')
  where exists (select 1 from cron.job where jobname = 'campus-path-class-reminders');

select cron.schedule(
  'campus-path-class-reminders',
  '* * * * *',
  $$select net.http_post(
    url := 'https://trdefthkfdnchbgshgvk.supabase.co/functions/v1/send-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campus_path_cron_key')
    ),
    body := '{}'::jsonb
  )$$
);
