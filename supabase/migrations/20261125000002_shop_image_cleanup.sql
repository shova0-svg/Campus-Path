-- Deleting a listing must also remove its uploaded images from storage.
-- Soft removal (status = 'removed') intentionally keeps the images for moderation.

create or replace function public.shop_cleanup_images()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if old.images is not null and cardinality(old.images) > 0 then
    delete from storage.objects
    where bucket_id = 'shop-images'
      and name = any(old.images);
  end if;
  return old;
end;
$$;

revoke all on function public.shop_cleanup_images() from public, anon;

drop trigger if exists trg_shop_cleanup_images on public.shop_products;
create trigger trg_shop_cleanup_images after delete on public.shop_products
  for each row execute function public.shop_cleanup_images();
