-- Vibe Coding intro survey (/vibecoding/encuesta/): anonymous rows in
-- workshop_submissions with workshop 'vibecoding' and form 'intro'.
-- Aggregates only, safe for the public survey page and the deck's live slide:
-- { session, total, counts: { question: { option: n } }, updated_at }.
-- Keep in step with summarize() in talleres/vibecoding/web/shared/encuesta.js.

create or replace function public.vc_intro_summary(p_session text default 'clase-1')
returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  with r as (
    select id, payload from public.workshop_submissions
    where workshop = 'vibecoding' and form = 'intro' and session = p_session
  ),
  single as (
    select r.id, k, r.payload ->> k as v
    from r, unnest(array['entidad', 'sector', 'rol', 'nivel', 'frecuencia', 'favorita']) as k
    where jsonb_typeof(r.payload -> k) in ('string', 'number')
  ),
  multi as (
    select distinct r.id, k, e as v
    from r, unnest(array['herramientas', 'construido', 'creadores']) as k,
      lateral jsonb_array_elements_text(
        case when jsonb_typeof(r.payload -> k) = 'array' then r.payload -> k else '[]'::jsonb end
      ) as e
  ),
  counts as (
    select k, v, count(*) as n
    from (select k, v from single union all select k, v from multi) x
    where v <> '' and char_length(v) <= 40
    group by k, v
  )
  select jsonb_build_object(
    'session', p_session,
    'total', (select count(*) from r),
    'counts', coalesce(
      (select jsonb_object_agg(k, m) from (select k, jsonb_object_agg(v, n) as m from counts group by k) y),
      '{}'::jsonb
    ),
    'updated_at', now()
  );
$$;

revoke all on function public.vc_intro_summary(text) from public;
grant execute on function public.vc_intro_summary(text) to anon, authenticated;
