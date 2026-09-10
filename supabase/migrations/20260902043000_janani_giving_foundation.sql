begin;

-- Janani Giving is intentionally isolated from pregnancy, family, health,
-- Care+, authentication, and subscription data. Anonymous website visitors
-- can read only the six-column public view defined at the end of this file.
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
      and verified_by is not null
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
  check (donation_allocation_inr <= distributable_surplus_inr),
  check (
    donation_rate is null
    or donation_allocation_inr <= round(distributable_surplus_inr * donation_rate, 2)
  ),
  check (
    distributable_surplus_inr <= greatest(
      gross_revenue_inr
      - platform_fees_inr
      - refunds_inr
      - taxes_inr
      - operating_costs_inr
      - reserve_allocation_inr,
      0
    )
  ),
  check (
    status = 'draft'
    or (reviewed_at is not null and reviewed_by is not null and donation_rate is not null)
  )
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
  check (
    status in ('draft', 'void')
    or (approved_at is not null and approved_by is not null)
  ),
  check (
    status not in ('transferred', 'reconciled', 'published')
    or (
      transferred_at is not null
      and nullif(btrim(internal_transfer_reference), '') is not null
    )
  ),
  check (
    status not in ('reconciled', 'published')
    or (
      reconciled_at is not null
      and reconciled_by is not null
      and nullif(btrim(receipt_storage_path), '') is not null
    )
  ),
  check (status <> 'published' or published_at is not null)
);

create index if not exists janani_giving_donations_period_idx
  on janani_giving.donations(period_id, created_at desc);
create index if not exists janani_giving_donations_organisation_idx
  on janani_giving.donations(organisation_id, created_at desc);
create index if not exists janani_giving_donations_status_idx
  on janani_giving.donations(status, transferred_at desc);

create table if not exists janani_giving.publications (
  donation_id uuid primary key references janani_giving.donations(id) on delete cascade,
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
  public_reference text not null unique check (char_length(public_reference) between 8 and 80),
  published_at timestamptz not null default now()
);

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
alter table janani_giving.publications enable row level security;
alter table janani_giving.audit_events enable row level security;

revoke all on all tables in schema janani_giving from public, anon, authenticated;
revoke all on all sequences in schema janani_giving from public, anon, authenticated;
grant select, insert, update, delete on janani_giving.organisations to service_role;
grant select, insert, update, delete on janani_giving.periods to service_role;
grant select, insert, update, delete on janani_giving.donations to service_role;
grant select, insert, update, delete on janani_giving.publications to service_role;
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

create or replace function janani_giving.enforce_period_controls()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
declare
  v_committed numeric(16,2);
begin
  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'New Giving periods must start as draft';
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'closed' then
      raise exception 'Closed Giving periods are immutable';
    end if;

    if old.status = 'draft' and new.status not in ('draft', 'reviewed') then
      raise exception 'Giving period must be reviewed before it can be closed';
    end if;

    if old.status = 'reviewed' and new.status not in ('draft', 'reviewed', 'closed') then
      raise exception 'Invalid Giving period state transition';
    end if;
  end if;

  if new.status <> 'draft'
     and (new.reviewed_at is null or new.reviewed_by is null or new.donation_rate is null) then
    raise exception 'Reviewed Giving periods require reviewer, review time, and donation rate';
  end if;

  if new.distributable_surplus_inr > greatest(
    new.gross_revenue_inr
    - new.platform_fees_inr
    - new.refunds_inr
    - new.taxes_inr
    - new.operating_costs_inr
    - new.reserve_allocation_inr,
    0
  ) then
    raise exception 'Distributable surplus cannot exceed revenue less approved costs and reserve';
  end if;

  if new.donation_allocation_inr > new.distributable_surplus_inr then
    raise exception 'Giving allocation cannot exceed distributable surplus';
  end if;

  if new.donation_rate is not null
     and new.donation_allocation_inr > round(new.distributable_surplus_inr * new.donation_rate, 2) then
    raise exception 'Giving allocation cannot exceed the approved donation rate';
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(sum(d.amount_inr), 0)
      into v_committed
    from janani_giving.donations d
    where d.period_id = new.id
      and d.status <> 'void';

    if new.donation_allocation_inr < v_committed then
      raise exception 'Giving allocation cannot be reduced below committed donations';
    end if;
  end if;

  return new;
end;
$$;

create or replace function janani_giving.enforce_donation_controls()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
declare
  v_period janani_giving.periods%rowtype;
  v_committed numeric(16,2);
begin
  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'New donations must start as draft';
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'draft' and new.status not in ('draft', 'approved', 'void') then
      raise exception 'Draft donation must be approved before transfer';
    elsif old.status = 'approved' and new.status not in ('approved', 'transferred', 'void') then
      raise exception 'Approved donation must be transferred before reconciliation';
    elsif old.status = 'transferred' and new.status not in ('transferred', 'reconciled', 'void') then
      raise exception 'Transferred donation must be reconciled before publication';
    elsif old.status = 'reconciled' and new.status not in ('reconciled', 'published', 'void') then
      raise exception 'Invalid reconciled donation state transition';
    elsif old.status = 'published' and new.status not in ('published', 'reconciled') then
      raise exception 'Published donation may only remain published or be unpublished to reconciled';
    elsif old.status = 'void' and new.status <> 'void' then
      raise exception 'Voided donations are immutable';
    end if;

    if old.status not in ('draft', 'approved')
       and (
         new.period_id is distinct from old.period_id
         or new.organisation_id is distinct from old.organisation_id
         or new.amount_inr is distinct from old.amount_inr
         or new.cause is distinct from old.cause
       ) then
      raise exception 'Transferred donation identity and amount are immutable';
    end if;
  end if;

  select * into v_period
  from janani_giving.periods
  where id = new.period_id
  for update;

  if not found then
    raise exception 'Giving period not found';
  end if;

  if new.status in ('approved', 'transferred', 'reconciled', 'published')
     and v_period.status = 'draft' then
    raise exception 'Donation cannot progress until its Giving period is reviewed';
  end if;

  if new.status = 'published' and v_period.status <> 'closed' then
    raise exception 'Donation cannot publish until its Giving period is closed';
  end if;

  if new.status not in ('draft', 'void')
     and (new.approved_at is null or new.approved_by is null) then
    raise exception 'Donation approval metadata is required';
  end if;

  if new.status in ('transferred', 'reconciled', 'published')
     and (
       new.transferred_at is null
       or nullif(btrim(new.internal_transfer_reference), '') is null
     ) then
    raise exception 'Transferred donation requires transfer timestamp and private transfer reference';
  end if;

  if new.status in ('reconciled', 'published')
     and (
       new.reconciled_at is null
       or new.reconciled_by is null
       or nullif(btrim(new.receipt_storage_path), '') is null
     ) then
    raise exception 'Reconciled donation requires reconciler and receipt evidence';
  end if;

  if new.status <> 'void' then
    select coalesce(sum(d.amount_inr), 0)
      into v_committed
    from janani_giving.donations d
    where d.period_id = new.period_id
      and d.status <> 'void'
      and d.id <> new.id;

    if v_committed + new.amount_inr > v_period.donation_allocation_inr then
      raise exception 'Committed donations cannot exceed the Giving period allocation';
    end if;
  end if;

  return new;
end;
$$;

create or replace function janani_giving.audit_donation_change()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
declare
  v_id uuid;
begin
  if tg_op = 'DELETE' then
    v_id := old.id;
  else
    v_id := new.id;
  end if;

  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'donation',
    v_id,
    lower(tg_op),
    case
      when tg_op = 'INSERT' then jsonb_build_object('status', new.status, 'amount_inr', new.amount_inr, 'cause', new.cause)
      when tg_op = 'UPDATE' then jsonb_build_object('old_status', old.status, 'new_status', new.status)
      else jsonb_build_object('old_status', old.status)
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function janani_giving.audit_organisation_change()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
declare
  v_id uuid;
begin
  if tg_op = 'DELETE' then
    v_id := old.id;
  else
    v_id := new.id;
  end if;

  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'organisation',
    v_id,
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

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function janani_giving.audit_period_change()
returns trigger
language plpgsql
security definer
set search_path = janani_giving, pg_temp
as $$
declare
  v_id uuid;
begin
  if tg_op = 'DELETE' then
    v_id := old.id;
  else
    v_id := new.id;
  end if;

  insert into janani_giving.audit_events(entity_type, entity_id, event_type, event_data)
  values (
    'period',
    v_id,
    lower(tg_op),
    case
      when tg_op = 'INSERT' then jsonb_build_object('status', new.status, 'donation_allocation_inr', new.donation_allocation_inr)
      when tg_op = 'UPDATE' then jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'donation_allocation_inr', new.donation_allocation_inr
      )
      else jsonb_build_object('old_status', old.status)
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists janani_giving_organisations_touch_updated_at on janani_giving.organisations;
create trigger janani_giving_organisations_touch_updated_at
before update on janani_giving.organisations
for each row execute function janani_giving.touch_updated_at();

drop trigger if exists janani_giving_periods_controls on janani_giving.periods;
create trigger janani_giving_periods_controls
before insert or update on janani_giving.periods
for each row execute function janani_giving.enforce_period_controls();

drop trigger if exists janani_giving_periods_touch_updated_at on janani_giving.periods;
create trigger janani_giving_periods_touch_updated_at
before update on janani_giving.periods
for each row execute function janani_giving.touch_updated_at();

drop trigger if exists janani_giving_donations_controls on janani_giving.donations;
create trigger janani_giving_donations_controls
before insert or update on janani_giving.donations
for each row execute function janani_giving.enforce_donation_controls();

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

drop trigger if exists janani_giving_periods_audit on janani_giving.periods;
create trigger janani_giving_periods_audit
after insert or update or delete on janani_giving.periods
for each row execute function janani_giving.audit_period_change();

-- Public callers receive a view containing exactly six approved fields.
-- donation_id, published_at, bank references, receipt paths, NGO registration
-- data, accounting data, and all Janani user/health data remain private.
drop view if exists public.public_giving_ledger;
create view public.public_giving_ledger
with (security_barrier = true)
as
select
  p.organisation_name,
  p.cause,
  p.amount_inr,
  p.transferred_at,
  'verified'::text as verification_status,
  p.public_reference
from janani_giving.publications p;

revoke all on public.public_giving_ledger from public, anon, authenticated, service_role;
grant select on public.public_giving_ledger to anon, authenticated;

create or replace function janani_giving.publish_donation(p_donation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = janani_giving, public, pg_temp
as $$
declare
  v_donation janani_giving.donations%rowtype;
  v_organisation janani_giving.organisations%rowtype;
  v_period janani_giving.periods%rowtype;
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

  if v_donation.transferred_at is null
     or v_donation.reconciled_at is null
     or v_donation.approved_at is null
     or v_donation.approved_by is null
     or v_donation.reconciled_by is null
     or nullif(btrim(v_donation.internal_transfer_reference), '') is null
     or nullif(btrim(v_donation.receipt_storage_path), '') is null then
    raise exception 'Donation approval, transfer, receipt evidence, and reconciliation must be complete before publication';
  end if;

  select * into v_period
  from janani_giving.periods
  where id = v_donation.period_id
  for share;

  if not found or v_period.status <> 'closed' then
    raise exception 'Giving period must be reviewed and closed before publication';
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
     or v_organisation.verified_at is null
     or v_organisation.verified_by is null then
    raise exception 'Organisation verification is incomplete';
  end if;

  v_public_reference :=
    'JG-' ||
    to_char(v_donation.transferred_at at time zone 'UTC', 'YYYYMM') || '-' ||
    upper(substr(replace(v_donation.id::text, '-', ''), 1, 8));

  insert into janani_giving.publications(
    donation_id,
    organisation_name,
    cause,
    amount_inr,
    transferred_at,
    public_reference,
    published_at
  ) values (
    v_donation.id,
    v_organisation.public_name,
    v_donation.cause,
    v_donation.amount_inr,
    v_donation.transferred_at,
    v_public_reference,
    now()
  )
  on conflict (donation_id) do update set
    organisation_name = excluded.organisation_name,
    cause = excluded.cause,
    amount_inr = excluded.amount_inr,
    transferred_at = excluded.transferred_at,
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
  delete from janani_giving.publications where donation_id = p_donation_id;

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
revoke all on function janani_giving.enforce_period_controls() from public, anon, authenticated;
revoke all on function janani_giving.enforce_donation_controls() from public, anon, authenticated;
revoke all on function janani_giving.audit_donation_change() from public, anon, authenticated;
revoke all on function janani_giving.audit_organisation_change() from public, anon, authenticated;
revoke all on function janani_giving.audit_period_change() from public, anon, authenticated;
revoke all on function janani_giving.publish_donation(uuid) from public, anon, authenticated;
revoke all on function janani_giving.unpublish_donation(uuid) from public, anon, authenticated;

grant execute on function janani_giving.publish_donation(uuid) to service_role;
grant execute on function janani_giving.unpublish_donation(uuid) to service_role;

commit;