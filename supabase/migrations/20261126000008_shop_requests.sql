-- Offline-handover purchase requests + notification inbox. No payments.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.notifications enable row level security;
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read_at, created_at desc);

drop policy if exists "notifications own select" on public.notifications;
create policy "notifications own select" on public.notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.shop_notify(
  _user uuid, _type text, _title text, _body text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _user is null then return; end if;
  insert into public.notifications (user_id, type, title, body)
  values (_user, _type, _title, _body);
end;
$$;
revoke all on function public.shop_notify(uuid, text, text, text) from public, anon;
grant execute on function public.shop_notify(uuid, text, text, text) to authenticated;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 20),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')
  ),
  meeting_note text not null default '' check (char_length(meeting_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists purchase_requests_one_active_idx
  on public.purchase_requests(product_id, buyer_id)
  where status in ('pending', 'accepted');
create index if not exists purchase_requests_seller_idx
  on public.purchase_requests(seller_id, status, created_at desc);
create index if not exists purchase_requests_buyer_idx
  on public.purchase_requests(buyer_id, status, created_at desc);

alter table public.purchase_requests enable row level security;

drop policy if exists "requests read parties" on public.purchase_requests;
create policy "requests read parties" on public.purchase_requests for select to authenticated
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.shop_products p
      where p.id = product_id and public.is_institute_admin(p.institute_id)
    )
  );

drop policy if exists "requests buyer insert" on public.purchase_requests;
create policy "requests buyer insert" on public.purchase_requests for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and not public.shop_is_banned()
  );

drop policy if exists "requests parties update" on public.purchase_requests;
create policy "requests parties update" on public.purchase_requests for update to authenticated
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.shop_products p
      where p.id = product_id and public.is_institute_admin(p.institute_id)
    )
  )
  with check (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.shop_products p
      where p.id = product_id and public.is_institute_admin(p.institute_id)
    )
  );

-- Validate identity, stock, ban and a 5-pending-request rate limit in one transaction.
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
    if new.status <> old.status then
      if public.is_super_admin() or public.is_institute_admin(
        (select institute_id from public.shop_products where id = new.product_id)
      ) then
        null; -- admin moderation
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

drop trigger if exists trg_purchase_request_guard on public.purchase_requests;
create trigger trg_purchase_request_guard before insert or update on public.purchase_requests
  for each row execute function public.purchase_request_guard();

-- Status effects + inbox rows for both parties.
create or replace function public.purchase_request_effects()
returns trigger language plpgsql security definer set search_path = public as $$
declare prod record; title text;
begin
  select * into prod from public.shop_products where id = new.product_id;

  if tg_op = 'INSERT' then
    perform public.shop_notify(new.seller_id, 'PURCHASE_REQUESTED',
      'New purchase request / নতুন কেনা অনুরোধ',
      left(prod.title, 80) || ' — ' || coalesce(nullif(new.message, ''), 'Check request'));
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
    when 'rejected' then 'Request rejected / অনুরোধ বাতিল'
    when 'cancelled' then 'Request cancelled / অনুরোধ বাতিল'
    else 'Order completed / অর্ডার সম্পন্ন'
  end;

  perform public.shop_notify(new.buyer_id, 'REQUEST_' || upper(new.status), title,
    left(prod.title, 80) || ' — meet on campus, pay in person.');
  perform public.shop_notify(new.seller_id, 'REQUEST_' || upper(new.status), title,
    left(prod.title, 80) || ' — meet on campus, pay in person.');
  return new;
end;
$$;

drop trigger if exists trg_purchase_request_effects on public.purchase_requests;
create trigger trg_purchase_request_effects after insert or update on public.purchase_requests
  for each row execute function public.purchase_request_effects();
