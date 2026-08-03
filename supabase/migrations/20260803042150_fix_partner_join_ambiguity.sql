-- Resolve the output-column ambiguity found by the authenticated partner smoke test.
begin;

create or replace function public.join_family_as_partner(
  p_full_name text,
  p_invite_code text
)
returns table (
  family_id uuid,
  pregnancy_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_pregnancy_id uuid;
  v_invite_code text := upper(btrim(coalesce(p_invite_code, '')));
  v_full_name text := nullif(btrim(p_full_name), '');
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if v_invite_code !~ '^[0-9A-F]{20}$' then
    raise exception using errcode = '22023', message = 'Invite code is invalid';
  end if;

  if v_full_name is not null and char_length(v_full_name) > 100 then
    raise exception using errcode = '22023', message = 'Full name is too long';
  end if;

  if exists (
    select 1
    from public.family_members as member
    where member.user_id = v_user_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'This account is already linked to a family';
  end if;

  select family.id
  into v_family_id
  from public.families as family
  where family.invite_code = v_invite_code
  for update;

  if v_family_id is null or exists (
    select 1
    from public.family_members as member
    where member.family_id = v_family_id
      and member.role = 'partner'::public.janani_role
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invite code is invalid or has already been used';
  end if;

  update public.profiles as profile
  set full_name = v_full_name
  where profile.id = v_user_id;

  if not found then
    raise exception using errcode = '23503', message = 'Profile not found';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (
    v_family_id,
    v_user_id,
    'partner'::public.janani_role
  );

  -- One-time invitation: rotate while the family row is still locked.
  update public.families as family
  set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex'))
  where family.id = v_family_id;

  select pregnancy.id
  into v_pregnancy_id
  from public.pregnancies as pregnancy
  where pregnancy.family_id = v_family_id
    and pregnancy.status = 'active'::public.pregnancy_status
  order by pregnancy.created_at desc
  limit 1;

  return query
  select v_family_id, v_pregnancy_id;
end;
$function$;

revoke all on function public.join_family_as_partner(text, text)
  from public, anon;
grant execute on function public.join_family_as_partner(text, text)
  to authenticated;

commit;
