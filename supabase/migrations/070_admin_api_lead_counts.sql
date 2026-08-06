-- O painel de consumo precisa distinguir leads gerados no filtro selecionado do uso mensal
-- do plano. A agregação acontece no PostgreSQL para não depender do limite de 1.000 linhas
-- da API REST quando a plataforma crescer.

drop function if exists public.admin_api_lead_counts(timestamptz);

create function public.admin_api_lead_counts(p_since timestamptz)
returns table (
  user_id uuid,
  leads_period bigint,
  leads_month bigint,
  apify_leads_period bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    count(l.id) filter (where l.created_at >= p_since) as leads_period,
    count(l.id) filter (
      where l.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    ) as leads_month,
    count(l.id) filter (
      where l.created_at >= p_since and l.place_id like 'apify:%'
    ) as apify_leads_period
  from public.profiles p
  left join public.leads l on l.user_id = p.id
  group by p.id
$$;

revoke all on function public.admin_api_lead_counts(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_api_lead_counts(timestamptz) to service_role;

-- Corrige contadores legados sem apagar consumo já registrado (leads excluídos continuam sendo
-- uso do plano). Os registros ainda existentes são o piso verificável do consumo do mês.
insert into public.consumo_org (org_id, mes_ref, leads, atualizado_em)
select
  o.id,
  to_char(now() at time zone 'utc', 'YYYY-MM'),
  count(l.id)::integer,
  now()
from public.orgs o
join public.leads l on l.org_id = o.id
where l.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
group by o.id
on conflict (org_id, mes_ref) do update
set leads = greatest(public.consumo_org.leads, excluded.leads),
    atualizado_em = now();
