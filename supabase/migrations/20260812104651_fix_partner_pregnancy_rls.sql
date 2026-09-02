begin;

create or replace function janani_private.can_view_pregnancy(
  p_pregnancy_id uuid,
  p_family_id uuid,
  p_mother_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p_mother_id = (select auth.uid())
    or (
      exists (
        select 1
        from public.family_members member
        where member.family_id = p_family_id
          and member.user_id = (select auth.uid())
          and member.role = 'partner'::public.janani_role
      )
      and coalesce((
        select context.share_pregnancy_progress_with_partner
        from public.private_care_contexts context
        where context.pregnancy_id = p_pregnancy_id
          and context.mother_id = p_mother_id
      ), true)
    );
$function$;

revoke all on function janani_private.can_view_pregnancy(uuid,uuid,uuid) from public, anon;
grant execute on function janani_private.can_view_pregnancy(uuid,uuid,uuid) to authenticated;

drop policy if exists pregnancies_select_member on public.pregnancies;
create policy pregnancies_select_member
on public.pregnancies
for select
to authenticated
using (
  janani_private.can_view_pregnancy(id, family_id, mother_id)
);

commit;