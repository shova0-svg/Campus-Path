-- The sold-counter trigger's update was rejected by the profile guard (the
-- seller is the actor). Mark the internal update so the guard can allow it.

create or replace function public.shop_sold_counter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sold' and old.status <> 'sold' then
    perform set_config('shop.sold_counter', '1', true);
    update public.shop_profiles
    set total_sold = total_sold + 1
    where user_id = new.seller_id;
    perform set_config('shop.sold_counter', '', true);
  end if;
  return new;
end;
$$;

create or replace function public.shop_profile_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not public.is_institute_admin(new.institute_id) then
    if coalesce(current_setting('shop.sold_counter', true), '') <> '1' then
      if new.is_verified <> old.is_verified or new.total_sold <> old.total_sold then
        raise exception 'Only an admin can change verification or sold count';
      end if;
    end if;
    if new.institute_id <> old.institute_id then
      raise exception 'Institute cannot be changed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
