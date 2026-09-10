begin;

alter function public.normalize_short_text_array(jsonb, integer, integer)
  set search_path = pg_catalog;

create or replace function public.register_device_push_token_v2(
  p_expo_push_token text,
  p_platform text,
  p_device_name text default null,
  p_locale_code text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := btrim(coalesce(p_expo_push_token, ''));
  v_device_name text := nullif(btrim(coalesce(p_device_name, '')), '');
  v_locale text := btrim(coalesce(p_locale_code, 'en'));
  v_token_id uuid;
  v_existing_user_id uuid;
  v_existing_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if char_length(v_token) not between 10 and 255 then
    raise exception using errcode = '22023', message = 'Invalid push token';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception using errcode = '22023', message = 'Invalid platform';
  end if;

  if v_device_name is not null and char_length(v_device_name) > 100 then
    raise exception using errcode = '22023', message = 'Device name is too long';
  end if;

  if v_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then
    raise exception using errcode = '22023', message = 'Invalid locale code';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_token, 2)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 1)
  );

  select token.user_id, token.is_active
  into v_existing_user_id, v_existing_active
  from public.device_push_tokens as token
  where token.expo_push_token = v_token
  for update;

  if v_existing_active
     and v_existing_user_id is distinct from v_user_id then
    raise exception using
      errcode = '42501',
      message = 'This active device token belongs to another account';
  end if;

  if not coalesce(
    v_existing_user_id = v_user_id and v_existing_active,
    false
  ) and (
    select count(*)
    from public.device_push_tokens
    where user_id = v_user_id
      and is_active
  ) >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'Active device limit reached';
  end if;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_name,
    locale_code,
    is_active,
    last_seen_at
  )
  values (
    v_user_id,
    v_token,
    p_platform,
    v_device_name,
    v_locale,
    true,
    statement_timestamp()
  )
  on conflict (expo_push_token)
  do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      device_name = excluded.device_name,
      locale_code = excluded.locale_code,
      is_active = true,
      last_seen_at = excluded.last_seen_at,
      updated_at = statement_timestamp()
  where public.device_push_tokens.user_id = excluded.user_id
     or not public.device_push_tokens.is_active
  returning id into v_token_id;

  if v_token_id is null then
    raise exception using
      errcode = '42501',
      message = 'This active device token belongs to another account';
  end if;

  return v_token_id;
end;
$$;

revoke all on function public.register_device_push_token_v2(text, text, text, text) from public;
grant execute on function public.register_device_push_token_v2(text, text, text, text) to authenticated;

commit;
