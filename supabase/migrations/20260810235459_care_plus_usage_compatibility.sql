begin;

-- Compatibility shim for staging/development databases that may already have
-- the earlier Care+ gateway table. Fresh production databases simply skip it.
alter table if exists public.ai_generations
  add column if not exists reserved_input_tokens integer not null default 0,
  add column if not exists reserved_output_tokens integer not null default 0;

commit;
