-- Give the "already an admin" error precedence over institute membership so a
-- user cannot be misreported as belonging to another institute.
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
  if exists (select 1 from public.institute_admins where user_id = target) then
    raise exception 'User is already an admin';
  end if;
  if not exists (
    select 1 from public.student_profiles sp
    where sp.user_id = target and sp.institute_id = p_institute_id
  ) then
    raise exception 'User does not belong to this institute';
  end if;
  insert into public.institute_admins (user_id, email, institute_id, role, assigned_by, assigned_at)
  values (target, lower(trim(p_email)), p_institute_id, 'sub_admin', auth.uid(), now());
end;
$$;

revoke all on function public.add_sub_admin(text, text) from public, anon;
grant execute on function public.add_sub_admin(text, text) to authenticated;
