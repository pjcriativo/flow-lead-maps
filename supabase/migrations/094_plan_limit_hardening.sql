-- Fecha caminhos que permitiam contornar cotas pelo REST, por concorrencia ou
-- finalizando mais consumo do que foi reservado. Nenhuma API externa e chamada aqui.

-- Valores negativos transformam uma cota em credito. O banco passa a rejeita-los,
-- mesmo se algum cliente ou Edge esquecer a validacao.
alter table public.planos
  drop constraint if exists planos_limite_leads_nonnegative,
  add constraint planos_limite_leads_nonnegative check (limite_leads is null or limite_leads >= 0),
  drop constraint if exists planos_limite_sites_nonnegative,
  add constraint planos_limite_sites_nonnegative check (limite_sites is null or limite_sites >= 0),
  drop constraint if exists planos_limite_campanhas_nonnegative,
  add constraint planos_limite_campanhas_nonnegative check (limite_campanhas is null or limite_campanhas >= 0),
  drop constraint if exists planos_limite_mensagens_nonnegative,
  add constraint planos_limite_mensagens_nonnegative check (limite_mensagens is null or limite_mensagens >= 0),
  drop constraint if exists planos_limite_whatsapp_nonnegative,
  add constraint planos_limite_whatsapp_nonnegative check (limite_whatsapp is null or limite_whatsapp >= 0),
  drop constraint if exists planos_limite_templates_nonnegative,
  add constraint planos_limite_templates_nonnegative check (limite_templates is null or limite_templates >= 0),
  drop constraint if exists planos_limite_segmentos_nonnegative,
  add constraint planos_limite_segmentos_nonnegative check (limite_segmentos is null or limite_segmentos >= 0),
  drop constraint if exists planos_instagram_limits_nonnegative,
  add constraint planos_instagram_limits_nonnegative check (
    limite_instagram_leads >= 0 and limite_instagram_audiencia >= 0
    and limite_instagram_concorrentes >= 0 and limite_instagram_cacadas >= 0
    and limite_instagram_cruzamentos >= 0 and limite_instagram_enriquecimentos >= 0
    and limite_instagram_marcas >= 0 and teto_instagram_usd >= 0
  );

alter table public.orgs
  drop constraint if exists orgs_limite_leads_override_nonnegative,
  add constraint orgs_limite_leads_override_nonnegative
    check (limite_leads_override is null or limite_leads_override >= 0),
  drop constraint if exists orgs_limite_sites_override_nonnegative,
  add constraint orgs_limite_sites_override_nonnegative
    check (limite_sites_override is null or limite_sites_override >= 0),
  drop constraint if exists orgs_sites_bonus_nonnegative,
  add constraint orgs_sites_bonus_nonnegative check (sites_bonus >= 0);

-- Mensagens tinham contador, mas o mapeamento devolvia NULL e as tratava como ilimitadas.
create or replace function public._col_limite(p_recurso text)
returns text language sql immutable set search_path = public as $$
  select case p_recurso
    when 'leads' then 'limite_leads'
    when 'sites' then 'limite_sites'
    when 'campanhas' then 'limite_campanhas'
    when 'mensagens' then 'limite_mensagens'
    else null end
$$;

-- Reserva atomica: cria a linha mensal, bloqueia-a e so entao confere/incrementa.
-- p_n <= 0 e recusado para impedir que o cliente reduza o proprio consumo.
create or replace function public.consumir_ou_bloquear(
  p_org uuid,
  p_recurso text,
  p_n integer default 1
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mes text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_col text := public._col_consumo(p_recurso);
  v_lim integer := public.limite_plano(p_org, p_recurso);
  v_usado integer;
begin
  if p_n is null or p_n <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'quantidade_invalida');
  end if;
  if v_col is null then
    return jsonb_build_object('ok', false, 'reason', 'recurso_invalido');
  end if;
  if not exists (select 1 from public.orgs where id = p_org) then
    return jsonb_build_object('ok', false, 'reason', 'org_invalida');
  end if;

  insert into public.consumo_org(org_id, mes_ref)
  values (p_org, v_mes)
  on conflict (org_id, mes_ref) do nothing;

  execute format(
    'select %I from public.consumo_org where org_id=$1 and mes_ref=$2 for update',
    v_col
  ) into v_usado using p_org, v_mes;

  if v_lim is not null and v_usado + p_n > v_lim then
    return jsonb_build_object(
      'ok', false, 'reason', 'limite_atingido', 'recurso', p_recurso,
      'usado', v_usado, 'limite', v_lim, 'restante', greatest(0, v_lim - v_usado)
    );
  end if;

  execute format(
    'update public.consumo_org set %I = %I + $3, atualizado_em = now() where org_id=$1 and mes_ref=$2',
    v_col, v_col
  ) using p_org, v_mes, p_n;

  return jsonb_build_object(
    'ok', true, 'recurso', p_recurso, 'usado', v_usado + p_n, 'limite', v_lim,
    'restante', case when v_lim is null then null else greatest(0, v_lim - (v_usado + p_n)) end,
    'perto', v_lim is not null and (v_usado + p_n) >= (0.8 * v_lim)
  );
end;
$$;

revoke all on function public.consumir_ou_bloquear(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consumir_ou_bloquear(uuid, text, integer) to service_role;
revoke all on function public.estado_consumo(uuid, text) from public, anon, authenticated;
grant execute on function public.estado_consumo(uuid, text) to service_role;
revoke all on function public.limite_plano(uuid, text) from public, anon, authenticated;
grant execute on function public.limite_plano(uuid, text) to service_role;

-- Limites de estoque sao aplicados no banco porque chips, templates e segmentos
-- podem nascer por caminhos diferentes. O advisory lock fecha a corrida entre inserts.
create or replace function public.aplicar_limite_estoque_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := coalesce(new.org_id, public.org_do_usuario(new.user_id));
  v_limit integer;
  v_used integer;
  v_resource text := tg_argv[0];
begin
  if v_org is null then raise exception 'organizacao_nao_encontrada'; end if;
  if exists (
    select 1 from public.orgs o join public.profiles p on p.id = o.dono_user_id
    where o.id = v_org and coalesce(p.is_super_admin, false)
  ) then
    new.org_id := v_org;
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_resource || ':' || v_org::text, 0));

  if v_resource = 'whatsapp' then
    select p.limite_whatsapp
      into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id
    where o.id = v_org;
    select count(*) into v_used from public.wa_instancias where org_id = v_org;
  elsif v_resource = 'templates' then
    select p.limite_templates into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = v_org;
    select count(*) into v_used from public.wa_scripts where org_id = v_org;
  elsif v_resource = 'segmentos' then
    select p.limite_segmentos into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = v_org;
    select count(*) into v_used from public.lead_lists where org_id = v_org;
  else
    raise exception 'recurso_de_estoque_invalido';
  end if;

  if v_limit is not null and v_used + 1 > v_limit then
    raise exception 'Limite de % do plano atingido: %/%', v_resource, v_used, v_limit;
  end if;
  new.org_id := v_org;
  return new;
end;
$$;

drop trigger if exists trg_z_limite_plano_whatsapp on public.wa_instancias;
create trigger trg_z_limite_plano_whatsapp before insert on public.wa_instancias
for each row execute function public.aplicar_limite_estoque_plano('whatsapp');
drop trigger if exists trg_z_limite_plano_templates on public.wa_scripts;
create trigger trg_z_limite_plano_templates before insert on public.wa_scripts
for each row execute function public.aplicar_limite_estoque_plano('templates');
drop trigger if exists trg_z_limite_plano_segmentos on public.lead_lists;
create trigger trg_z_limite_plano_segmentos before insert on public.lead_lists
for each row execute function public.aplicar_limite_estoque_plano('segmentos');

-- Tabelas alimentadas por Edge/service role ficam somente leitura para clientes.
drop policy if exists instagram_competitors_all on public.instagram_competitors;
drop policy if exists instagram_competitors_select on public.instagram_competitors;
create policy instagram_competitors_select on public.instagram_competitors for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
drop policy if exists instagram_sources_all on public.instagram_sources;
drop policy if exists instagram_sources_select on public.instagram_sources;
create policy instagram_sources_select on public.instagram_sources for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
drop policy if exists instagram_opportunities_all on public.instagram_opportunities;
drop policy if exists instagram_opportunities_select on public.instagram_opportunities;
create policy instagram_opportunities_select on public.instagram_opportunities for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

revoke all on public.instagram_competitors, public.instagram_sources,
  public.instagram_opportunities, public.instagram_plan_usage,
  public.instagram_usage_reservations from anon, authenticated;
grant select on public.instagram_competitors, public.instagram_sources,
  public.instagram_opportunities, public.instagram_plan_usage,
  public.instagram_usage_reservations to authenticated;

-- Logs financeiros sao prova do servidor, nao um endpoint de escrita do cliente.
drop policy if exists "Usuários autenticados podem inserir logs de consumo" on public.api_consumption_logs;
revoke select, references, trigger on public.api_consumption_logs from anon;
revoke references, trigger on public.api_consumption_logs from authenticated;
revoke insert, update, delete, truncate on public.api_consumption_logs from authenticated;

create or replace function public.instagram_reserve_usage(
  p_org uuid,
  p_user uuid,
  p_request_id text,
  p_action text,
  p_leads integer default 0,
  p_audience_profiles integer default 0,
  p_competitors integer default 0,
  p_hunts integer default 0,
  p_overlaps integer default 0,
  p_enrichments integer default 0,
  p_brands integer default 0,
  p_cost_usd numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.planos%rowtype;
  v_usage public.instagram_plan_usage%rowtype;
  v_existing public.instagram_usage_reservations%rowtype;
  v_month date := date_trunc('month', now())::date;
  v_reserved jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.eh_super_admin() then
    raise exception 'forbidden';
  end if;
  if coalesce(trim(p_request_id), '') = '' then raise exception 'request_id_required'; end if;
  if coalesce(trim(p_action), '') = '' then raise exception 'action_required'; end if;
  if p_user is null or not exists (
    select 1 from public.memberships where org_id = p_org and user_id = p_user
  ) then raise exception 'membership_required'; end if;

  select * into v_existing from public.instagram_usage_reservations
  where org_id = p_org and request_id = p_request_id;
  if v_existing.id is not null then
    if v_existing.user_id is distinct from p_user or v_existing.action is distinct from p_action then
      return jsonb_build_object('ok', false, 'reason', 'request_id_conflict');
    end if;
    if v_existing.status <> 'reserved' then
      return jsonb_build_object('ok', false, 'reason', 'request_already_finalized');
    end if;
    return jsonb_build_object('ok', true, 'idempotent', true,
      'reservationId', v_existing.id, 'status', public.instagram_plan_status(p_org));
  end if;

  select p.* into v_plan from public.planos p
  join public.orgs o on o.plano_id = p.id where o.id = p_org;
  if v_plan.id is null or not coalesce(v_plan.has_instagram_search, false) then
    return jsonb_build_object('ok', false, 'reason', 'feature_not_in_plan');
  end if;
  insert into public.instagram_plan_usage(org_id, month_ref) values (p_org, v_month)
  on conflict (org_id, month_ref) do nothing;
  select * into v_usage from public.instagram_plan_usage
  where org_id = p_org and month_ref = v_month for update;

  if v_usage.leads + greatest(p_leads, 0) > v_plan.limite_instagram_leads then return jsonb_build_object('ok', false, 'reason', 'leads_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.audience_profiles + greatest(p_audience_profiles, 0) > v_plan.limite_instagram_audiencia then return jsonb_build_object('ok', false, 'reason', 'audience_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.competitors + greatest(p_competitors, 0) > v_plan.limite_instagram_concorrentes then return jsonb_build_object('ok', false, 'reason', 'competitors_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.hunts + greatest(p_hunts, 0) > v_plan.limite_instagram_cacadas then return jsonb_build_object('ok', false, 'reason', 'hunts_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.overlap_runs + greatest(p_overlaps, 0) > v_plan.limite_instagram_cruzamentos then return jsonb_build_object('ok', false, 'reason', 'overlap_not_in_plan', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.enrichments + greatest(p_enrichments, 0) > v_plan.limite_instagram_enriquecimentos then return jsonb_build_object('ok', false, 'reason', 'enrichments_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.brands + greatest(p_brands, 0) > v_plan.limite_instagram_marcas then return jsonb_build_object('ok', false, 'reason', 'brands_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.cost_usd + greatest(p_cost_usd, 0) > v_plan.teto_instagram_usd then return jsonb_build_object('ok', false, 'reason', 'cost_limit', 'status', public.instagram_plan_status(p_org)); end if;

  v_reserved := jsonb_build_object(
    'leads', greatest(p_leads, 0), 'audienceProfiles', greatest(p_audience_profiles, 0),
    'competitors', greatest(p_competitors, 0), 'hunts', greatest(p_hunts, 0),
    'overlaps', greatest(p_overlaps, 0), 'enrichments', greatest(p_enrichments, 0),
    'brands', greatest(p_brands, 0), 'monthlyCostUsd', greatest(p_cost_usd, 0)
  );
  update public.instagram_plan_usage set
    leads = leads + greatest(p_leads, 0),
    audience_profiles = audience_profiles + greatest(p_audience_profiles, 0),
    competitors = competitors + greatest(p_competitors, 0),
    hunts = hunts + greatest(p_hunts, 0),
    overlap_runs = overlap_runs + greatest(p_overlaps, 0),
    enrichments = enrichments + greatest(p_enrichments, 0),
    brands = brands + greatest(p_brands, 0),
    cost_usd = cost_usd + greatest(p_cost_usd, 0), updated_at = now()
  where org_id = p_org and month_ref = v_month;
  insert into public.instagram_usage_reservations(org_id, user_id, request_id, action, month_ref, reserved)
  values (p_org, p_user, p_request_id, p_action, v_month, v_reserved)
  returning * into v_existing;
  return jsonb_build_object('ok', true, 'idempotent', false,
    'reservationId', v_existing.id, 'status', public.instagram_plan_status(p_org));
end;
$$;

create or replace function public.instagram_finalize_usage(
  p_org uuid,
  p_request_id text,
  p_status text,
  p_leads integer default 0,
  p_audience_profiles integer default 0,
  p_competitors integer default 0,
  p_hunts integer default 0,
  p_overlaps integer default 0,
  p_enrichments integer default 0,
  p_brands integer default 0,
  p_cost_usd numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.instagram_usage_reservations%rowtype;
  v_actual jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.eh_super_admin() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('completed', 'failed') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;
  select * into v_res from public.instagram_usage_reservations
  where org_id = p_org and request_id = p_request_id for update;
  if v_res.id is null then return jsonb_build_object('ok', false, 'reason', 'reservation_not_found'); end if;
  if v_res.status <> 'reserved' then return jsonb_build_object('ok', true, 'idempotent', true); end if;

  if greatest(p_leads, 0) > coalesce((v_res.reserved->>'leads')::int, 0)
    or greatest(p_audience_profiles, 0) > coalesce((v_res.reserved->>'audienceProfiles')::int, 0)
    or greatest(p_competitors, 0) > coalesce((v_res.reserved->>'competitors')::int, 0)
    or greatest(p_hunts, 0) > coalesce((v_res.reserved->>'hunts')::int, 0)
    or greatest(p_overlaps, 0) > coalesce((v_res.reserved->>'overlaps')::int, 0)
    or greatest(p_enrichments, 0) > coalesce((v_res.reserved->>'enrichments')::int, 0)
    or greatest(p_brands, 0) > coalesce((v_res.reserved->>'brands')::int, 0)
    or greatest(p_cost_usd, 0) > coalesce((v_res.reserved->>'monthlyCostUsd')::numeric, 0)
  then
    return jsonb_build_object('ok', false, 'reason', 'actual_exceeds_reservation');
  end if;

  v_actual := jsonb_build_object(
    'leads', greatest(p_leads, 0), 'audienceProfiles', greatest(p_audience_profiles, 0),
    'competitors', greatest(p_competitors, 0), 'hunts', greatest(p_hunts, 0),
    'overlaps', greatest(p_overlaps, 0), 'enrichments', greatest(p_enrichments, 0),
    'brands', greatest(p_brands, 0), 'monthlyCostUsd', greatest(p_cost_usd, 0)
  );
  update public.instagram_plan_usage set
    leads = greatest(0, leads - (v_res.reserved->>'leads')::int + greatest(p_leads, 0)),
    audience_profiles = greatest(0, audience_profiles - (v_res.reserved->>'audienceProfiles')::int + greatest(p_audience_profiles, 0)),
    competitors = greatest(0, competitors - (v_res.reserved->>'competitors')::int + greatest(p_competitors, 0)),
    hunts = greatest(0, hunts - (v_res.reserved->>'hunts')::int + greatest(p_hunts, 0)),
    overlap_runs = greatest(0, overlap_runs - (v_res.reserved->>'overlaps')::int + greatest(p_overlaps, 0)),
    enrichments = greatest(0, enrichments - (v_res.reserved->>'enrichments')::int + greatest(p_enrichments, 0)),
    brands = greatest(0, brands - (v_res.reserved->>'brands')::int + greatest(p_brands, 0)),
    cost_usd = greatest(0, cost_usd - (v_res.reserved->>'monthlyCostUsd')::numeric + greatest(p_cost_usd, 0)),
    updated_at = now()
  where org_id = p_org and month_ref = v_res.month_ref;
  update public.instagram_usage_reservations set actual = v_actual,
    status = p_status, finalized_at = now() where id = v_res.id;
  return jsonb_build_object('ok', true, 'status', public.instagram_plan_status(p_org));
end;
$$;

revoke all on function public.instagram_reserve_usage(uuid, uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) from public, anon, authenticated;
revoke all on function public.instagram_finalize_usage(uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.instagram_reserve_usage(uuid, uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) to service_role;
grant execute on function public.instagram_finalize_usage(uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) to service_role;
