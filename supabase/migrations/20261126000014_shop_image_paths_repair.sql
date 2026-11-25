-- Normalize any legacy image values that stored a full public URL or a
-- bucket-prefixed path into plain storage paths. Dry run found 0 affected rows.
update public.shop_products
set images = array(
  select regexp_replace(
    regexp_replace(trim(x), '^https?://[^/]+/storage/v1/object/public/shop-images/', ''),
    '^/?shop-images/', ''
  )
  from unnest(images) as x
)
where exists (
  select 1 from unnest(images) x
  where x ~ '^https?://' or x ~ '^/?shop-images/' or x ~ '^/'
);
