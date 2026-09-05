begin;

create table if not exists public.care_credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('welcome_grant','monthly_grant','topup_grant','ai_reservation','ai_refund','admin_adjustment')),
  reference_key text not null,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, reference_key)
);

create table if not exists public.care_credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.ai_generations(id) on delete set null,
  credits integer not null check (credits > 0),
  status text not null default 'reserved' check (status in ('reserved','consumed','refunded')),
  category text not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table if not exists public.care_credit_costs (
  category text primary key,
  credits integer not null check (credits >= 0),
  updated_at timestamptz not null default now()
);

insert into public.care_credit_costs(category, credits) values
  ('daily_summary', 2),
  ('weekly_meal_ideas', 5),
  ('appointment_summary', 3),
  ('health_trend_summary', 4),
  ('explain_guidance', 2),
  ('meal_alternative', 2)
on conflict (category) do nothing;

alter table public.care_credit_wallets enable row level security;
alter table public.care_credit_ledger enable row level security;
alter table public.care_credit_reservations enable row level security;
alter table public.care_credit_costs enable row level security;

revoke all on public.care_credit_wallets from anon, authenticated;
revoke all on public.care_credit_ledger from anon, authenticated;
revoke all on public.care_credit_reservations from anon, authenticated;
revoke all on public.care_credit_costs from anon, authenticated;

create or replace function public.ensure_own_welcome_care_credits()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_inserted integer := 0;
  v_balance integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  insert into public.care_credit_wallets(user_id, balance)
  values (v_user, 0)
  on conflict (user_id) do nothing;

  insert into public.care_credit_ledger(user_id, amount, kind, reference_key, expires_at, metadata)
  values (
    v_user,
    100,
    'welcome_grant',
    'welcome:v1',
    now() + interval '30 days',
    jsonb_build_object('label','100 Welcome Care Credits','version',1)
  )
  on conflict (user_id, reference_key) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    update public.care_credit_wallets set balance = balance + 100, updated_at = now() where user_id = v_user;
  end if;

  select balance into v_balance from public.care_credit_wallets where user_id = v_user;
  return jsonb_build_object('balance', coalesce(v_balance,0), 'welcomeGranted', v_inserted = 1);
end;
$$;

create or replace function public.get_own_care_credit_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_balance integer := 0;
  v_welcome_expires timestamptz;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  perform public.ensure_own_welcome_care_credits();
  select balance into v_balance from public.care_credit_wallets where user_id = v_user;
  select expires_at into v_welcome_expires
    from public.care_credit_ledger
    where user_id = v_user and reference_key = 'welcome:v1';
  return jsonb_build_object(
    'balance', coalesce(v_balance,0),
    'welcomeCredits', 100,
    'welcomeExpiresAt', v_welcome_expires,
    'currency', 'care_credit'
  );
end;
$$;

create or replace function public.grant_care_credits_server(
  p_user_id uuid,
  p_amount integer,
  p_kind text,
  p_reference_key text,
  p_expires_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_balance integer;
begin
  if p_user_id is null or p_amount <= 0 then raise exception 'invalid credit grant'; end if;
  if p_kind not in ('monthly_grant','topup_grant','admin_adjustment') then raise exception 'invalid grant kind'; end if;
  if nullif(trim(p_reference_key),'') is null then raise exception 'reference key required'; end if;

  insert into public.care_credit_wallets(user_id,balance) values (p_user_id,0)
  on conflict (user_id) do nothing;

  insert into public.care_credit_ledger(user_id,amount,kind,reference_key,expires_at,metadata)
  values (p_user_id,p_amount,p_kind,p_reference_key,p_expires_at,coalesce(p_metadata,'{}'::jsonb))
  on conflict (user_id,reference_key) do nothing;

  if found then
    update public.care_credit_wallets set balance = balance + p_amount, updated_at = now() where user_id = p_user_id;
  end if;
  select balance into v_balance from public.care_credit_wallets where user_id = p_user_id;
  return coalesce(v_balance,0);
end;
$$;

create or replace function public.reserve_care_credits_server(
  p_user_id uuid,
  p_generation_id uuid,
  p_category text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cost integer;
  v_balance integer;
  v_reservation uuid;
begin
  select credits into v_cost from public.care_credit_costs where category = p_category;
  if v_cost is null then raise exception 'unsupported credit category'; end if;
  if v_cost = 0 then return null; end if;

  insert into public.care_credit_wallets(user_id,balance) values (p_user_id,0)
  on conflict (user_id) do nothing;

  select balance into v_balance from public.care_credit_wallets where user_id = p_user_id for update;
  if v_balance < v_cost then raise exception 'insufficient Care Credits'; end if;

  update public.care_credit_wallets set balance = balance - v_cost, updated_at = now() where user_id = p_user_id;
  insert into public.care_credit_reservations(user_id,generation_id,credits,category)
  values (p_user_id,p_generation_id,v_cost,p_category) returning id into v_reservation;
  insert into public.care_credit_ledger(user_id,amount,kind,reference_key,metadata)
  values (p_user_id,-v_cost,'ai_reservation','ai-reservation:' || v_reservation::text,jsonb_build_object('generationId',p_generation_id,'category',p_category));
  return v_reservation;
end;
$$;

create or replace function public.finalize_care_credits_server(
  p_reservation_id uuid,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_row public.care_credit_reservations%rowtype;
begin
  select * into v_row from public.care_credit_reservations where id = p_reservation_id for update;
  if v_row.id is null or v_row.status <> 'reserved' then return; end if;

  if p_success then
    update public.care_credit_reservations set status='consumed', finalized_at=now() where id=v_row.id;
  else
    update public.care_credit_wallets set balance=balance+v_row.credits, updated_at=now() where user_id=v_row.user_id;
    update public.care_credit_reservations set status='refunded', finalized_at=now() where id=v_row.id;
    insert into public.care_credit_ledger(user_id,amount,kind,reference_key,metadata)
    values (v_row.user_id,v_row.credits,'ai_refund','ai-refund:' || v_row.id::text,jsonb_build_object('generationId',v_row.generation_id,'category',v_row.category));
  end if;
end;
$$;

revoke all on function public.ensure_own_welcome_care_credits() from public;
revoke all on function public.get_own_care_credit_status() from public;
revoke all on function public.grant_care_credits_server(uuid,integer,text,text,timestamptz,jsonb) from public;
revoke all on function public.reserve_care_credits_server(uuid,uuid,text) from public;
revoke all on function public.finalize_care_credits_server(uuid,boolean) from public;

grant execute on function public.ensure_own_welcome_care_credits() to authenticated;
grant execute on function public.get_own_care_credit_status() to authenticated;
grant execute on function public.grant_care_credits_server(uuid,integer,text,text,timestamptz,jsonb) to service_role;
grant execute on function public.reserve_care_credits_server(uuid,uuid,text) to service_role;
grant execute on function public.finalize_care_credits_server(uuid,boolean) to service_role;

commit;
