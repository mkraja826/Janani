begin;

create table if not exists public.care_plus_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('active','grace_period','expired','revoked')),
  plan_code text not null default 'care_plus_monthly',
  source text not null check (source in ('google_play','apple_app_store','admin_test')),
  source_customer_id text,
  source_entitlement_id text,
  current_period_end timestamptz,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_monthly (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  requests_used integer not null default 0 check (requests_used >= 0),
  input_tokens_used bigint not null default 0 check (input_tokens_used >= 0),
  output_tokens_used bigint not null default 0 check (output_tokens_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_start)
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  category text not null check (category in (
    'daily_summary','weekly_meal_ideas','appointment_summary',
    'health_trend_summary','explain_guidance','meal_alternative'
  )),
  status text not null check (status in ('reserved','completed','rejected','provider_error')),
  provider text,
  model text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  safety_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.care_plus_entitlements enable row level security;
alter table public.ai_usage_monthly enable row level security;
alter table public.ai_generations enable row level security;

revoke all on public.care_plus_entitlements from anon, authenticated;
revoke all on public.ai_usage_monthly from anon, authenticated;
revoke all on public.ai_generations from anon, authenticated;

create or replace function public.get_own_care_plus_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_entitlement public.care_plus_entitlements%rowtype;
  v_usage public.ai_usage_monthly%rowtype;
  v_month date := date_trunc('month', now())::date;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select * into v_entitlement
  from public.care_plus_entitlements
  where user_id = v_user;

  select * into v_usage
  from public.ai_usage_monthly
  where user_id = v_user and month_start = v_month;

  if not found then
    -- v_usage may be absent; entitlement is checked independently below.
    null;
  end if;

  if not exists (select 1 from public.care_plus_entitlements where user_id = v_user) then
    return jsonb_build_object(
      'active', false,
      'status', 'none',
      'planCode', null,
      'currentPeriodEnd', null,
      'requestsUsed', coalesce(v_usage.requests_used, 0),
      'requestsLimit', 100,
      'inputTokensUsed', coalesce(v_usage.input_tokens_used, 0),
      'inputTokensLimit', 150000,
      'outputTokensUsed', coalesce(v_usage.output_tokens_used, 0),
      'outputTokensLimit', 50000
    );
  end if;

  return jsonb_build_object(
    'active', v_entitlement.status in ('active','grace_period')
      and (v_entitlement.current_period_end is null or v_entitlement.current_period_end > now()),
    'status', v_entitlement.status,
    'planCode', v_entitlement.plan_code,
    'currentPeriodEnd', v_entitlement.current_period_end,
    'requestsUsed', coalesce(v_usage.requests_used, 0),
    'requestsLimit', 100,
    'inputTokensUsed', coalesce(v_usage.input_tokens_used, 0),
    'inputTokensLimit', 150000,
    'outputTokensUsed', coalesce(v_usage.output_tokens_used, 0),
    'outputTokensLimit', 50000
  );
end;
$$;

create or replace function public.reserve_care_plus_ai_request(
  p_pregnancy_id uuid,
  p_category text,
  p_estimated_input_tokens integer default 0,
  p_estimated_output_tokens integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_month date := date_trunc('month', now())::date;
  v_generation uuid;
  v_usage public.ai_usage_monthly%rowtype;
  v_entitlement public.care_plus_entitlements%rowtype;
  v_is_mother boolean := false;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_category not in ('daily_summary','weekly_meal_ideas','appointment_summary','health_trend_summary','explain_guidance','meal_alternative') then
    raise exception 'unsupported AI category';
  end if;
  if p_estimated_input_tokens < 0 or p_estimated_output_tokens < 0 then
    raise exception 'invalid token estimate';
  end if;

  select * into v_entitlement from public.care_plus_entitlements where user_id = v_user for update;
  if not found
     or v_entitlement.status not in ('active','grace_period')
     or (v_entitlement.current_period_end is not null and v_entitlement.current_period_end <= now()) then
    raise exception 'Care+ entitlement required';
  end if;

  select exists (
    select 1
    from public.pregnancies p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = p_pregnancy_id and fm.user_id = v_user and fm.role = 'mother'
  ) into v_is_mother;
  if not v_is_mother then raise exception 'mother-owned pregnancy required'; end if;

  insert into public.ai_usage_monthly(user_id, month_start)
  values (v_user, v_month)
  on conflict (user_id, month_start) do nothing;

  select * into v_usage
  from public.ai_usage_monthly
  where user_id = v_user and month_start = v_month
  for update;

  if v_usage.requests_used >= 100 then raise exception 'monthly AI request limit reached'; end if;
  if v_usage.input_tokens_used + p_estimated_input_tokens > 150000 then raise exception 'monthly AI input token limit reached'; end if;
  if v_usage.output_tokens_used + p_estimated_output_tokens > 50000 then raise exception 'monthly AI output token limit reached'; end if;

  update public.ai_usage_monthly
  set requests_used = requests_used + 1,
      input_tokens_used = input_tokens_used + p_estimated_input_tokens,
      output_tokens_used = output_tokens_used + p_estimated_output_tokens,
      updated_at = now()
  where user_id = v_user and month_start = v_month;

  insert into public.ai_generations(user_id,pregnancy_id,category,status,input_tokens,output_tokens)
  values (v_user,p_pregnancy_id,p_category,'reserved',p_estimated_input_tokens,p_estimated_output_tokens)
  returning id into v_generation;

  return v_generation;
end;
$$;

revoke all on function public.get_own_care_plus_status() from public;
revoke all on function public.reserve_care_plus_ai_request(uuid,text,integer,integer) from public;
grant execute on function public.get_own_care_plus_status() to authenticated;
grant execute on function public.reserve_care_plus_ai_request(uuid,text,integer,integer) to authenticated;

commit;
