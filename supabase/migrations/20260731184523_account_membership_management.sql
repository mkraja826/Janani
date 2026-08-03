create or replace function public.leave_family()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_family uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select family_id, role::text into v_family, v_role
  from public.family_members
  where user_id = v_user
  limit 1;

  if v_family is null then return; end if;
  if v_role = 'mother' then
    raise exception 'The mother cannot leave the pregnancy family. Use account deletion after exporting any data you wish to keep.';
  end if;

  delete from public.family_members where family_id = v_family and user_id = v_user;
  update public.families
  set invite_code = upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)), updated_at = now()
  where id = v_family;
end;
$$;

create or replace function public.disconnect_partner()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_family uuid;
  v_role text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select family_id, role::text into v_family, v_role
  from public.family_members
  where user_id = v_user
  limit 1;

  if v_family is null or v_role <> 'mother' then
    raise exception 'Only the mother can disconnect the linked partner';
  end if;

  delete from public.family_members
  where family_id = v_family and role::text = 'partner';

  update public.families
  set invite_code = upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)), updated_at = now()
  where id = v_family;
end;
$$;

revoke all on function public.leave_family() from public, anon;
revoke all on function public.disconnect_partner() from public, anon;
grant execute on function public.leave_family() to authenticated;
grant execute on function public.disconnect_partner() to authenticated;
