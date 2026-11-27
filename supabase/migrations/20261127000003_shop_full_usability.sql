-- Additive shop hardening: DB is the security boundary; client checks are UX only.
-- Keeps existing column names, adds the requested fields, normalizes legacy values.

alter table public.shop_products
  add column if not exists price_bdt integer,
  add column if not exists sold_at timestamptz;

update public.shop_products set status = 'active' where status = 'available';
update public.shop_products set status = 'hidden' where status = 'removed';
update public.shop_products set item_condition = 'used' where item_condition = 'old';
update public.shop_products set price_bdt = round(price)::integer where price_bdt is null;

alter table public.shop_products drop constraint if exists shop_products_status_check;
alter table public.shop_products add constraint shop_products_status_check
  check (status in ('active', 'reserved', 'sold', 'hidden'));

alter table public.shop_products drop constraint if exists shop_products_item_condition_check;
alter table public.shop_products add constraint shop_products_item_condition_check
  check (item_condition in ('new', 'like_new', 'used'));

alter table public.shop_products drop constraint if exists shop_products_images_check;
alter table public.shop_products add constraint shop_products_images_check
  check (cardinality(images) between 1 and 5);

alter table public.shop_products drop constraint if exists shop_products_title_check;
alter table public.shop_products add constraint shop_products_title_check
  check (char_length(title) between 1 and 100);

alter table public.shop_products drop constraint if exists shop_products_price_bdt_check;
alter table public.shop_products add constraint shop_products_price_bdt_check
  check (price_bdt >= 0);

-- Seller profile phone format (BD mobile), nullable WhatsApp.
alter table public.shop_profiles drop constraint if exists shop_profiles_phone_check;
alter table public.shop_profiles add constraint shop_profiles_phone_check
  check (phone ~ '^(01[3-9][0-9]{8}|\+?8801[3-9][0-9]{8})$');
alter table public.shop_profiles drop constraint if exists shop_profiles_whatsapp_check;
alter table public.shop_profiles add constraint shop_profiles_whatsapp_check
  check (whatsapp is null or whatsapp ~ '^(01[3-9][0-9]{8}|\+?8801[3-9][0-9]{8})$');

-- price_bdt is a mirror of price for a stable integer BDT field.
create or replace function public.shop_price_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.price_bdt := round(new.price)::integer;
  return new;
end;
$$;
drop trigger if exists trg_shop_price_sync on public.shop_products;
create trigger trg_shop_price_sync before insert or update of price on public.shop_products
  for each row execute function public.shop_price_sync();

-- Quantity 0 -> Sold; sold_at maintained; relisting requires stock.
create or replace function public.shop_product_stock_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status = 'sold' and new.status = 'active' and new.quantity = 0 then
    raise exception 'Quantity must be greater than 0 to relist';
  end if;
  if new.quantity = 0 and new.status in ('active', 'reserved') then
    new.status := 'sold';
  end if;
  if new.status = 'sold' and (tg_op = 'INSERT' or old.status <> 'sold') then
    new.sold_at := coalesce(new.sold_at, now());
  elsif new.status <> 'sold' then
    new.sold_at := null;
  end if;
  return new;
end;
$$;

-- Guard: seller/institute/created_at immutable, 30 active listings, 10 new/day, updated_at.
create or replace function public.shop_product_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare active_count integer; daily_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.seller_id <> old.seller_id
      or new.institute_id <> old.institute_id
      or new.created_at <> old.created_at then
      raise exception 'Seller, institute and created_at cannot be changed';
    end if;
  end if;

  if tg_op = 'INSERT' then
    select count(*) into daily_count from public.shop_products
    where seller_id = new.seller_id and created_at >= date_trunc('day', now());
    if daily_count >= 10 then
      raise exception 'Max 10 new listings per day';
    end if;
  end if;

  if new.status in ('active', 'reserved') then
    if tg_op = 'INSERT' or old.status not in ('active', 'reserved') then
      perform pg_advisory_xact_lock(hashtextextended('shop_listing:' || new.seller_id, 0));
      select count(*) into active_count from public.shop_products
      where seller_id = new.seller_id and status in ('active', 'reserved') and id <> new.id;
      if active_count >= 30 then
        raise exception 'Max 30 active listings per user';
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.views <> old.views
    and new.title = old.title and new.description = old.description
    and new.price = old.price and new.status = old.status
    and new.images = old.images and new.quantity = old.quantity then
    return new; -- view-only: do not touch updated_at
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Public/owner read: legacy 'available'/'removed' no longer stored.
drop policy if exists "shop products read" on public.shop_products;
create policy "shop products read" on public.shop_products for select to authenticated
  using (
    status in ('active', 'reserved', 'sold')
    or seller_id = auth.uid()
    or public.is_institute_admin(institute_id)
  );

-- No anon table access; authenticated keeps the needed CRUD grants.
revoke all on table public.shop_profiles, public.shop_products, public.shop_reports,
  public.shop_wishlist, public.shop_bans from anon;
grant select, insert, update on public.shop_profiles to authenticated;
grant select, insert, update, delete on public.shop_products to authenticated;
grant select on public.shop_reports to authenticated;
grant select, insert, delete on public.shop_wishlist to authenticated;

notify pgrst, 'reload schema';
