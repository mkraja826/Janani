begin;

create table if not exists public.care_credit_plan_config (
  plan_code text primary key,
  monthly_credits integer check (monthly_credits is null or monthly_credits > 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.care_credit_topup_products (
  product_id text primary key,
  credits integer not null check (credits > 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Keep commercial credit amounts deliberately unset until product economics and
-- Google Play products are approved. The schema is ready without inventing a live allowance.
insert into public.care_credit_plan_config(plan_code, monthly_credits, enabled)
values ('care_plus_monthly', null, false)
on conflict (plan_code) do nothing;

alter table public.care_credit_plan_config enable row level security;
alter table public.care_credit_topup_products enable row level security;
revoke all on public.care_credit_plan_config from anon, authenticated;
revoke all on public.care_credit_topup_products from anon, authenticated;

create or replace function public.grant_monthly_care_credits_server(
  p_user_id uuid,
  p_period_start date
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_entitlement public.care_plus_entitlements%rowtype;
  v_monthly_credits integer;
  v_enabled boolean;
  v_reference text;
  v_balance integer;
begin
  if p_user_id is null or p_period_start is null then raise exception 'user and period required'; end if;

  select * into v_entitlement
  from public.care_plus_entitlements
  where user_id = p_user_id
  for update;

  if v_entitlement.user_id is null
     or v_entitlement.status not in ('active','grace_period')
     or (v_entitlement.current_period_end is not null and v_entitlement.current_period_end <= now()) then
    raise exception 'active Care+ entitlement required';
  end if;

  select monthly_credits, enabled into v_monthly_credits, v_enabled
  from public.care_credit_plan_config
  where plan_code = v_entitlement.plan_code;

  if coalesce(v_enabled, false) is false or v_monthly_credits is null then
    return jsonb_build_object('granted', false, 'reason', 'plan_credit_grant_not_configured');
  end if;

  v_reference := 'monthly:' || v_entitlement.plan_code || ':' || p_period_start::text;
  v_balance := public.grant_care_credits_server(
    p_user_id,
    v_monthly_credits,
    'monthly_grant',
    v_reference,
    null,
    jsonb_build_object('planCode', v_entitlement.plan_code, 'periodStart', p_period_start)
  );

  return jsonb_build_object('granted', true, 'credits', v_monthly_credits, 'balance', v_balance, 'reference', v_reference);
end;
$$;

create or replace function public.grant_verified_topup_care_credits_server(
  p_user_id uuid,
  p_product_id text,
  p_purchase_token_hash text,
  p_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_credits integer;
  v_enabled boolean;
  v_reference text;
  v_balance integer;
begin
  if p_user_id is null then raise exception 'user required'; end if;
  if nullif(trim(p_product_id),'') is null or nullif(trim(p_purchase_token_hash),'') is null then
    raise exception 'verified product and purchase token hash required';
  end if;

  select credits, enabled into v_credits, v_enabled
  from public.care_credit_topup_products
  where product_id = p_product_id;

  if coalesce(v_enabled, false) is false or v_credits is null then
    raise exception 'top-up product is not enabled';
  end if;

  -- The raw Play purchase token must never be stored here. Only a server-generated hash
  -- is used as an idempotency key after Google Play verification succeeds.
  v_reference := 'topup:' || p_product_id || ':' || p_purchase_token_hash;
  v_balance := public.grant_care_credits_server(
    p_user_id,
    v_credits,
    'topup_grant',
    v_reference,
    null,
    jsonb_build_object('productId', p_product_id, 'orderId', nullif(left(coalesce(p_order_id,''), 160), ''))
  );

  return jsonb_build_object('granted', true, 'credits', v_credits, 'balance', v_balance, 'reference', v_reference);
end;
$$;

revoke all on function public.grant_monthly_care_credits_server(uuid,date) from public;
revoke all on function public.grant_verified_topup_care_credits_server(uuid,text,text,text) from public;
grant execute on function public.grant_monthly_care_credits_server(uuid,date) to service_role;
grant execute on function public.grant_verified_topup_care_credits_server(uuid,text,text,text) to service_role;

commit;
