begin;

create table if not exists public.google_play_subscription_purchases (
  purchase_token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  package_name text not null,
  product_id text,
  base_plan_id text,
  latest_order_id text,
  subscription_state text not null,
  acknowledgement_state text,
  linked_purchase_token text,
  start_time timestamptz,
  expiry_time timestamptz,
  raw_region_code text,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists google_play_subscription_latest_order_idx
  on public.google_play_subscription_purchases(latest_order_id)
  where latest_order_id is not null;

alter table public.google_play_subscription_purchases enable row level security;
revoke all on public.google_play_subscription_purchases from anon, authenticated;

-- Only service-role/server code should write verified purchase records or Care+ entitlements.
-- The authenticated client can only inspect its entitlement through get_own_care_plus_status().

commit;
