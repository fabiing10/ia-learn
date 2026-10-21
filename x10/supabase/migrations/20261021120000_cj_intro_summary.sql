-- Cerebro Jurídico intro survey (/cerebro/encuesta/): rows in
-- workshop_submissions with workshop 'cerebro' and form 'intro'. The payload
-- carries the person's name and email (consent_at is set when they send);
-- those two keys are deliberately absent from the lists below, so this
-- function can be public: it returns counts per option and nothing else.
-- { session, total, counts: { question: { option: n } }, updated_at }.
-- Keep in step with summarize() in talleres/cerebro/web/shared/encuesta.js.

create or replace function public.cj_intro_summary(p_session text default 'javeriana-2026-10-21')
returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  with r as (
    select id, payload from public.workshop_submissions
    where workshop = 'cerebro' and form = 'intro' and session = p_session
  ),
  single as (
    select r.id, k, r.payload ->> k as v
    from r, unnest(array['rol', 'favorita', 'plan', 'frecuencia', 'proyectos', 'skill', 'entrena', 'alucino']) as k
    where jsonb_typeof(r.payload -> k) = 'string'
  ),
  multi as (
    select distinct r.id, k, e as v
    from r, unnest(array['herramientas', 'usos']) as k,
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

revoke all on function public.cj_intro_summary(text) from public;
grant execute on function public.cj_intro_summary(text) to anon, authenticated;
