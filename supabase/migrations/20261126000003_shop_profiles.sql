-- Shop seller profiles: one shared Supabase auth identity, no second login system.

create table if not exists public.shop_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shop_name text not null check (char_length(shop_name) between 2 and 60),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 500),
  phone text not null check (phone ~ '^[0-9+() -]{6,20}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9+() -]{6,20}$'),
  institute_id text not null references public.institutes(id) on delete cascade,
  department text not null default '',
  semester integer check (semester between 1 and 6),
  is_verified boolean not null default false,
  total_sold integer not null default 0 check (total_sold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_profiles enable row level security;

-- Backfill one profile per current seller using their first product's contact data.
insert into public.shop_profiles (
  user_id, shop_name, avatar_url, bio, phone, whatsapp,
  institute_id, department, semester, created_at
)
select
  p.seller_id,
  coalesce(nullif(trim(pr.display_name), ''), split_part(u.email, '@', 1), 'Campus Seller'),
  null,
  '',
  p.contact_phone,
  p.contact_whatsapp,
  p.institute_id,
  coalesce(p.department, ''),
  p.semester,
  p.created_at
from (
  select distinct on (seller_id) *
  from public.shop_products
  order by seller_id, created_at asc
) p
join auth.users u on u.id = p.seller_id
left join public.profiles pr on pr.id = p.seller_id
on conflict (user_id) do nothing;

-- Public fields only — no phone/WhatsApp here.
create or replace function public.shop_public_profile(_seller uuid)
returns table (
  user_id uuid, shop_name text, avatar_url text, bio text,
  institute_id text, department text, semester integer,
  is_verified boolean, total_sold integer
)
language sql stable security definer set search_path = public, auth as $$
  select user_id, shop_name, avatar_url, bio, institute_id, department,
         semester, is_verified, total_sold
  from public.shop_profiles where user_id = _seller;
$$;

-- Contact details stay behind a DB check (extended to buyers in the request phase).
create or replace function public.shop_seller_contact(_seller uuid)
returns table (phone text, whatsapp text)
language sql stable security definer set search_path = public, auth as $$
  select phone, whatsapp
  from public.shop_profiles
  where user_id = _seller
    and (
      user_id = auth.uid()
      or public.is_institute_admin(institute_id)
    );
$$;

revoke all on function public.shop_public_profile(uuid) from public, anon;
revoke all on function public.shop_seller_contact(uuid) from public, anon;
grant execute on function public.shop_public_profile(uuid) to authenticated;
grant execute on function public.shop_seller_contact(uuid) to authenticated;

-- Only the owner edits their profile; admins can verify sellers.
drop policy if exists "shop profile owner select" on public.shop_profiles;
create policy "shop profile owner select" on public.shop_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_institute_admin(institute_id));

drop policy if exists "shop profile insert" on public.shop_profiles;
create policy "shop profile insert" on public.shop_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.shop_institute_ok(institute_id));

drop policy if exists "shop profile update" on public.shop_profiles;
create policy "shop profile update" on public.shop_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_institute_admin(institute_id))
  with check (user_id = auth.uid() or public.is_institute_admin(institute_id));

-- Sellers cannot grant themselves verification or fake sold counts.
create or replace function public.shop_profile_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not public.is_institute_admin(new.institute_id) then
    if new.is_verified <> old.is_verified or new.total_sold <> old.total_sold then
      raise exception 'Only an admin can change verification or sold count';
    end if;
    if new.institute_id <> old.institute_id then
      raise exception 'Institute cannot be changed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shop_profile_guard on public.shop_profiles;
create trigger trg_shop_profile_guard before update on public.shop_profiles
  for each row execute function public.shop_profile_guard();

-- Selling requires a shop profile and no ban.
drop policy if exists "shop products insert" on public.shop_products;
create policy "shop products insert" on public.shop_products for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.shop_institute_ok(institute_id)
    and exists (select 1 from public.shop_profiles sp where sp.user_id = auth.uid())
    and not exists (select 1 from public.shop_bans b where b.user_id = auth.uid())
  );

-- Phone is no longer stored per product: all logged-in sellers were backfilled above.
alter table public.shop_products drop column if exists contact_phone;
alter table public.shop_products drop column if exists contact_whatsapp;
