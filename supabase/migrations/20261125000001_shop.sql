-- Campus Shop: student-to-student marketplace. Payment is offline; no in-app payments.
-- All access rules are enforced here in the database; the client only hides UI.

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  institute_id text not null references public.institutes(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null check (category in (
    'old_books', 'drawing_tools', 'engineering_instruments', 'electronics', 'others'
  )),
  item_condition text not null check (item_condition in ('new', 'like_new', 'used', 'old')),
  price numeric(10, 2) not null check (price >= 0 and price <= 10000000),
  is_negotiable boolean not null default false,
  -- Storage object paths in the private-owner / public-read 'shop-images' bucket.
  images text[] not null default '{}' check (cardinality(images) between 1 and 4),
  contact_phone text not null check (contact_phone ~ '^[0-9+() -]{6,20}$'),
  contact_whatsapp text check (
    contact_whatsapp is null or contact_whatsapp ~ '^[0-9+() -]{6,20}$'
  ),
  department text,
  semester integer check (semester between 1 and 6),
  status text not null default 'available' check (
    status in ('available', 'reserved', 'sold', 'removed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default now(),
  unique (product_id, reporter_id) -- one report per user per product
);

create table if not exists public.shop_bans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institute_id text references public.institutes(id) on delete cascade,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shop_products_feed_idx
  on public.shop_products(institute_id, status, created_at desc);
create index if not exists shop_products_seller_idx
  on public.shop_products(seller_id, status);
create index if not exists shop_reports_product_idx
  on public.shop_reports(product_id, created_at desc);

alter table public.shop_products enable row level security;
alter table public.shop_reports enable row level security;
alter table public.shop_bans enable row level security;

-- A user is scoped to their student-profile institute. Users without a profile may
-- post to the selected institute so the app works before profile setup.
create or replace function public.shop_institute_ok(_institute text)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.student_profiles sp
    where sp.user_id = auth.uid() and sp.institute_id = _institute
  ) or not exists (
    select 1 from public.student_profiles sp where sp.user_id = auth.uid()
  );
$$;

revoke all on function public.shop_institute_ok(text) from public, anon;
grant execute on function public.shop_institute_ok(text) to authenticated;

-- Sold/removed items are hidden from buyers; the seller and admins still see them.
drop policy if exists "shop products read" on public.shop_products;
create policy "shop products read" on public.shop_products for select to authenticated
  using (
    status in ('available', 'reserved')
    or seller_id = auth.uid()
    or public.is_institute_admin(institute_id)
  );

-- Only a non-banned signed-in user can list an item for their own institute.
drop policy if exists "shop products insert" on public.shop_products;
create policy "shop products insert" on public.shop_products for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.shop_institute_ok(institute_id)
    and not exists (select 1 from public.shop_bans b where b.user_id = auth.uid())
  );

-- Sellers manage only their own rows; admins may moderate any row in their institute.
drop policy if exists "shop products update" on public.shop_products;
create policy "shop products update" on public.shop_products for update to authenticated
  using (
    seller_id = auth.uid()
    or public.is_institute_admin(institute_id)
  )
  with check (
    seller_id = auth.uid()
    or public.is_institute_admin(institute_id)
  );

drop policy if exists "shop products delete" on public.shop_products;
create policy "shop products delete" on public.shop_products for delete to authenticated
  using (
    seller_id = auth.uid()
    or public.is_super_admin()
  );

-- Reports: author sees their own; admins moderate. One report per product per user.
drop policy if exists "shop reports read" on public.shop_reports;
create policy "shop reports read" on public.shop_reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.shop_products p
      where p.id = product_id and public.is_institute_admin(p.institute_id)
    )
  );
drop policy if exists "shop reports insert" on public.shop_reports;
create policy "shop reports insert" on public.shop_reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.shop_products p
      where p.id = product_id
        and p.seller_id <> auth.uid()
        and p.status in ('available', 'reserved')
    )
  );
drop policy if exists "shop reports delete" on public.shop_reports;
create policy "shop reports delete" on public.shop_reports for delete to authenticated
  using (
    exists (
      select 1 from public.shop_products p
      where p.id = product_id and public.is_institute_admin(p.institute_id)
    )
  );

-- Bans are admin-only and never readable by students.
drop policy if exists "shop bans admin all" on public.shop_bans;
create policy "shop bans admin all" on public.shop_bans for all to authenticated
  using (
    public.is_super_admin()
    or public.is_institute_admin(institute_id)
  )
  with check (
    public.is_super_admin()
    or public.is_institute_admin(institute_id)
  );

-- Guard identity fields, stamp updated_at, and cap active listings at 10 per seller.
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
      select count(*) into active_count from public.shop_products
      where seller_id = new.seller_id and status in ('available', 'reserved');
      if active_count >= 10 then
        raise exception 'Max 10 active listings per user';
      end if;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shop_product_guard on public.shop_products;
create trigger trg_shop_product_guard before insert or update on public.shop_products
  for each row execute function public.shop_product_guard();

-- Private image bucket: only the seller may upload/delete their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-images', 'shop-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "shop images insert" on storage.objects;
create policy "shop images insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "shop images delete" on storage.objects;
create policy "shop images delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'shop-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_super_admin()
    )
  );
