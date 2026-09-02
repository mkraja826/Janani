begin;

create or replace function janani_private.broadcast_user_invalidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_mother_id uuid;
begin
  if tg_op = 'DELETE' then
    v_mother_id := old.mother_id;
  else
    v_mother_id := new.mother_id;
  end if;

  if v_mother_id is not null then
    perform realtime.send(
      jsonb_build_object('entity', tg_table_name),
      'invalidate',
      'janani-user:' || v_mother_id::text,
      true
    );
  end if;

  return null;
end;
$function$;

revoke all on function janani_private.broadcast_user_invalidation() from public, anon, authenticated;

drop policy if exists "janani users receive private invalidations" on realtime.messages;
create policy "janani users receive private invalidations"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) = 'janani-user:' || (select auth.uid())::text
);

do $block$
declare
  v_table text;
begin
  foreach v_table in array array[
    'health_profiles',
    'health_conditions',
    'care_medications',
    'care_appointments',
    'weight_entries',
    'blood_pressure_entries',
    'glucose_entries',
    'symptom_entries',
    'lab_results',
    'private_care_contexts',
    'medical_reports',
    'medical_report_facts',
    'ai_personalization_consents'
  ]::text[]
  loop
    execute format('drop trigger if exists broadcast_user_invalidation on public.%I', v_table);
    execute format(
      'create trigger broadcast_user_invalidation after insert or update or delete on public.%I for each row execute function janani_private.broadcast_user_invalidation()',
      v_table
    );
  end loop;
end;
$block$;

commit;