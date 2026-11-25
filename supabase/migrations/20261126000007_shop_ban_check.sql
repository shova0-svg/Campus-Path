-- A policy subquery on shop_bans is itself RLS-filtered, so use the existing
-- SECURITY DEFINER helper for both insert and update.
drop policy if exists "shop products insert" on public.shop_products;
create policy "shop products insert" on public.shop_products for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.shop_institute_ok(institute_id)
    and exists (select 1 from public.shop_profiles sp where sp.user_id = auth.uid())
    and not public.shop_is_banned()
  );

drop policy if exists "shop products update" on public.shop_products;
create policy "shop products update" on public.shop_products for update to authenticated
  using (
    (seller_id = auth.uid() and not public.shop_is_banned())
    or public.is_institute_admin(institute_id)
  )
  with check (
    (seller_id = auth.uid() and not public.shop_is_banned())
    or public.is_institute_admin(institute_id)
  );
