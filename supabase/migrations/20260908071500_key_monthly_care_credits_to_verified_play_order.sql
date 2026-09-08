begin;

create or replace function public.grant_monthly_care_credits_for_verified_order_server(
  p_user_id uuid,
  p_order_reference_hash text
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
  v_order_hash text := lower(btrim(coalesce(p_order_reference_hash, '')));
begin
  if p_user_id is null then raise exception 'user required'; end if;
  if v_order_hash !~ '^[0-9a-f]{64}$' then raise exception 'verified order reference hash required'; end if;

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

  v_reference := 'monthly-play-order:' || v_entitlement.plan_code || ':' || v_order_hash;
  v_balance := public.grant_care_credits_server(
    p_user_id,
    v_monthly_credits,
    'monthly_grant',
    v_reference,
    null,
    jsonb_build_object('planCode', v_entitlement.plan_code, 'verifiedOrderHash', v_order_hash)
  );

  return jsonb_build_object(
    'granted', true,
    'credits', v_monthly_credits,
    'balance', v_balance,
    'reference', v_reference
  );
end;
$$;

revoke all on function public.grant_monthly_care_credits_for_verified_order_server(uuid,text) from public, anon, authenticated;
grant execute on function public.grant_monthly_care_credits_for_verified_order_server(uuid,text) to service_role;

commit;
