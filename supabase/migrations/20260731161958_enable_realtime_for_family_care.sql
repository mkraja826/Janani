do $$
begin
  begin alter publication supabase_realtime add table public.reminders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reminder_logs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.journal_entries; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.partner_nudges; exception when duplicate_object then null; end;
end $$;
