create table if not exists public.janani_ai_usage_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, window_start),
  constraint janani_ai_usage_windows_request_count_nonnegative check (request_count >= 0)
);

alter table public.janani_ai_usage_windows enable row level security;

revoke all on table public.janani_ai_usage_windows from anon, authenticated;

grant select, insert, update on table public.janani_ai_usage_windows to service_role;

create or replace function public.consume_janani_ai_quota(
  p_user_id uuid,
  p_limit integer default 20,
  p_window_minutes integer default 60
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_user_id is null then
    raise exception 'user id required' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 500 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;
  if p_window_minutes < 1 or p_window_minutes > 1440 then
    raise exception 'invalid window' using errcode = '22023';
  end if;

  v_window_start := date_trunc('minute', now())
    - make_interval(mins => mod(extract(minute from now())::integer, p_window_minutes));

  insert into public.janani_ai_usage_windows (user_id, window_start, request_count)
  values (p_user_id, v_window_start, 1)
  on conflict (user_id, window_start)
  do update set request_count = public.janani_ai_usage_windows.request_count + 1
  returning request_count into v_count;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_window_start + make_interval(mins => p_window_minutes);
end;
$$;

revoke all on function public.consume_janani_ai_quota(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_janani_ai_quota(uuid, integer, integer) to service_role;
