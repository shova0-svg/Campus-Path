-- Additive My Shop upgrade. Legacy columns/statuses stay for compatibility.

alter table public.shop_profiles
  add column if not exists show_phone boolean not null default true;

alter table public.shop_products
  add column if not exists pickup_location text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shop_products_pickup_location_check'
  ) then
    alter table public.shop_products
      add constraint shop_products_pickup_location_check
      check (pickup_location is null or char_length(pickup_location) <= 100);
  end if;
end $$;

-- Existing values (available/removed) remain valid; hidden is the new label for removed.
alter table public.shop_products drop constraint if exists shop_products_status_check;
alter table public.shop_products
  add constraint shop_products_status_check
  check (status in ('available', 'active', 'reserved', 'sold', 'removed', 'hidden'));

-- Other signed-in users get the phone only when the seller allows it.
create or replace function public.shop_seller_contact(_seller uuid)
returns table (phone text, whatsapp text)
language sql stable security definer set search_path = public, auth as $$
  select phone, whatsapp
  from public.shop_profiles
  where user_id = _seller
    and auth.uid() is not null
    and (
      show_phone
      or user_id = auth.uid()
      or public.is_institute_admin(institute_id)
    );
$$;

revoke all on function public.shop_seller_contact(uuid) from public, anon;
grant execute on function public.shop_seller_contact(uuid) to authenticated;

-- Shop images: ~2 MB cap, owner folder only, including updates.
update storage.buckets
  set file_size_limit = 2097152
  where id = 'shop-images';

drop policy if exists "shop images update" on storage.objects;
create policy "shop images update" on storage.objects for update to authenticated
  using (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
