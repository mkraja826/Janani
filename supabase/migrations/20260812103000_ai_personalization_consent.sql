begin;

create table if not exists public.ai_personalization_consents (
  pregnancy_id uuid primary key references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  consent_version text,
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_personalization_consents_version_check check (
    consent_version is null or consent_version = 'janani-ai-context-v1'
  ),
  constraint ai_personalization_consents_state_check check (
    (enabled = false)
    or (enabled = true and consent_version = 'janani-ai-context-v1' and consented_at is not null and revoked_at is null)
  )
);

create index if not exists ai_personalization_consents_mother_idx
  on public.ai_personalization_consents(mother_id, updated_at desc);

alter table public.ai_personalization_consents enable row level security;
revoke all on public.ai_personalization_consents from public, anon, authenticated;

drop trigger if exists ai_personalization_consents_updated_at on public.ai_personalization_consents;
create trigger ai_personalization_consents_updated_at
before update on public.ai_personalization_consents
for each row execute function public.set_updated_at();

create or replace function public.get_own_ai_personalization_consent(p_pregnancy_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_consent public.ai_personalization_consents%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if not exists (
    select 1 from public.pregnancies pregnancy
    where pregnancy.id = p_pregnancy_id and pregnancy.mother_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'AI personalization consent is available only to the mother who owns this pregnancy';
  end if;

  select * into v_consent
  from public.ai_personalization_consents consent
  where consent.pregnancy_id = p_pregnancy_id
    and consent.mother_id = v_user_id;

  return jsonb_build_object(
    'pregnancyId', p_pregnancy_id,
    'enabled', coalesce(v_consent.enabled, false),
    'consentVersion', v_consent.consent_version,
    'consentedAt', v_consent.consented_at,
    'revokedAt', v_consent.revoked_at,
    'currentConsentVersion', 'janani-ai-context-v1'
  );
end;
$function$;

create or replace function public.set_own_ai_personalization_consent(
  p_pregnancy_id uuid,
  p_enabled boolean,
  p_consent_version text default 'janani-ai-context-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_version text := btrim(coalesce(p_consent_version, ''));
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_enabled is null then
    raise exception using errcode = '22023', message = 'AI personalization consent choice is required';
  end if;
  if not exists (
    select 1 from public.pregnancies pregnancy
    where pregnancy.id = p_pregnancy_id and pregnancy.mother_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'AI personalization consent is available only to the mother who owns this pregnancy';
  end if;
  if p_enabled and v_version <> 'janani-ai-context-v1' then
    raise exception using errcode = '22023', message = 'AI personalization consent version is not supported';
  end if;

  insert into public.ai_personalization_consents(
    pregnancy_id, mother_id, enabled, consent_version, consented_at, revoked_at
  ) values (
    p_pregnancy_id,
    v_user_id,
    p_enabled,
    case when p_enabled then 'janani-ai-context-v1' else null end,
    case when p_enabled then now() else null end,
    case when p_enabled then null else now() end
  )
  on conflict (pregnancy_id) do update set
    mother_id = excluded.mother_id,
    enabled = excluded.enabled,
    consent_version = case when excluded.enabled then 'janani-ai-context-v1' else ai_personalization_consents.consent_version end,
    consented_at = case when excluded.enabled then now() else ai_personalization_consents.consented_at end,
    revoked_at = case when excluded.enabled then null else now() end,
    updated_at = now();

  return public.get_own_ai_personalization_consent(p_pregnancy_id);
end;
$function$;

create or replace function public.get_current_own_ai_personalization_consent()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select pregnancy.id
  into v_pregnancy_id
  from public.pregnancies pregnancy
  where pregnancy.mother_id = v_user_id
    and pregnancy.status in ('active'::public.pregnancy_status, 'completed'::public.pregnancy_status)
  order by
    case pregnancy.status when 'active'::public.pregnancy_status then 0 else 1 end,
    pregnancy.updated_at desc,
    pregnancy.created_at desc
  limit 1;

  if v_pregnancy_id is null then
    raise exception using errcode = 'P0002', message = 'No current mother pregnancy is available';
  end if;

  return public.get_own_ai_personalization_consent(v_pregnancy_id);
end;
$function$;

revoke all on function public.get_own_ai_personalization_consent(uuid) from public, anon;
revoke all on function public.set_own_ai_personalization_consent(uuid,boolean,text) from public, anon;
revoke all on function public.get_current_own_ai_personalization_consent() from public, anon;
grant execute on function public.get_own_ai_personalization_consent(uuid) to authenticated;
grant execute on function public.set_own_ai_personalization_consent(uuid,boolean,text) to authenticated;
grant execute on function public.get_current_own_ai_personalization_consent() to authenticated;

commit;
