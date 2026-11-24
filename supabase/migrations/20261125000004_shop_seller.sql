-- Public display name for a listing's seller, without exposing their email.
create or replace function public.shop_seller_name(_seller uuid)
returns text language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    nullif(trim(p.display_name), ''),
    split_part(u.email, '@', 1),
    'Student'
  )
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = _seller;
$$;

revoke all on function public.shop_seller_name(uuid) from public, anon;
grant execute on function public.shop_seller_name(uuid) to authenticated;
