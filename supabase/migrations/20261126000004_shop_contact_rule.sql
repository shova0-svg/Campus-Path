-- Phase 1 contact rule: any signed-in user may see a seller's phone (needed to
-- buy offline). Anonymous users have no EXECUTE on this RPC. Later phases can
-- tighten this to buyers with an accepted request.
create or replace function public.shop_seller_contact(_seller uuid)
returns table (phone text, whatsapp text)
language sql stable security definer set search_path = public, auth as $$
  select phone, whatsapp
  from public.shop_profiles
  where user_id = _seller and auth.uid() is not null;
$$;

revoke all on function public.shop_seller_contact(uuid) from public, anon;
grant execute on function public.shop_seller_contact(uuid) to authenticated;
