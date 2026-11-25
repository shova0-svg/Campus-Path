-- Seller dashboard: quantity, view count, stock/status automation and view RPC.

alter table public.shop_products
  add column if not exists quantity integer not null default 1 check (quantity >= 0),
  add column if not exists views integer not null default 0 check (views >= 0);

-- Quantity 0 means sold; an explicit relist needs stock.
create or replace function public.shop_product_stock_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
    and old.status = 'sold'
    and new.status = 'available'
    and new.quantity = 0 then
    raise exception 'Quantity must be greater than 0 to relist';
  end if;
  if new.quantity = 0 and new.status in ('available', 'reserved') then
    new.status := 'sold';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_shop_stock_status on public.shop_products;
create trigger trg_shop_stock_status before insert or update on public.shop_products
  for each row execute function public.shop_product_stock_status();

-- Keep the seller's sold counter accurate.
create or replace function public.shop_sold_counter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sold' and old.status <> 'sold' then
    update public.shop_profiles
    set total_sold = total_sold + 1
    where user_id = new.seller_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_shop_sold_counter on public.shop_products;
create trigger trg_shop_sold_counter after update on public.shop_products
  for each row execute function public.shop_sold_counter();

-- View-only updates must not bump updated_at or look like a new listing.
create or replace function public.shop_product_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare active_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.seller_id <> old.seller_id
      or new.institute_id <> old.institute_id
      or new.created_at <> old.created_at then
      raise exception 'Seller, institute and created_at cannot be changed';
    end if;
  end if;

  if new.status in ('available', 'reserved') then
    if tg_op = 'INSERT' or old.status not in ('available', 'reserved') then
      perform pg_advisory_xact_lock(hashtextextended('shop_listing:' || new.seller_id, 0));
      select count(*) into active_count from public.shop_products
      where seller_id = new.seller_id and status in ('available', 'reserved')
        and id <> new.id;
      if active_count >= 10 then
        raise exception 'Max 10 active listings per user';
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE'
    and new.views <> old.views
    and new.title = old.title and new.description = old.description
    and new.price = old.price and new.status = old.status
    and new.images = old.images and new.quantity = old.quantity then
    return new; -- view-only: do not touch updated_at
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Banned sellers cannot edit listings; admins keep moderation rights.
drop policy if exists "shop products update" on public.shop_products;
create policy "shop products update" on public.shop_products for update to authenticated
  using (
    (
      seller_id = auth.uid()
      and not exists (select 1 from public.shop_bans b where b.user_id = auth.uid())
    )
    or public.is_institute_admin(institute_id)
  )
  with check (
    (
      seller_id = auth.uid()
      and not exists (select 1 from public.shop_bans b where b.user_id = auth.uid())
    )
    or public.is_institute_admin(institute_id)
  );

-- Anyone signed in can count a view on a live listing.
create or replace function public.shop_increment_views(p_product uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then return; end if;
  update public.shop_products
  set views = views + 1
  where id = p_product and status in ('available', 'reserved');
end;
$$;

revoke all on function public.shop_increment_views(uuid) from public, anon;
grant execute on function public.shop_increment_views(uuid) to authenticated;
