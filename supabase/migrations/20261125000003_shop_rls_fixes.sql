-- RLS verification fixes: banned-user check must bypass RLS, reports need an
-- auth.uid() default, and image cleanup must satisfy Supabase's storage delete guard.

-- A policy subquery on shop_bans is itself filtered by RLS (students cannot read bans),
-- so the check must run as a SECURITY DEFINER helper.
create or replace function public.shop_is_banned()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.shop_bans b where b.user_id = auth.uid());
$$;

revoke all on function public.shop_is_banned() from public, anon;
grant execute on function public.shop_is_banned() to authenticated;

drop policy if exists "shop products insert" on public.shop_products;
create policy "shop products insert" on public.shop_products for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.shop_institute_ok(institute_id)
    and not public.shop_is_banned()
  );

alter table public.shop_reports
  alter column reporter_id set default auth.uid();

-- Supabase installs a protect_delete trigger on storage tables; allow this
-- security-definer cleanup function to delete only within the current transaction.
create or replace function public.shop_cleanup_images()
returns trigger language plpgsql security definer set search_path = public, storage as $$
begin
  if old.images is not null and cardinality(old.images) > 0 then
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
    where bucket_id = 'shop-images'
      and name = any(old.images);
  end if;
  return old;
end;
$$;

revoke all on function public.shop_cleanup_images() from public, anon;
