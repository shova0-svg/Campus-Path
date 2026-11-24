-- Super admin / sub admin roles with per-institute scoping and audit trail.
-- The existing institute_admins table stays the single source of truth.

alter table public.institute_admins
  add column if not exists assigned_by uuid references auth.users(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.institute_admins
set assigned_at = coalesce(assigned_at, created_at)
where assigned_at is null;

-- Normalize legacy values without locking anyone out: a global legacy admin
-- becomes super_admin; a scoped legacy admin becomes sub_admin.
update public.institute_admins
set role = 'sub_admin'
where role = 'institute_admin' and institute_id is not null;
update public.institute_admins
set role = 'super_admin', institute_id = null
where role = 'institute_admin' and institute_id is null;

-- Keep at least one super admin (idempotent).
insert into public.institute_admins (user_id, email, institute_id, role, assigned_at)
select id, lower(email), null, 'super_admin', now()
from auth.users
where lower(email) = 'shovaslks@gmail.com'
  and not exists (select 1 from public.institute_admins where role = 'super_admin');

-- Replace the old role CHECK with the two-role model.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.institute_admins'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%role%'
  loop
    execute format('alter table public.institute_admins drop constraint %I', c);
  end loop;
end $$;

alter table public.institute_admins
  add constraint institute_admins_role_check check (role in ('super_admin', 'sub_admin'));

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'SUB_ADMIN_ADDED', 'SUB_ADMIN_REMOVED', 'PRODUCT_REMOVED',
    'USER_BANNED', 'USER_UNBANNED', 'CR_ASSIGNED', 'CR_REMOVED'
  )),
  target_id uuid,
  institute_id text references public.institutes(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_institute_idx
  on public.admin_audit_log(institute_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Audit rows are readable only by super admins; writes happen through triggers.
drop policy if exists "audit super read" on public.admin_audit_log;
create policy "audit super read" on public.admin_audit_log for select to authenticated
  using (public.is_super_admin());

-- Institute admin = super admin anywhere, sub admin only in their own institute.
create or replace function public.is_institute_admin(_institute_id text)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select public.is_super_admin() or exists (
    select 1 from public.institute_admins ia
    where ia.user_id = auth.uid()
      and ia.role in ('sub_admin', 'institute_admin')
      and ia.institute_id = _institute_id
  );
$$;

create or replace function public.write_admin_audit(
  p_action text, p_target uuid, p_institute text
)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.admin_audit_log (actor_id, action, target_id, institute_id)
  values (auth.uid(), p_action, p_target, p_institute);
end;
$$;

revoke all on function public.write_admin_audit(text, uuid, text) from public, anon;
grant execute on function public.write_admin_audit(text, uuid, text) to authenticated;

-- Transaction-level lock makes the 2-slot cap safe under simultaneous requests.
create or replace function public.enforce_sub_admin_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if tg_op = 'INSERT' then
    if new.role in ('sub_admin', 'institute_admin') and new.institute_id is not null then
      perform pg_advisory_xact_lock(hashtextextended('sub_admin:' || new.institute_id, 0));
      select count(*) into n from public.institute_admins
      where role in ('sub_admin', 'institute_admin')
        and institute_id = new.institute_id;
      if n >= 2 then raise exception 'Max 2 sub admins per institute'; end if;
    end if;
  elsif new.role in ('sub_admin', 'institute_admin') and new.institute_id is not null
    and (old.role <> new.role or old.institute_id is distinct from new.institute_id) then
    perform pg_advisory_xact_lock(hashtextextended('sub_admin:' || new.institute_id, 0));
    select count(*) into n from public.institute_admins
    where role in ('sub_admin', 'institute_admin')
      and institute_id = new.institute_id
      and id <> new.id;
    if n >= 2 then raise exception 'Max 2 sub admins per institute'; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sub_admin_limit on public.institute_admins;
create trigger trg_sub_admin_limit before insert or update on public.institute_admins
  for each row execute function public.enforce_sub_admin_limit();

-- Never remove or demote the last super admin.
create or replace function public.guard_last_super_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'super_admin' then
      select count(*) into n from public.institute_admins where role = 'super_admin';
      if n <= 1 then raise exception 'Cannot remove the last super admin'; end if;
    end if;
    return old;
  end if;
  if old.role = 'super_admin' and new.role <> 'super_admin' then
    select count(*) into n from public.institute_admins where role = 'super_admin';
    if n <= 1 then raise exception 'Cannot demote the last super admin'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_last_super_admin on public.institute_admins;
create trigger trg_last_super_admin before update or delete on public.institute_admins
  for each row execute function public.guard_last_super_admin();

-- Every sub-admin add/remove is audited regardless of which path performed it.
create or replace function public.audit_admin_change()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' and new.role in ('sub_admin', 'institute_admin') then
    perform public.write_admin_audit('SUB_ADMIN_ADDED', new.user_id, new.institute_id);
  elsif tg_op = 'DELETE' and old.role in ('sub_admin', 'institute_admin') then
    perform public.write_admin_audit('SUB_ADMIN_REMOVED', old.user_id, old.institute_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_admin_change on public.institute_admins;
create trigger trg_audit_admin_change after insert or delete on public.institute_admins
  for each row execute function public.audit_admin_change();

-- Super-admin-only RPCs. Role is read from the DB on every call, never from claims.
create or replace function public.add_sub_admin(p_email text, p_institute_id text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare target uuid;
begin
  if not public.is_super_admin() then raise exception 'Not allowed'; end if;
  if p_institute_id is null or p_institute_id = '' then raise exception 'Institute required'; end if;
  if not exists (select 1 from public.institutes where id = p_institute_id) then
    raise exception 'Unknown institute';
  end if;
  select id into target from auth.users where lower(email) = lower(trim(p_email));
  if target is null then raise exception 'No user with that email'; end if;
  if not exists (
    select 1 from public.student_profiles sp
    where sp.user_id = target and sp.institute_id = p_institute_id
  ) then
    raise exception 'User does not belong to this institute';
  end if;
  if exists (select 1 from public.institute_admins where user_id = target) then
    raise exception 'User is already an admin';
  end if;
  insert into public.institute_admins (user_id, email, institute_id, role, assigned_by, assigned_at)
  values (target, lower(trim(p_email)), p_institute_id, 'sub_admin', auth.uid(), now());
end;
$$;

create or replace function public.remove_sub_admin(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
declare target public.institute_admins;
begin
  if not public.is_super_admin() then raise exception 'Not allowed'; end if;
  select * into target from public.institute_admins where user_id = p_user_id for update;
  if not found then raise exception 'Admin not found'; end if;
  if target.role <> 'sub_admin' then raise exception 'Only sub admins can be removed here'; end if;
  delete from public.institute_admins where user_id = p_user_id;
end;
$$;

-- Legacy RPC now obeys the same rules.
create or replace function public.add_institute_admin_by_email(p_email text, p_institute_id text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.add_sub_admin(p_email, p_institute_id);
end;
$$;

-- Role lookup for the signed-in user (sub admins cannot SELECT the admin table).
create or replace function public.my_admin_role()
returns table (
  id uuid, user_id uuid, email text, institute_id text, role text,
  assigned_by uuid, assigned_at timestamptz
)
language sql stable security definer set search_path = public, auth as $$
  select id, user_id, email, institute_id, role, assigned_by, assigned_at
  from public.institute_admins where user_id = auth.uid();
$$;

-- Full assignment list for the Manage Admins screen (super admins only).
create or replace function public.list_admin_assignments()
returns table (
  id uuid, user_id uuid, email text, display_name text, institute_id text,
  role text, assigned_by uuid, assigned_at timestamptz
)
language sql stable security definer set search_path = public, auth as $$
  select a.id, a.user_id, a.email, coalesce(p.display_name, '') as display_name,
         a.institute_id, a.role, a.assigned_by, a.assigned_at
  from public.institute_admins a
  left join public.profiles p on p.id = a.user_id
  where public.is_super_admin()
  order by a.institute_id nulls first, a.created_at desc;
$$;

revoke all on function public.add_sub_admin(text, text) from public, anon;
revoke all on function public.remove_sub_admin(uuid) from public, anon;
revoke all on function public.my_admin_role() from public, anon;
revoke all on function public.list_admin_assignments() from public, anon;
grant execute on function public.add_sub_admin(text, text) to authenticated;
grant execute on function public.remove_sub_admin(uuid) to authenticated;
grant execute on function public.my_admin_role() to authenticated;
grant execute on function public.list_admin_assignments() to authenticated;

-- CR assignments: institute admins may manage only their own institute.
drop policy if exists "cr super select" on public.class_representatives;
create policy "cr admin select" on public.class_representatives for select to authenticated
  using (public.is_institute_admin(institute_id));
drop policy if exists "cr super insert" on public.class_representatives;
create policy "cr admin insert" on public.class_representatives for insert to authenticated
  with check (public.is_institute_admin(institute_id));
drop policy if exists "cr super update" on public.class_representatives;
create policy "cr admin update" on public.class_representatives for update to authenticated
  using (public.is_institute_admin(institute_id))
  with check (public.is_institute_admin(institute_id));
drop policy if exists "cr super delete" on public.class_representatives;
create policy "cr admin delete" on public.class_representatives for delete to authenticated
  using (public.is_institute_admin(institute_id));

-- Audits for the moderation actions sub admins will perform.
create or replace function public.audit_shop_moderation()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'UPDATE' and new.status = 'removed' and old.status <> 'removed' then
    perform public.write_admin_audit('PRODUCT_REMOVED', new.id, new.institute_id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_audit_shop_moderation on public.shop_products;
create trigger trg_audit_shop_moderation after update on public.shop_products
  for each row execute function public.audit_shop_moderation();

create or replace function public.audit_shop_ban()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_admin_audit('USER_BANNED', new.user_id, new.institute_id);
    return new;
  end if;
  perform public.write_admin_audit('USER_UNBANNED', old.user_id, old.institute_id);
  return old;
end;
$$;
drop trigger if exists trg_audit_shop_ban on public.shop_bans;
create trigger trg_audit_shop_ban after insert or delete on public.shop_bans
  for each row execute function public.audit_shop_ban();

create or replace function public.audit_cr_change()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_admin_audit('CR_ASSIGNED', new.id, new.institute_id);
    return new;
  end if;
  perform public.write_admin_audit('CR_REMOVED', old.id, old.institute_id);
  return old;
end;
$$;
drop trigger if exists trg_audit_cr_change on public.class_representatives;
create trigger trg_audit_cr_change after insert or delete on public.class_representatives
  for each row execute function public.audit_cr_change();
