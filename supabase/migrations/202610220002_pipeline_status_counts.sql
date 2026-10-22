-- Pipeline Kanban: contagem de leads por status em UMA passada, respeitando os mesmos filtros da tela.
-- SECURITY INVOKER: a RLS de `leads` (organização, papel e atribuição) continua decidindo o que
-- cada usuário enxerga; esta função só agrupa o que ele já pode ver. Substitui seis contagens
-- separadas (uma por etapa), cada uma varrendo a tabela inteira sob RLS.
create or replace function public.pipeline_status_counts(
  p_search text default null,
  p_channel text default 'all',
  p_responsible text default 'all',
  p_score text default 'all',
  p_created_from timestamptz default null,
  p_created_to timestamptz default null
)
returns table (status text, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select l.status, count(*)::bigint
  from public.leads l
  where (
      coalesce(btrim(p_search), '') = ''
      or l.business_name ilike '%' || btrim(p_search) || '%'
      or l.owner_name ilike '%' || btrim(p_search) || '%'
      or l.phone ilike '%' || btrim(p_search) || '%'
      or l.email ilike '%' || btrim(p_search) || '%'
      or l.website ilike '%' || btrim(p_search) || '%'
    )
    and (
      p_channel = 'all'
      or (p_channel in ('instagram', 'linkedin') and l.origem_fonte = p_channel)
      or (
        p_channel = 'maps'
        and (
          l.origem_fonte = 'google_maps'
          or (
            l.place_id is not null
            and (l.origem_fonte is null or l.origem_fonte not in ('instagram', 'linkedin'))
          )
        )
      )
      or (
        p_channel = 'manual'
        and l.place_id is null
        and (l.origem_fonte is null or l.origem_fonte not in ('instagram', 'linkedin', 'google_maps'))
      )
    )
    and (
      p_responsible = 'all'
      or (p_responsible = 'none' and l.assigned_to is null)
      or l.assigned_to::text = p_responsible
    )
    and (
      p_score = 'all'
      or (p_score = 'high' and l.score >= 80)
      or (p_score = 'medium' and l.score >= 70 and l.score < 80)
      or (p_score = 'qualification' and l.score < 70)
    )
    and (p_created_from is null or l.created_at >= p_created_from)
    and (p_created_to is null or l.created_at <= p_created_to)
  group by l.status
$$;

revoke all on function public.pipeline_status_counts(text, text, text, text, timestamptz, timestamptz)
  from public, anon;
grant execute on function public.pipeline_status_counts(text, text, text, text, timestamptz, timestamptz)
  to authenticated;
