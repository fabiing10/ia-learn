-- Platform-wide form submissions (one table for every workshop and form).
-- Example: Vibe Coding exit form → workshop 'vibecoding', form 'salida'.
-- Public insert only; the presenter reads and deletes (magic-link login).

create table if not exists public.workshop_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  workshop    text not null check (workshop ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  form        text not null check (form ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  session     text not null default 'default' check (char_length(session) between 1 and 40),
  payload     jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 8000),
  consent_at  timestamptz
);

create index if not exists workshop_submissions_lookup_idx
  on public.workshop_submissions (workshop, form, session, created_at desc);

alter table public.workshop_submissions enable row level security;

drop policy if exists "workshop anyone can submit" on public.workshop_submissions;
create policy "workshop anyone can submit"
  on public.workshop_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "workshop presenter reads" on public.workshop_submissions;
create policy "workshop presenter reads"
  on public.workshop_submissions for select
  to authenticated
  using (public.x10_is_admin());

drop policy if exists "workshop presenter deletes" on public.workshop_submissions;
create policy "workshop presenter deletes"
  on public.workshop_submissions for delete
  to authenticated
  using (public.x10_is_admin());

-- Live panel
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workshop_submissions'
  ) then
    alter publication supabase_realtime add table public.workshop_submissions;
  end if;
end $$;
