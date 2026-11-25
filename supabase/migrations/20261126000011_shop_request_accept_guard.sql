-- Serialize accepts per product: only one accepted request, and stock must cover it.
create or replace function public.purchase_request_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare prod public.shop_products; n integer;
begin
  if tg_op = 'INSERT' then
    select * into prod from public.shop_products where id = new.product_id;
    if not found then raise exception 'Product not found'; end if;
    new.seller_id := prod.seller_id;
    if new.buyer_id = auth.uid() and new.buyer_id = new.seller_id then
      raise exception 'Cannot request your own product';
    end if;
    if prod.status not in ('available', 'reserved') then
      raise exception 'Product is not available';
    end if;
    if new.quantity is null or new.quantity < 1 or new.quantity > prod.quantity then
      raise exception 'Invalid quantity';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('buyer_req:' || auth.uid(), 0));
    select count(*) into n from public.purchase_requests
    where buyer_id = auth.uid() and status = 'pending';
    if n >= 5 then raise exception 'Max 5 pending requests'; end if;
  else
    if new.product_id <> old.product_id or new.buyer_id <> old.buyer_id
      or new.seller_id <> old.seller_id or new.created_at <> old.created_at then
      raise exception 'Request identity cannot be changed';
    end if;

    if new.status = 'accepted' and old.status = 'pending' then
      perform pg_advisory_xact_lock(hashtextextended('request_accept:' || new.product_id, 0));
      if exists (
        select 1 from public.purchase_requests
        where product_id = new.product_id and status = 'accepted' and id <> new.id
      ) then
        raise exception 'Another request is already accepted for this product';
      end if;
      if (select quantity from public.shop_products where id = new.product_id) < new.quantity then
        raise exception 'Not enough stock to accept this request';
      end if;
    end if;

    if new.status <> old.status then
      if public.is_super_admin() or public.is_institute_admin(
        (select institute_id from public.shop_products where id = new.product_id)
      ) then
        null;
      elsif auth.uid() = new.buyer_id then
        if not (old.status = 'pending' and new.status = 'cancelled') then
          raise exception 'Buyer can only cancel a pending request';
        end if;
      elsif auth.uid() = new.seller_id then
        if not (
          (old.status = 'pending' and new.status in ('accepted', 'rejected'))
          or (old.status = 'accepted' and new.status = 'completed')
        ) then
          raise exception 'Invalid seller status change';
        end if;
      else
        raise exception 'Not allowed';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
