create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_family_member(uuid) from public, anon, authenticated;
revoke all on function public.can_access_pregnancy(uuid) from public, anon, authenticated;

grant execute on function public.is_family_member(uuid) to postgres, service_role;
grant execute on function public.can_access_pregnancy(uuid) to postgres, service_role;
