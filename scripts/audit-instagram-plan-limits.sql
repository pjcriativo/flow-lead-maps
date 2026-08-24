-- Auditoria adversarial das cotas do Instagram em uma transacao sempre revertida.
-- Nao chama Apify nem persiste dados. O resultado deve retornar zero linhas.

begin;

create temporary table audit_instagram_findings (
  finding text primary key,
  details jsonb not null default '{}'::jsonb
) on commit drop;

create temporary table audit_instagram_context on commit drop as
select
  m.org_id,
  m.user_id,
  p.id as plan_id,
  p.limite_instagram_leads as leads_limit,
  p.limite_instagram_audiencia as audience_limit,
  p.limite_instagram_concorrentes as competitors_limit,
  p.limite_instagram_cacadas as hunts_limit,
  p.limite_instagram_cruzamentos as overlaps_limit,
  p.limite_instagram_enriquecimentos as enrichments_limit,
  p.limite_instagram_marcas as brands_limit,
  p.limite_mensagens as messages_limit,
  p.teto_instagram_usd as instagram_cost_limit
from public.memberships m
join public.orgs o on o.id = m.org_id
join public.planos p on p.id = o.plano_id
left join public.profiles pr on pr.id = m.user_id
where coalesce(p.has_instagram_search, false)
  and not coalesce(pr.is_super_admin, false)
limit 1;

do $$
begin
  if not exists (select 1 from audit_instagram_context) then
    raise exception 'audit_context_not_found';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- Um valor real maior que a reserva nao pode fazer a conta ultrapassar o plano.
insert into public.instagram_plan_usage(org_id, month_ref)
select org_id, date_trunc('month', now())::date from audit_instagram_context
on conflict (org_id, month_ref) do update set
  leads = 0,
  audience_profiles = 0,
  competitors = 0,
  hunts = 0,
  overlap_runs = 0,
  enrichments = 0,
  brands = 0,
  cost_usd = 0;

select public.instagram_reserve_usage(
  org_id,
  user_id,
  'codex-audit-finalize-overflow',
  'audit_reserve',
  1
)
from audit_instagram_context;

select public.instagram_finalize_usage(
  org_id,
  'codex-audit-finalize-overflow',
  'completed',
  leads_limit + 1
)
from audit_instagram_context;

insert into audit_instagram_findings(finding, details)
select 'finalize_exceeds_plan_limit', jsonb_build_object(
  'used', u.leads,
  'limit', c.leads_limit
)
from public.instagram_plan_usage u
join audit_instagram_context c on c.org_id = u.org_id
where u.month_ref = date_trunc('month', now())::date
  and u.leads > c.leads_limit;

update public.instagram_plan_usage u set leads = 0
from audit_instagram_context c
where u.org_id = c.org_id and u.month_ref = date_trunc('month', now())::date;

-- Um request_id nao pode ser reaproveitado para outra acao.
select public.instagram_reserve_usage(
  org_id,
  user_id,
  'codex-audit-request-reuse',
  'audit_action_a',
  0
)
from audit_instagram_context;

insert into audit_instagram_findings(finding, details)
select 'request_id_reused_for_different_action', result
from (
  select public.instagram_reserve_usage(
    org_id,
    user_id,
    'codex-audit-request-reuse',
    'audit_action_b',
    0
  ) as result
  from audit_instagram_context
) x
where coalesce((result->>'ok')::boolean, false);

-- Cada contador Instagram deve bloquear exatamente na fronteira do plano.
update public.instagram_plan_usage u set
  leads = c.leads_limit,
  audience_profiles = c.audience_limit,
  competitors = c.competitors_limit,
  hunts = c.hunts_limit,
  overlap_runs = c.overlaps_limit,
  enrichments = c.enrichments_limit,
  brands = c.brands_limit,
  cost_usd = c.instagram_cost_limit
from audit_instagram_context c
where u.org_id = c.org_id and u.month_ref = date_trunc('month', now())::date;

insert into audit_instagram_findings(finding, details)
select 'instagram_boundary_bypassed_' || resource, result
from audit_instagram_context c
cross join lateral (values
  ('leads', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-leads', 'audit_boundary', 1, 0, 0, 0, 0, 0, 0, 0)),
  ('audience', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-audience', 'audit_boundary', 0, 1, 0, 0, 0, 0, 0, 0)),
  ('competitors', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-competitors', 'audit_boundary', 0, 0, 1, 0, 0, 0, 0, 0)),
  ('hunts', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-hunts', 'audit_boundary', 0, 0, 0, 1, 0, 0, 0, 0)),
  ('overlaps', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-overlaps', 'audit_boundary', 0, 0, 0, 0, 1, 0, 0, 0)),
  ('enrichments', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-enrichments', 'audit_boundary', 0, 0, 0, 0, 0, 1, 0, 0)),
  ('brands', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-brands', 'audit_boundary', 0, 0, 0, 0, 0, 0, 1, 0)),
  ('cost', public.instagram_reserve_usage(c.org_id, c.user_id, 'codex-audit-boundary-cost', 'audit_boundary', 0, 0, 0, 0, 0, 0, 0, 0.0001))
) attempts(resource, result)
where coalesce((result->>'ok')::boolean, false);

-- O contador geral precisa recusar quantidades negativas e aplicar mensagens.
insert into public.consumo_org(org_id, mes_ref)
select org_id, to_char(now() at time zone 'utc', 'YYYY-MM') from audit_instagram_context
on conflict (org_id, mes_ref) do update set mensagens = 0;

alter table audit_instagram_context
  add column generic_leads_limit integer,
  add column generic_sites_limit integer,
  add column generic_campaigns_limit integer,
  add column generic_messages_limit integer;
update audit_instagram_context set
  generic_leads_limit = public.limite_plano(org_id, 'leads'),
  generic_sites_limit = public.limite_plano(org_id, 'sites'),
  generic_campaigns_limit = public.limite_plano(org_id, 'campanhas'),
  generic_messages_limit = public.limite_plano(org_id, 'mensagens');
update public.consumo_org u set
  leads = coalesce(c.generic_leads_limit, 0),
  sites = coalesce(c.generic_sites_limit, 0),
  campanhas = coalesce(c.generic_campaigns_limit, 0),
  mensagens = coalesce(c.generic_messages_limit, 0)
from audit_instagram_context c
where u.org_id = c.org_id and u.mes_ref = to_char(now() at time zone 'utc', 'YYYY-MM');

insert into audit_instagram_findings(finding, details)
select 'generic_boundary_bypassed_' || resource, result
from audit_instagram_context c
cross join lateral (values
  ('leads', c.generic_leads_limit, public.consumir_ou_bloquear(c.org_id, 'leads', 1)),
  ('sites', c.generic_sites_limit, public.consumir_ou_bloquear(c.org_id, 'sites', 1)),
  ('campanhas', c.generic_campaigns_limit, public.consumir_ou_bloquear(c.org_id, 'campanhas', 1)),
  ('mensagens', c.generic_messages_limit, public.consumir_ou_bloquear(c.org_id, 'mensagens', 1))
) attempts(resource, plan_limit, result)
where plan_limit is not null and coalesce((result->>'ok')::boolean, false);

insert into audit_instagram_findings(finding, details)
select 'messages_limit_not_enforced', result
from (
  select public.consumir_ou_bloquear(
    org_id,
    'mensagens',
    coalesce(messages_limit, 1000000) + 1
  ) as result
  from audit_instagram_context
) x
where coalesce((result->>'ok')::boolean, false)
  and (result->>'limite') is null;

insert into audit_instagram_findings(finding, details)
select 'negative_consumption_accepted', result
from (
  select public.consumir_ou_bloquear(org_id, 'leads', -1) as result
  from audit_instagram_context
) x
where coalesce((result->>'ok')::boolean, false);

-- Estoques tambem precisam ser barrados no banco, inclusive pelo service role.
update public.planos p set
  limite_whatsapp = (select count(*) from public.wa_instancias w join audit_instagram_context c on c.org_id = w.org_id),
  has_whatsapp = true,
  limite_templates = (select count(*) from public.wa_scripts w join audit_instagram_context c on c.org_id = w.org_id),
  limite_segmentos = (select count(*) from public.lead_lists l join audit_instagram_context c on c.org_id = l.org_id)
from audit_instagram_context c
where p.id = c.plan_id;

do $$
begin
  begin
    insert into public.wa_instancias(user_id, nome, status)
    select user_id, '__codex_audit_wa_limit__', 'desconectado' from audit_instagram_context;
    insert into audit_instagram_findings values (
      'whatsapp_stock_limit_bypassed', jsonb_build_object('write', 'accepted')
    );
  exception when raise_exception or check_violation then null;
  end;
  begin
    insert into public.wa_scripts(user_id, nome, tipo, mensagem)
    select user_id, '__codex_audit_template_limit__', 'texto', 'audit' from audit_instagram_context;
    insert into audit_instagram_findings values (
      'template_stock_limit_bypassed', jsonb_build_object('write', 'accepted')
    );
  exception when raise_exception or check_violation then null;
  end;
  begin
    insert into public.lead_lists(user_id, name, city, niche)
    select user_id, '__codex_audit_segment_limit__', 'audit', 'audit' from audit_instagram_context;
    insert into audit_instagram_findings values (
      'segment_stock_limit_bypassed', jsonb_build_object('write', 'accepted')
    );
  exception when raise_exception or check_violation then null;
  end;
end;
$$;

-- O catalogo de planos nunca pode aceitar cota ou teto negativo.
do $$
begin
  begin
    update public.planos p set teto_instagram_usd = -1
    from audit_instagram_context c where p.id = c.plan_id;
    insert into audit_instagram_findings values (
      'negative_plan_limit_accepted', jsonb_build_object('value', -1)
    );
  exception when check_violation then null;
  end;
end;
$$;

-- Simula um cliente autenticado gravando concorrentes diretamente na REST API.
grant select on audit_instagram_context to authenticated;
grant insert on audit_instagram_findings to authenticated;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', user_id, 'role', 'authenticated')::text,
  true
)
from audit_instagram_context;

set local role authenticated;

do $$
begin
  begin
    insert into public.instagram_competitors(org_id, user_id, username, niche)
    select org_id, user_id, '__codex_audit_direct_write__', 'auditoria'
    from audit_instagram_context;
    insert into audit_instagram_findings(finding, details)
    values ('authenticated_can_bypass_competitor_limit', jsonb_build_object('write', 'accepted'));
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.consumir_ou_bloquear(
      (select org_id from audit_instagram_context), 'leads', 1
    );
    insert into audit_instagram_findings(finding, details)
    values ('authenticated_can_mutate_consumption', jsonb_build_object('rpc', 'accepted'));
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select
  count(*)::integer as finding_count,
  coalesce(jsonb_agg(jsonb_build_object('finding', finding, 'details', details) order by finding), '[]'::jsonb) as findings
from audit_instagram_findings;

rollback;
