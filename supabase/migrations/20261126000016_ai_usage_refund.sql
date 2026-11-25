-- Provider-side failures must not consume a user's daily AI questions.
create or replace function public.ai_usage_refund()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then return; end if;
  update public.ai_usage
  set count = greatest(count - 1, 0)
  where user_id = auth.uid() and day = current_date;
end;
$$;

revoke all on function public.ai_usage_refund() from public, anon;
grant execute on function public.ai_usage_refund() to authenticated;
