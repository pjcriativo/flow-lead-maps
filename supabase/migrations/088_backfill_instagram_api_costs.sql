-- Centraliza no livro-caixa de APIs os custos reais que os fluxos novos do Instagram
-- já guardavam em instagram_discovery_jobs. A chave (service, external_id) torna o
-- backfill idempotente e evita duplicação com os lançamentos feitos pela Edge.
insert into public.api_consumption_logs (
  org_id,
  user_id,
  service,
  action,
  external_id,
  quantity,
  cost_usd,
  cost_brl,
  metadata,
  created_at
)
select
  job.org_id,
  job.user_id,
  'apify_instagram',
  case
    when job.mode = 'competitors' then 'competitor_monitor'
    when job.mode = 'comments' then 'comments_hunter'
    else 'content_discovery_' || job.mode
  end,
  job.id::text,
  1,
  job.actual_cost_usd,
  job.actual_cost_usd * 5.6,
  jsonb_build_object(
    'source', 'instagram_discovery_jobs',
    'job_id', job.id,
    'job_status', job.status,
    'cost_source', 'apify_run_actual_cost',
    'backfilled', true
  ),
  job.created_at
from public.instagram_discovery_jobs job
where job.actual_cost_usd > 0
on conflict (service, external_id) do update
set org_id = excluded.org_id,
    user_id = excluded.user_id,
    action = excluded.action,
    cost_usd = excluded.cost_usd,
    cost_brl = excluded.cost_brl,
    metadata = api_consumption_logs.metadata || excluded.metadata;
