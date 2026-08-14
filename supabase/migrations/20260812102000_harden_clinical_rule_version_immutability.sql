begin;

create or replace function public.enforce_clinical_rule_version_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_expected_hash text;
begin
  if tg_op in ('UPDATE','DELETE') then
    raise exception using errcode = '55000', message = 'Clinical rule versions are immutable';
  end if;

  perform public.validate_clinical_ruleset_server(new.ruleset, new.source_manifest);
  v_expected_hash := encode(extensions.digest(convert_to(new.ruleset::text, 'UTF8'), 'sha256'), 'hex');
  if new.ruleset_hash <> v_expected_hash then
    raise exception using errcode = '22023', message = 'Clinical ruleset hash does not match its payload';
  end if;
  return new;
end;
$function$;

drop trigger if exists clinical_rule_versions_integrity on public.clinical_rule_versions;
create trigger clinical_rule_versions_integrity
before insert or update or delete on public.clinical_rule_versions
for each row execute function public.enforce_clinical_rule_version_integrity();

-- Keep the intended grants explicit as defense in depth. Supabase service-role
-- capabilities may still report broadly in introspection, so the immutable
-- trigger above remains the authoritative write guard.
revoke update, delete, truncate, references, trigger on public.clinical_rule_versions from service_role;
grant select, insert on public.clinical_rule_versions to service_role;

commit;
