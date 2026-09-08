begin;

-- v14 activation step: welcome Care Credits can unlock limited Care+ AI for
-- authenticated mothers even before a paid Care+ entitlement exists.
-- Paid Care+ users remain on the existing monthly request/token quota until
-- Play Billing monthly-credit grants are wired and a commercial credit amount
-- is explicitly approved.

create or replace function public.get_own_care_plus_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_entitlement public.care_plus_entitlements%rowtype;
  v_month date := date_trunc('month', now())::date;
  v_usage public.ai_usage_monthly%rowtype;
  v_credit_status jsonb;
  v_credit_balance integer := 0;
  v_paid_active boolean := false;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  v_credit_status := public.ensure_own_welcome_care_credits();
  v_credit_balance := coalesce((v_credit_status ->> 'balance')::integer, 0);

  select * into v_entitlement
  from public.care_plus_entitlements
  where user_id = v_user;

  select * into v_usage
  from public.ai_usage_monthly
  where user_id = v_user and month_start = v_month;

  v_paid_active := v_entitlement.user_id is not null
    and v_entitlement.status in ('active','grace_period')
    and (v_entitlement.current_period_end is null or v_entitlement.current_period_end > now());

  return jsonb_build_object(
    'active', v_paid_active or v_credit_balance > 0,
    'paidActive', v_paid_active,
    'status', case
      when v_paid_active then v_entitlement.status
      when v_credit_balance > 0 then 'welcome_credits'
      else 'none'
    end,
    'planCode', case when v_paid_active then v_entitlement.plan_code else null end,
    'currentPeriodEnd', case when v_paid_active then v_entitlement.current_period_end else null end,
    'careCredits', v_credit_balance,
    'requestsUsed', coalesce(v_usage.requests_used, 0),
    'requestLimit', 100,
    'inputTokensUsed', coalesce(v_usage.input_tokens_used, 0),
    'inputTokenLimit', 150000,
    'outputTokensUsed', coalesce(v_usage.output_tokens_used, 0),
    'outputTokenLimit', 50000
  );
end;
$$;

create or replace function public.reserve_care_plus_ai_request_server(
  p_user_id uuid,
  p_pregnancy_id uuid,
  p_category text,
  p_estimated_input_tokens integer,
  p_estimated_output_tokens integer
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_generation uuid;
  v_usage public.ai_usage_monthly%rowtype;
  v_entitlement public.care_plus_entitlements%rowtype;
  v_wallet public.care_credit_wallets%rowtype;
  v_paid_active boolean := false;
  v_credit_reservation uuid;
begin
  if p_user_id is null then raise exception 'user required'; end if;
  if p_category not in ('daily_summary','weekly_meal_ideas','appointment_summary','health_trend_summary','explain_guidance','meal_alternative') then
    raise exception 'unsupported AI category';
  end if;
  if p_estimated_input_tokens < 0 or p_estimated_output_tokens < 0 then raise exception 'invalid token estimate'; end if;
  if p_estimated_input_tokens > 12000 or p_estimated_output_tokens > 3000 then raise exception 'token estimate too large'; end if;

  select * into v_entitlement
  from public.care_plus_entitlements
  where user_id = p_user_id
  for update;

  v_paid_active := v_entitlement.user_id is not null
    and v_entitlement.status in ('active','grace_period')
    and (v_entitlement.current_period_end is null or v_entitlement.current_period_end > now());

  select * into v_wallet
  from public.care_credit_wallets
  where user_id = p_user_id
  for update;

  if not v_paid_active and (v_wallet.user_id is null or v_wallet.balance <= 0) then
    raise exception 'Care+ entitlement or Care Credits required';
  end if;

  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = p_user_id
  ) then
    raise exception 'mother-owned pregnancy required';
  end if;

  insert into public.ai_usage_monthly(user_id, month_start)
  values (p_user_id, v_month)
  on conflict (user_id, month_start) do nothing;

  select * into v_usage
  from public.ai_usage_monthly
  where user_id = p_user_id and month_start = v_month
  for update;

  if v_usage.requests_used >= 100 then raise exception 'monthly AI request limit reached'; end if;
  if v_usage.input_tokens_used + p_estimated_input_tokens > 150000 then raise exception 'monthly AI input token limit reached'; end if;
  if v_usage.output_tokens_used + p_estimated_output_tokens > 50000 then raise exception 'monthly AI output token limit reached'; end if;

  update public.ai_usage_monthly
  set requests_used = requests_used + 1,
      input_tokens_used = input_tokens_used + p_estimated_input_tokens,
      output_tokens_used = output_tokens_used + p_estimated_output_tokens,
      updated_at = now()
  where user_id = p_user_id and month_start = v_month;

  insert into public.ai_generations(
    user_id,pregnancy_id,category,status,reserved_input_tokens,reserved_output_tokens
  ) values (
    p_user_id,p_pregnancy_id,p_category,'reserved',p_estimated_input_tokens,p_estimated_output_tokens
  ) returning id into v_generation;

  -- Welcome/free-credit users pay Care Credits now. Paid Care+ users remain on
  -- the existing quota until monthly billing grants are implemented.
  if not v_paid_active then
    v_credit_reservation := public.reserve_care_credits_server(p_user_id, v_generation, p_category);
    if v_credit_reservation is null and exists (
      select 1 from public.care_credit_costs where category = p_category and credits > 0
    ) then
      raise exception 'Care Credit reservation failed';
    end if;
  end if;

  return v_generation;
end;
$$;

create or replace function public.finalize_care_plus_ai_request_server(
  p_generation_id uuid,
  p_status text,
  p_provider text default null,
  p_model text default null,
  p_actual_input_tokens integer default 0,
  p_actual_output_tokens integer default 0,
  p_safety_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_generation public.ai_generations%rowtype;
  v_month date;
  v_input_delta bigint;
  v_output_delta bigint;
  v_credit_reservation uuid;
begin
  if p_status not in ('completed','rejected','provider_error') then raise exception 'invalid final status'; end if;
  if p_actual_input_tokens < 0 or p_actual_output_tokens < 0 then raise exception 'invalid actual token usage'; end if;

  select * into v_generation
  from public.ai_generations
  where id = p_generation_id
  for update;

  if v_generation.id is null then raise exception 'generation not found'; end if;
  if v_generation.status <> 'reserved' then return; end if;

  v_month := date_trunc('month', v_generation.created_at)::date;

  if p_status = 'completed' then
    v_input_delta := p_actual_input_tokens - v_generation.reserved_input_tokens;
    v_output_delta := p_actual_output_tokens - v_generation.reserved_output_tokens;
    update public.ai_usage_monthly
    set input_tokens_used = greatest(0, input_tokens_used + v_input_delta),
        output_tokens_used = greatest(0, output_tokens_used + v_output_delta),
        updated_at = now()
    where user_id = v_generation.user_id and month_start = v_month;
  else
    update public.ai_usage_monthly
    set requests_used = greatest(0, requests_used - 1),
        input_tokens_used = greatest(0, input_tokens_used - v_generation.reserved_input_tokens),
        output_tokens_used = greatest(0, output_tokens_used - v_generation.reserved_output_tokens),
        updated_at = now()
    where user_id = v_generation.user_id and month_start = v_month;
  end if;

  select id into v_credit_reservation
  from public.care_credit_reservations
  where generation_id = p_generation_id and status = 'reserved'
  limit 1;

  if v_credit_reservation is not null then
    perform public.finalize_care_credits_server(v_credit_reservation, p_status = 'completed');
  end if;

  update public.ai_generations
  set status = p_status,
      provider = nullif(left(coalesce(p_provider,''), 80), ''),
      model = nullif(left(coalesce(p_model,''), 120), ''),
      input_tokens = case when p_status = 'completed' then p_actual_input_tokens else 0 end,
      output_tokens = case when p_status = 'completed' then p_actual_output_tokens else 0 end,
      safety_code = nullif(left(coalesce(p_safety_code,''), 120), ''),
      completed_at = now()
  where id = p_generation_id;
end;
$$;

revoke all on function public.get_own_care_plus_status() from public;
revoke all on function public.reserve_care_plus_ai_request_server(uuid,uuid,text,integer,integer) from public;
revoke all on function public.finalize_care_plus_ai_request_server(uuid,text,text,text,integer,integer,text) from public;
grant execute on function public.get_own_care_plus_status() to authenticated;
grant execute on function public.reserve_care_plus_ai_request_server(uuid,uuid,text,integer,integer) to service_role;
grant execute on function public.finalize_care_plus_ai_request_server(uuid,text,text,text,integer,integer,text) to service_role;

commit;
