-- x10 audience profiling: one row per completed /test.
-- Anonymous by design (no email, phone or IP). Ley 1581 de 2012: collect only
-- what the diagnosis needs. Inserts are public; reads are presenter-only.

create table if not exists public.x10_responses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  session         text not null default 'mci-2026' check (char_length(session) between 1 and 40),
  alias           text check (char_length(alias) <= 40),
  role            text not null check (char_length(role) between 1 and 60),
  industry        text check (char_length(industry) <= 60),
  usage_frequency text check (char_length(usage_frequency) <= 40),
  fear_level      smallint check (fear_level between 1 and 5),
  use_areas       text[] not null default '{}' check (cardinality(use_areas) <= 12),
  level           text not null check (level in ('x1', 'x2', 'x5', 'x10')),
  score           smallint not null check (score between 0 and 100),
  scores          jsonb not null default '{}'::jsonb check (pg_column_size(scores) < 2000),
  answers         jsonb not null check (pg_column_size(answers) < 8000),
  duration_ms     integer check (duration_ms between 0 and 3600000)
);

create index if not exists x10_responses_session_created_idx
  on public.x10_responses (session, created_at desc);

alter table public.x10_responses enable row level security;

-- Presenter account (dashboard login via magic link)
create or replace function public.x10_is_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'email') = 'fabiing10@gmail.com', false);
$$;

drop policy if exists "x10 anyone can submit" on public.x10_responses;
create policy "x10 anyone can submit"
  on public.x10_responses for insert
  to anon, authenticated
  with check (true);

drop policy if exists "x10 presenter reads" on public.x10_responses;
create policy "x10 presenter reads"
  on public.x10_responses for select
  to authenticated
  using (public.x10_is_admin());

drop policy if exists "x10 presenter deletes" on public.x10_responses;
create policy "x10 presenter deletes"
  on public.x10_responses for delete
  to authenticated
  using (public.x10_is_admin());

-- Aggregates only, safe for the public results slide (no row-level data).
create or replace function public.x10_summary(p_session text default 'mci-2026')
returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  with r as (
    select * from public.x10_responses where session = p_session
  )
  select jsonb_build_object(
    'session', p_session,
    'total', (select count(*) from r),
    'score_avg', (select round(avg(score)::numeric, 1) from r),
    'fear_avg', (select round(avg(fear_level)::numeric, 2) from r),
    'fear', coalesce((select jsonb_object_agg(fear_level, n) from (select fear_level, count(*) n from r where fear_level is not null group by 1) x), '{}'::jsonb),
    'level', coalesce((select jsonb_object_agg(level, n) from (select level, count(*) n from r group by 1) x), '{}'::jsonb),
    'role', coalesce((select jsonb_object_agg(role, n) from (select role, count(*) n from r group by 1) x), '{}'::jsonb),
    'industry', coalesce((select jsonb_object_agg(industry, n) from (select industry, count(*) n from r where industry is not null group by 1) x), '{}'::jsonb),
    'usage', coalesce((select jsonb_object_agg(usage_frequency, n) from (select usage_frequency, count(*) n from r where usage_frequency is not null group by 1) x), '{}'::jsonb),
    'use_areas', coalesce((select jsonb_object_agg(a, n) from (select unnest(use_areas) a, count(*) n from r group by 1) x), '{}'::jsonb),
    'updated_at', now()
  );
$$;

revoke all on function public.x10_summary(text) from public;
grant execute on function public.x10_summary(text) to anon, authenticated;

-- Live dashboard
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'x10_responses'
  ) then
    alter publication supabase_realtime add table public.x10_responses;
  end if;
end $$;
