-- The test now asks for an email (with explicit consent, Ley 1581 de 2012).
-- Still readable only by the presenter (existing RLS); never in x10_summary.
alter table public.x10_responses
  add column if not exists email text
    check (email is null or (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  add column if not exists consent_at timestamptz;

alter table public.x10_responses
  drop constraint if exists x10_email_needs_consent;
alter table public.x10_responses
  add constraint x10_email_needs_consent check (email is null or consent_at is not null);
