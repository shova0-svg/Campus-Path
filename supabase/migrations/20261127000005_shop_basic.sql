-- Basic shop: any signed-in student can list an item; contact details live on the product.

alter table public.shop_products
  add column if not exists contact_phone text,
  add column if not exists contact_whatsapp text;

-- Backfill legacy rows from the old seller profile, then let the profile become optional.
update public.shop_products p
  set contact_phone = sp.phone,
      contact_whatsapp = sp.whatsapp
  from public.shop_profiles sp
  where sp.user_id = p.seller_id and p.contact_phone is null;

alter table public.shop_products drop constraint if exists shop_products_contact_phone_check;
alter table public.shop_products add constraint shop_products_contact_phone_check
  check (contact_phone is null or contact_phone ~ '^(01[3-9][0-9]{8}|\+?8801[3-9][0-9]{8})$');
alter table public.shop_products drop constraint if exists shop_products_contact_whatsapp_check;
alter table public.shop_products add constraint shop_products_contact_whatsapp_check
  check (contact_whatsapp is null or contact_whatsapp ~ '^(01[3-9][0-9]{8}|\+?8801[3-9][0-9]{8})$');

-- Insert no longer requires a shop_profiles row.
drop policy if exists "shop products insert" on public.shop_products;
create policy "shop products insert" on public.shop_products for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.shop_institute_ok(institute_id)
    and not public.shop_is_banned()
  );

notify pgrst, 'reload schema';
