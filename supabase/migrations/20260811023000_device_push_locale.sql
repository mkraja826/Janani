begin;

alter table public.device_push_tokens
  add column if not exists locale_code text not null default 'en';

alter table public.device_push_tokens
  drop constraint if exists device_push_tokens_locale_code_check;

alter table public.device_push_tokens
  add constraint device_push_tokens_locale_code_check
  check (locale_code ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$');

create or replace function public.register_device_push_token_v2(
  p_expo_push_token text,
  p_platform text,
  p_device_name text default null,
  p_locale_code text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_token_id uuid;
  v_locale text := trim(coalesce(p_locale_code, 'en'));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_expo_push_token is null or length(trim(p_expo_push_token)) < 10 then
    raise exception 'Invalid push token' using errcode = '22023';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'Invalid platform' using errcode = '22023';
  end if;

  if v_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then
    raise exception 'Invalid locale code' using errcode = '22023';
  end if;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_name,
    locale_code,
    is_active,
    last_seen_at
  ) values (
    v_user_id,
    trim(p_expo_push_token),
    p_platform,
    nullif(trim(coalesce(p_device_name, '')), ''),
    v_locale,
    true,
    now()
  )
  on conflict (expo_push_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        device_name = excluded.device_name,
        locale_code = excluded.locale_code,
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
  returning id into v_token_id;

  return v_token_id;
end;
$$;

revoke all on function public.register_device_push_token_v2(text, text, text, text) from public;
revoke all on function public.register_device_push_token_v2(text, text, text, text) from anon;
grant execute on function public.register_device_push_token_v2(text, text, text, text) to authenticated;

commit;
