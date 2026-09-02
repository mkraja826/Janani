begin;

-- Janani Giving is intentionally isolated from pregnancy, family, health,
-- Care+, and subscription data. Only the sanitized public ledger below is
-- readable by anonymous website visitors.
create schema if not exists janani_giving;

revoke all on schema janani_giving from public, anon, authenticated;
grant usage on schema janani_giving to service_role;

create table if not exists janani_giving.organisations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(btrim(legal_name)) between 2 and 200),
  public_name text not null check (char_length(btrim(public_name)) between 2 and 160),
  registration_number text not null check (char_length(btrim(registration_number)) between 2 and 120),
  registration_country text not null default 'IN' check (char_length(registration_country) = 2),
  tax_registration_number text,
  website_url text,
  due_diligence_status text not null default 'pending'
    check (due_diligence_status in ('pending', 'verified', 'rejected', 'suspended')),
  bank_account_verified boolean not null default false,
  child_safeguarding_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_country, registration_number),
  check (
    due_diligence_status <> 'verified'
    or (
      bank_account_verified
      and child_safeguarding_verified
      and verified_at is not null
    )
  )
);

create table if not exists janani_giving.periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  gross_revenue_inr numeric(16,2) not null default 0 check (gross_revenue_inr >= 0),
  platform_fees_inr numeric(16,2) not null default 0 check (platform_fees_inr >= 0),
  refunds_inr numeric(16,2) not null default 0 check (refunds_inr >= 0),
  taxes_inr numeric(16,2) not null default 0 check (taxes_inr >= 0),
  operating_costs_inr numeric(16,2) not null default 0 check (operating_costs_inr >= 0),
  reserve_allocation_inr numeric(16,2) not null default 0 check (reserve_allocation_inr >= 0),
  distributable_surplus_inr numeric(16,2) not null default 0 check (distributable_surplus_inr >= 0),
  donation_rate numeric(6,5) check (donation_rate is null or donation_rate between 0 and 1),
  donation_allocation_inr numeric(16,2) not null default 0 check (donation_allocation_inr >= 0),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'closed')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_start, period_end),
  check (period_start <= period_end),
  check (donation_allocation_inr <= distributable_surplus_inr)
);

create table if not exists janani_giving.donations (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references janani_giving.periods(id) on delete restrict,
  organisation_id uuid not null references janani_giving.organisations(id) on delete restrict,
  amount_inr numeric(14,2) not null check (amount_inr > 0),
  cause text not null check (
    cause in (
      'Nutrition',
      'Healthcare',
      'Education',
      'Basic needs',
      'Maternal & infant welfare'
    )
  ),
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'transferred', 'reconciled', 'published', 'void')),
  internal_transfer_reference text,
  receipt_storage_path text,
  public_note text check (public_note is null or char_length(public_note) <= 1000),
  approved_at timestamptz,
  approved_by uuid,
  transferred_at timestamptz,
  reconciled_at timestamptz,
  reconciled_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'approved', 'void') or transferred_at is not null),
  check (status not in ('reconciled', 'published') or reconciled_at is not null),
  check (status <> 'published' or published_at is not null)
);

create index if not exists janani_giving_donations_period_idx
  on janani_giving.donations(period_id, created_at desc);
create index if not exists janani_giving_donations_organisation_idx
  on janani_giving.donations(organisation_id, created_at desc);
create index if not exists janani_giving_donations_status_idx
  on janani_giving.donations(status, transferred_at desc);

create table if not exists janani_giving.audit_events (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('organisation', 'period', 'donation', 'publication')),
  entity_id uuid,
  event_type text not null check (char_length(event_type) between 2 and 80),
  event_data jsonb not null default '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz not null default now()
);

alter table janani_giving.organisations enable row level security;
alter table janani_giving.periods enable row level security;
alter table janani_giving.donations enable row level security;
alter table janani_giving.audit_events enable row level security;

revoke all on all tables in schema janani_giving from public, anon, authenticated;
revoke all on all sequences in schema janani_giving from public, anon, authenticated;
grant select, insert, update, delete on janani_giving.organisations to service_role;
grant select, insert, update, delete on janani_giving.periods to service_role;
grant select, insert, update, delete on janani_giving.donations to service_role;
grant select, insert on janani_giving.audit_events to service_role;
grant usage, select on all sequences in schema janani_giving to service_role;

create or replace function janani_giving.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function janani_giving.prevent_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
begin
  raise exception 'Janani Giving audit events are append-only';
end;
$$;

create or replace function janani_giving.audit_donation_change()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
begin
  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'donation',
    coalesce(new.id, old.id),
    lower(tg_op),
    case
      when tg_op = 'INSERT' then jsonb_build_object('status', new.status, 'amount_inr', new.amount_inr, 'cause', new.cause)
      when tg_op = 'UPDATE' then jsonb_build_object('old_status', old.status, 'new_status', new.status)
      else jsonb_build_object('old_status', old.status)
    end
  );
  return coalesce(new, old);
end;
$$;

create or replace function janani_giving.audit_organisation_change()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
begin
  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'organisation',
    coalesce(new.id, old.id),
    lower(tg_op),
    case
      when tg_op = 'INSERT' then jsonb_build_object('due_diligence_status', new.due_diligence_status)
      when tg_op = 'UPDATE' then jsonb_build_object(
        'old_due_diligence_status', old.due_diligence_status,
        'new_due_diligence_status', new.due_diligence_status,
        'bank_account_verified', new.bank_account_verified,
        'child_safeguarding_verified', new.child_safeguarding_verified
      )
      else jsonb_build_object('old_due_diligence_status', old.due_diligence_status)
    end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists janani_giving_organisations_touch_updated_at on janani_giving.organisations;
create trigger janani_giving_organisations_touch_updated_at
before update on janani_giving.organisations
for each row execute function janani_giving.touch_updated_at();

drop trigger if exists janani_giving_periods_touch_updated_at on janani_giving.periods;
create trigger janani_giving_periods_touch_updated_at
before update on janani_giving.periods
for each row execute function janani_giving.touch_updated_at();

drop trigger if exists janani_giving_donations_touch_updated_at on janani_giving.donations;
create trigger janani_giving_donations_touch_updated_at
before update on janani_giving.donations
for each row execute function janani_giving.touch_updated_at();

drop trigger if exists janani_giving_audit_events_immutable on janani_giving.audit_events;
create trigger janani_giving_audit_events_immutable
before update or delete on janani_giving.audit_events
for each row execute function janani_giving.prevent_audit_mutation();

drop trigger if exists janani_giving_donations_audit on janani_giving.donations;
create trigger janani_giving_donations_audit
after insert or update or delete on janani_giving.donations
for each row execute function janani_giving.audit_donation_change();

drop trigger if exists janani_giving_organisations_audit on janani_giving.organisations;
create trigger janani_giving_organisations_audit
after insert or update or delete on janani_giving.organisations
for each row execute function janani_giving.audit_organisation_change();

-- This is the only Giving relation intended for anonymous website reads.
-- It contains no bank reference, receipt storage path, registration number,
-- user identifier, subscriber information, or pregnancy/health data.
create table if not exists public.public_giving_ledger (
  donation_id uuid primary key,
  organisation_name text not null check (char_length(btrim(organisation_name)) between 2 and 160),
  cause text not null check (
    cause in (
      'Nutrition',
      'Healthcare',
      'Education',
      'Basic needs',
      'Maternal & infant welfare'
    )
  ),
  amount_inr numeric(14,2) not null check (amount_inr > 0),
  transferred_at timestamptz not null,
  verification_status text not null default 'verified' check (verification_status = 'verified'),
  public_reference text not null unique check (char_length(public_reference) between 8 and 80),
  published_at timestamptz not null default now()
);

alter table public.public_giving_ledger enable row level security;
revoke all on public.public_giving_ledger from public, anon, authenticated, service_role;
grant select on public.public_giving_ledger to anon, authenticated;

drop policy if exists public_giving_ledger_read_verified on public.public_giving_ledger;
create policy public_giving_ledger_read_verified
on public.public_giving_ledger
for select
to anon, authenticated
using (verification_status = 'verified');

create or replace function janani_giving.publish_donation(p_donation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = janani_giving, public, pg_temp
as $$
declare
  v_donation janani_giving.donations%rowtype;
  v_organisation janani_giving.organisations%rowtype;
  v_public_reference text;
begin
  select * into v_donation
  from janani_giving.donations
  where id = p_donation_id
  for update;

  if not found then
    raise exception 'Donation not found';
  end if;

  if v_donation.status <> 'reconciled' then
    raise exception 'Only reconciled donations can be published';
  end if;

  if v_donation.transferred_at is null or v_donation.reconciled_at is null then
    raise exception 'Donation transfer and reconciliation must be complete before publication';
  end if;

  select * into v_organisation
  from janani_giving.organisations
  where id = v_donation.organisation_id;

  if not found then
    raise exception 'Organisation not found';
  end if;

  if v_organisation.due_diligence_status <> 'verified'
     or not v_organisation.bank_account_verified
     or not v_organisation.child_safeguarding_verified
     or v_organisation.verified_at is null then
    raise exception 'Organisation verification is incomplete';
  end if;

  v_public_reference :=
    'JG-' ||
    to_char(v_donation.transferred_at at time zone 'UTC', 'YYYYMM') || '-' ||
    upper(substr(replace(v_donation.id::text, '-', ''), 1, 8));

  insert into public.public_giving_ledger(
    donation_id,
    organisation_name,
    cause,
    amount_inr,
    transferred_at,
    verification_status,
    public_reference,
    published_at
  ) values (
    v_donation.id,
    v_organisation.public_name,
    v_donation.cause,
    v_donation.amount_inr,
    v_donation.transferred_at,
    'verified',
    v_public_reference,
    now()
  )
  on conflict (donation_id) do update set
    organisation_name = excluded.organisation_name,
    cause = excluded.cause,
    amount_inr = excluded.amount_inr,
    transferred_at = excluded.transferred_at,
    verification_status = 'verified',
    public_reference = excluded.public_reference,
    published_at = now();

  update janani_giving.donations
  set status = 'published', published_at = now()
  where id = v_donation.id;

  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'publication',
    v_donation.id,
    'published',
    jsonb_build_object('public_reference', v_public_reference)
  );

  return v_donation.id;
end;
$$;

create or replace function janani_giving.unpublish_donation(p_donation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = janani_giving, public, pg_temp
as $$
begin
  delete from public.public_giving_ledger where donation_id = p_donation_id;

  update janani_giving.donations
  set status = case when status = 'published' then 'reconciled' else status end,
      published_at = null
  where id = p_donation_id;

  if not found then
    raise exception 'Donation not found';
  end if;

  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values ('publication', p_donation_id, 'unpublished', '{}'::jsonb);

  return p_donation_id;
end;
$$;

revoke all on function janani_giving.touch_updated_at() from public, anon, authenticated;
revoke all on function janani_giving.prevent_audit_mutation() from public, anon, authenticated;
revoke all on function janani_giving.audit_donation_change() from public, anon, authenticated;
revoke all on function janani_giving.audit_organisation_change() from public, anon, authenticated;
revoke all on function janani_giving.publish_donation(uuid) from public, anon, authenticated;
revoke all on function janani_giving.unpublish_donation(uuid) from public, anon, authenticated;

grant execute on function janani_giving.publish_donation(uuid) to service_role;
grant execute on function janani_giving.unpublish_donation(uuid) to service_role;

commit;
