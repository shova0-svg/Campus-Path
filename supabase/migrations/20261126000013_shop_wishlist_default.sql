alter table public.shop_wishlist
  alter column user_id set default auth.uid();
