-- The buyer is the signed-in user; let the DB set it so RLS WITH CHECK sees it.
alter table public.purchase_requests
  alter column buyer_id set default auth.uid();
