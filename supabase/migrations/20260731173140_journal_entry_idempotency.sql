alter table public.journal_entries
  add column if not exists client_mutation_id uuid;

create unique index if not exists journal_entries_author_client_mutation_uidx
  on public.journal_entries (author_id, client_mutation_id)
  where client_mutation_id is not null;

create or replace function public.save_journal_entry_idempotent(
  p_client_mutation_id uuid,
  p_pregnancy_id uuid,
  p_title text,
  p_body text,
  p_mood integer,
  p_is_shared_with_partner boolean,
  p_entry_date date
)
returns public.journal_entries
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_entry public.journal_entries;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_entry
  from public.journal_entries
  where author_id = auth.uid()
    and client_mutation_id = p_client_mutation_id;

  if found then
    return v_entry;
  end if;

  insert into public.journal_entries (
    pregnancy_id,
    author_id,
    title,
    body,
    mood,
    is_shared_with_partner,
    entry_date,
    client_mutation_id
  ) values (
    p_pregnancy_id,
    auth.uid(),
    nullif(trim(p_title), ''),
    trim(p_body),
    p_mood,
    coalesce(p_is_shared_with_partner, false),
    p_entry_date,
    p_client_mutation_id
  )
  returning * into v_entry;

  return v_entry;
end;
$$;

grant execute on function public.save_journal_entry_idempotent(uuid, uuid, text, text, integer, boolean, date) to authenticated;
revoke execute on function public.save_journal_entry_idempotent(uuid, uuid, text, text, integer, boolean, date) from anon;
