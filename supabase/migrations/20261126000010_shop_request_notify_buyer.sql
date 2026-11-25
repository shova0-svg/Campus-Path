-- Notify the buyer too when their request is first submitted.
create or replace function public.purchase_request_effects()
returns trigger language plpgsql security definer set search_path = public as $$
declare prod record; title text;
begin
  select * into prod from public.shop_products where id = new.product_id;

  if tg_op = 'INSERT' then
    perform public.shop_notify(new.seller_id, 'PURCHASE_REQUESTED',
      'New purchase request / নতুন কেনা অনুরোধ',
      left(prod.title, 80) || ' — ' || coalesce(nullif(new.message, ''), 'Check request'));
    perform public.shop_notify(new.buyer_id, 'PURCHASE_REQUESTED',
      'Request sent / অনুরোধ পাঠানো হয়েছে',
      left(prod.title, 80) || ' — wait for the seller to respond.');
    return new;
  end if;

  if new.status = old.status then return new; end if;

  if new.status = 'accepted' then
    update public.shop_products set status = 'reserved' where id = new.product_id;
  elsif new.status = 'completed' then
    update public.shop_products
    set status = 'sold',
        quantity = case when quantity >= new.quantity then quantity - new.quantity else 0 end
    where id = new.product_id;
  elsif new.status in ('rejected', 'cancelled')
    and (select status from public.shop_products where id = new.product_id) = 'reserved'
    and not exists (
      select 1 from public.purchase_requests r
      where r.product_id = new.product_id and r.status = 'accepted' and r.id <> new.id
    ) then
    update public.shop_products set status = 'available' where id = new.product_id;
  end if;

  title := case new.status
    when 'accepted' then 'Request accepted / অনুরোধ গৃহীত'
    when 'rejected' then 'Request rejected / প্রত্যাখ্যাত'
    when 'cancelled' then 'Request cancelled / বাতিল'
    else 'Order completed / অর্ডার সম্পন্ন'
  end;

  perform public.shop_notify(new.buyer_id, 'REQUEST_' || upper(new.status), title,
    left(prod.title, 80) || ' — meet on campus, pay in person.');
  perform public.shop_notify(new.seller_id, 'REQUEST_' || upper(new.status), title,
    left(prod.title, 80) || ' — meet on campus, pay in person.');
  return new;
end;
$$;
