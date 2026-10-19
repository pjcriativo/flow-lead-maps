-- Corrige o trigger multi-tabela sem alterar suas regras de isolamento.
-- Campos específicos são lidos do registro como JSONB para não acessar colunas inexistentes.

begin;

create or replace function public.wa_validate_resource_tenant()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_org uuid := nullif(v_new->>'org_id', '')::uuid;
  v_campaign uuid := nullif(v_new->>'campanha_id', '')::uuid;
  v_recipe uuid := nullif(v_new->>'receita_id', '')::uuid;
  v_instance uuid := nullif(v_new->>'instancia_id', '')::uuid;
  v_lead uuid := nullif(v_new->>'lead_id', '')::uuid;
  v_proposal uuid := nullif(v_new->>'proposta_id', '')::uuid;
  v_list uuid := nullif(v_new->>'list_id', '')::uuid;
begin
  -- Tabelas compartilhadas continuam com o comportamento dos demais canais.
  if tg_table_name = 'campanhas' and (v_new->>'canal') <> 'whatsapp' then
    return new;
  elsif tg_table_name = 'campanha_leads'
    and not public.wa_campaign_is_whatsapp(v_campaign) then
    return new;
  elsif tg_table_name = 'automacao_rodadas'
    and not public.wa_recipe_is_whatsapp(v_recipe) then
    return new;
  end if;

  if v_org is null then
    raise exception 'organization is required';
  end if;

  if tg_table_name = 'campanhas' and (v_new->>'canal') = 'whatsapp'
    and v_list is not null and not exists (
      select 1 from public.lead_lists x where x.id = v_list and x.org_id = v_org
    ) then
    raise exception 'resource does not belong to organization';
  elsif tg_table_name = 'campanha_leads' then
    if not exists (
      select 1 from public.campanhas x where x.id = v_campaign and x.org_id = v_org
    ) or not exists (
      select 1 from public.leads x where x.id = v_lead and x.org_id = v_org
    ) or (v_proposal is not null and not exists (
      select 1 from public.propostas x where x.id = v_proposal and x.org_id = v_org
    )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'wa_mensagens' then
    if not exists (
      select 1 from public.wa_instancias x where x.id = v_instance and x.org_id = v_org
    ) or (v_lead is not null and not exists (
      select 1 from public.leads x where x.id = v_lead and x.org_id = v_org
    )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'wa_envios' then
    if not exists (
      select 1 from public.wa_instancias x where x.id = v_instance and x.org_id = v_org
    ) or not exists (
      select 1 from public.leads x where x.id = v_lead and x.org_id = v_org
    ) or (v_campaign is not null and not exists (
      select 1 from public.campanhas x where x.id = v_campaign and x.org_id = v_org
    )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'sdr_sugestoes' then
    if v_lead is not null and not exists (
      select 1 from public.leads x where x.id = v_lead and x.org_id = v_org
    ) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'automacao_rodadas' and not exists (
    select 1 from public.automacao_receitas x where x.id = v_recipe and x.org_id = v_org
  ) then
    raise exception 'resource does not belong to organization';
  end if;

  return new;
end
$$;

comment on function public.wa_validate_resource_tenant() is
  'Valida referências multi-tenant de recursos WhatsApp sem depender do formato específico de NEW.';

commit;
