begin;

create table if not exists public.google_play_rtdn_events (
  message_id text primary key,
  purchase_token text,
  notification_type integer,
  event_time_millis bigint,
  package_name text,
  status text not null check (status in ('received','processed','ignored','failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.google_play_rtdn_events enable row level security;
revoke all on public.google_play_rtdn_events from anon, authenticated;

create index if not exists google_play_rtdn_purchase_token_idx
  on public.google_play_rtdn_events(purchase_token);

commit;
