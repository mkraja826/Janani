create extension if not exists pgcrypto;

create type public.janani_role as enum ('mother','partner','caregiver');
create type public.pregnancy_status as enum ('active','completed','paused');
create type public.reminder_kind as enum ('medication','appointment','hydration','nutrition','custom');
create type public.reminder_state as enum ('pending','taken','skipped','missed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  preferred_language text not null default 'en',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Family',
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.janani_role not null,
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  due_date date not null,
  last_menstrual_period date,
  pre_pregnancy_weight_kg numeric(5,2),
  height_cm numeric(5,2),
  status public.pregnancy_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_height check (height_cm is null or height_cm between 80 and 250),
  constraint valid_weight check (pre_pregnancy_weight_kg is null or pre_pregnancy_weight_kg between 20 and 300)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  instructions text,
  kind public.reminder_kind not null default 'custom',
  start_date date not null,
  end_date date,
  local_time time not null,
  days_of_week smallint[] not null default array[0,1,2,3,4,5,6],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_date_range check (end_date is null or end_date >= start_date)
);

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  scheduled_for timestamptz not null,
  state public.reminder_state not null default 'pending',
  acted_by uuid references public.profiles(id) on delete set null,
  acted_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique(reminder_id, scheduled_for)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  mood smallint,
  photo_paths text[] not null default '{}',
  is_shared_with_partner boolean not null default true,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_mood check (mood is null or mood between 1 and 5)
);

create table public.partner_nudges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default 'Thinking of you',
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sender_not_recipient check (sender_id <> recipient_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger pregnancies_updated_at before update on public.pregnancies for each row execute function public.set_updated_at();
create trigger reminders_updated_at before update on public.reminders for each row execute function public.set_updated_at();
create trigger journal_entries_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_family_member(target_family_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.family_members fm where fm.family_id = target_family_id and fm.user_id = auth.uid());
$$;

create or replace function public.can_access_pregnancy(target_pregnancy_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.pregnancies p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = target_pregnancy_id and fm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.pregnancies enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.journal_entries enable row level security;
alter table public.partner_nudges enable row level security;

create policy profiles_select on public.profiles for select using (id = auth.uid() or exists(select 1 from public.family_members me join public.family_members them on them.family_id = me.family_id where me.user_id = auth.uid() and them.user_id = profiles.id));
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy families_select on public.families for select using (public.is_family_member(id) or created_by = auth.uid());
create policy families_insert on public.families for insert with check (created_by = auth.uid());
create policy families_update on public.families for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy family_members_select on public.family_members for select using (public.is_family_member(family_id));
create policy family_members_insert on public.family_members for insert with check (user_id = auth.uid() or exists(select 1 from public.families f where f.id = family_id and f.created_by = auth.uid()));
create policy family_members_delete on public.family_members for delete using (user_id = auth.uid() or exists(select 1 from public.families f where f.id = family_id and f.created_by = auth.uid()));

create policy pregnancies_all_select on public.pregnancies for select using (public.is_family_member(family_id));
create policy pregnancies_insert on public.pregnancies for insert with check (mother_id = auth.uid() and public.is_family_member(family_id));
create policy pregnancies_update on public.pregnancies for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy reminders_select on public.reminders for select using (public.can_access_pregnancy(pregnancy_id));
create policy reminders_insert on public.reminders for insert with check (created_by = auth.uid() and public.can_access_pregnancy(pregnancy_id));
create policy reminders_update on public.reminders for update using (public.can_access_pregnancy(pregnancy_id)) with check (public.can_access_pregnancy(pregnancy_id));
create policy reminders_delete on public.reminders for delete using (created_by = auth.uid() and public.can_access_pregnancy(pregnancy_id));

create policy reminder_logs_select on public.reminder_logs for select using (exists(select 1 from public.reminders r where r.id = reminder_id and public.can_access_pregnancy(r.pregnancy_id)));
create policy reminder_logs_insert on public.reminder_logs for insert with check (exists(select 1 from public.reminders r where r.id = reminder_id and public.can_access_pregnancy(r.pregnancy_id)));
create policy reminder_logs_update on public.reminder_logs for update using (exists(select 1 from public.reminders r where r.id = reminder_id and public.can_access_pregnancy(r.pregnancy_id)));

create policy journal_select on public.journal_entries for select using (author_id = auth.uid() or (is_shared_with_partner and public.can_access_pregnancy(pregnancy_id)));
create policy journal_insert on public.journal_entries for insert with check (author_id = auth.uid() and public.can_access_pregnancy(pregnancy_id));
create policy journal_update on public.journal_entries for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy journal_delete on public.journal_entries for delete using (author_id = auth.uid());

create policy nudges_select on public.partner_nudges for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy nudges_insert on public.partner_nudges for insert with check (sender_id = auth.uid() and public.is_family_member(family_id));
create policy nudges_update on public.partner_nudges for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create index family_members_user_idx on public.family_members(user_id);
create index pregnancies_family_idx on public.pregnancies(family_id);
create index reminders_pregnancy_idx on public.reminders(pregnancy_id);
create index reminder_logs_due_idx on public.reminder_logs(scheduled_for, state);
create index journal_entries_pregnancy_date_idx on public.journal_entries(pregnancy_id, entry_date desc);
create index partner_nudges_recipient_idx on public.partner_nudges(recipient_id, created_at desc);
