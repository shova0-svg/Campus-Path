-- Sync notice sources and push approved notices every 10 minutes.
-- Uses the same Vault secret as the class reminder cron (campus_path_cron_key).
select cron.unschedule('campus-path-notice-sync')
  where exists (select 1 from cron.job where jobname = 'campus-path-notice-sync');

select cron.schedule(
  'campus-path-notice-sync',
  '*/10 * * * *',
  $$select net.http_post(
    url := 'https://trdefthkfdnchbgshgvk.supabase.co/functions/v1/sync-notices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campus_path_cron_key')
    ),
    body := '{}'::jsonb
  )$$
);
