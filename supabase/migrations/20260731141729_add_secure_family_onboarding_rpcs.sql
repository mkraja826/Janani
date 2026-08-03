create or replace function public.create_mother_family(
  p_full_name text,
  p_family_name text,
  p_due_date date,
  p_last_menstrual_period date default null,
  p_height_cm numeric default null,
  p_pre_pregnancy_weight_kg numeric default null
) returns table(family_id uuid, pregnancy_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_pregnancy_id uuid;
  v_invite_code text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_due_date is null then raise exception 'Due date is required'; end if;

  update public.profiles set full_name = nullif(trim(p_full_name), ''), updated_at = now() where id = v_user_id;

  loop
    v_invite_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.families where families.invite_code = v_invite_code);
  end loop;

  insert into public.families(name, invite_code, created_by)
  values (coalesce(nullif(trim(p_family_name), ''), 'Our little family'), v_invite_code, v_user_id)
  returning id into v_family_id;

  insert into public.family_members(family_id, user_id, role)
  values (v_family_id, v_user_id, 'mother');

  insert into public.pregnancies(family_id, mother_id, due_date, last_menstrual_period, height_cm, pre_pregnancy_weight_kg)
  values (v_family_id, v_user_id, p_due_date, p_last_menstrual_period, p_height_cm, p_pre_pregnancy_weight_kg)
  returning id into v_pregnancy_id;

  return query select v_family_id, v_pregnancy_id, v_invite_code;
end;
$$;

create or replace function public.join_family_as_partner(
  p_full_name text,
  p_invite_code text
) returns table(family_id uuid, pregnancy_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_pregnancy_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select id into v_family_id
  from public.families
  where invite_code = upper(trim(p_invite_code));

  if v_family_id is null then raise exception 'Invite code not found'; end if;

  if exists (select 1 from public.family_members where user_id = v_user_id) then
    raise exception 'This account is already linked to a family';
  end if;

  update public.profiles set full_name = nullif(trim(p_full_name), ''), updated_at = now() where id = v_user_id;

  insert into public.family_members(family_id, user_id, role)
  values (v_family_id, v_user_id, 'partner');

  select id into v_pregnancy_id from public.pregnancies where family_id = v_family_id and status = 'active' order by created_at desc limit 1;

  return query select v_family_id, v_pregnancy_id;
end;
$$;

revoke all on function public.create_mother_family(text,text,date,date,numeric,numeric) from public, anon;
revoke all on function public.join_family_as_partner(text,text) from public, anon;
grant execute on function public.create_mother_family(text,text,date,date,numeric,numeric) to authenticated;
grant execute on function public.join_family_as_partner(text,text) to authenticated;
