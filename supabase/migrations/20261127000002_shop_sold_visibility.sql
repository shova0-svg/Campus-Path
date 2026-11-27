-- Sold items stay visible with a badge; hidden/removed items remain owner-only.
drop policy if exists "shop products read" on public.shop_products;
create policy "shop products read" on public.shop_products for select to authenticated
  using (
    status in ('available', 'active', 'reserved', 'sold')
    or seller_id = auth.uid()
    or public.is_institute_admin(institute_id)
  );
