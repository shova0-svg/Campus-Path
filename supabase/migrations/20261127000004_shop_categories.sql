-- Category list and default status for the fully usable shop.
alter table public.shop_products alter column status set default 'active';

update public.shop_products set category = 'books_notes' where category = 'old_books';
update public.shop_products set category = 'components_tools' where category in ('drawing_tools', 'engineering_instruments');
update public.shop_products set category = 'other' where category = 'others';

alter table public.shop_products drop constraint if exists shop_products_category_check;
alter table public.shop_products add constraint shop_products_category_check
  check (category in (
    'books_notes', 'electronics', 'components_tools', 'stationery',
    'clothing', 'hostel', 'food', 'bikes', 'services', 'other'
  ));

notify pgrst, 'reload schema';
