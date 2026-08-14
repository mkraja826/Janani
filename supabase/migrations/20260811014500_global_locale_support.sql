begin;

alter table public.private_care_contexts
  drop constraint if exists private_care_contexts_preferred_language_check;

alter table public.private_care_contexts
  add constraint private_care_contexts_preferred_language_format_check
  check (
    char_length(preferred_language) between 2 and 35
    and preferred_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  );

create or replace function public.save_own_private_care_context(p_pregnancy_id uuid, p_context jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.private_care_contexts%rowtype;
  v_language text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user) then
    raise exception 'Private care context is available only to the mother who owns this pregnancy';
  end if;

  v_language := left(btrim(coalesce(p_context->>'preferred_language','en')),35);
  if v_language !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then
    v_language := 'en';
  end if;

  insert into public.private_care_contexts(
    pregnancy_id,mother_id,preferred_language,region_preference,broader_clinician_instructions,
    relevant_medical_history,previous_pregnancy_history,share_care_timeline_with_partner,
    share_pregnancy_progress_with_partner
  ) values (
    p_pregnancy_id,v_user,v_language,
    nullif(left(btrim(coalesce(p_context->>'region_preference','')),120),''),
    nullif(left(btrim(coalesce(p_context->>'broader_clinician_instructions','')),4000),''),
    nullif(left(btrim(coalesce(p_context->>'relevant_medical_history','')),4000),''),
    nullif(left(btrim(coalesce(p_context->>'previous_pregnancy_history','')),4000),''),
    coalesce((p_context->>'share_care_timeline_with_partner')::boolean,false),
    coalesce((p_context->>'share_pregnancy_progress_with_partner')::boolean,true)
  )
  on conflict (pregnancy_id) do update set
    preferred_language = excluded.preferred_language,
    region_preference = excluded.region_preference,
    broader_clinician_instructions = excluded.broader_clinician_instructions,
    relevant_medical_history = excluded.relevant_medical_history,
    previous_pregnancy_history = excluded.previous_pregnancy_history,
    share_care_timeline_with_partner = excluded.share_care_timeline_with_partner,
    share_pregnancy_progress_with_partner = excluded.share_pregnancy_progress_with_partner,
    updated_at = now()
  where public.private_care_contexts.mother_id = v_user
  returning * into v_row;

  return public.get_own_private_care_context(p_pregnancy_id);
end;
$$;

revoke all on function public.save_own_private_care_context(uuid,jsonb) from public;
grant execute on function public.save_own_private_care_context(uuid,jsonb) to authenticated;

commit;
