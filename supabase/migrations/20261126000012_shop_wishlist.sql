-- Per-user wishlist. No product schema changes in this phase.
create table if not exists public.shop_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.shop_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.shop_wishlist enable row level security;

drop policy if exists "wishlist own select" on public.shop_wishlist;
create policy "wishlist own select" on public.shop_wishlist for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "wishlist own insert" on public.shop_wishlist;
create policy "wishlist own insert" on public.shop_wishlist for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "wishlist own delete" on public.shop_wishlist;
create policy "wishlist own delete" on public.shop_wishlist for delete to authenticated
  using (user_id = auth.uid());
