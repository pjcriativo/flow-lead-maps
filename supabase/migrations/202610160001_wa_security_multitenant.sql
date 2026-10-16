-- Correção 01: isolamento organizacional e autorização do WhatsApp.
-- Migration incremental; não executa chamadas externas e não remove dados.
-- A organização ativa continua sendo selecionada pelo cliente e validada nas Edge Functions.
-- A RLS limita o universo às memberships legítimas; ela não escolhe silenciosamente uma delas.

begin;

create or replace function public.wa_role_allowed(p_org uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.eh_super_admin() or exists (
    select 1
    from public.memberships m
    left join public.org_papeis p
      on p.org_id = m.org_id and p.papel = m.papel
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.papel::text = any (p_roles)
      and coalesce(p.ativo, true)
  )
$$;

revoke all on function public.wa_role_allowed(uuid, text[]) from public;
grant execute on function public.wa_role_allowed(uuid, text[]) to authenticated, service_role;

create or replace function public.wa_campaign_is_whatsapp(p_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select c.canal = 'whatsapp'
    from public.campanhas c
    where c.id = p_campaign
  ), false)
$$;

create or replace function public.wa_recipe_is_whatsapp(p_recipe uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select r.canal = 'whatsapp'
    from public.automacao_receitas r
    where r.id = p_recipe
  ), false)
$$;

revoke all on function public.wa_campaign_is_whatsapp(uuid) from public;
revoke all on function public.wa_recipe_is_whatsapp(uuid) from public;
grant execute on function public.wa_campaign_is_whatsapp(uuid) to authenticated, service_role;
grant execute on function public.wa_recipe_is_whatsapp(uuid) to authenticated, service_role;

create or replace function public.wa_org_id_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.org_id is distinct from new.org_id then
    raise exception 'organization cannot be changed';
  end if;
  return new;
end
$$;

create or replace function public.wa_validate_resource_tenant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Tabelas compartilhadas continuam com o comportamento dos demais canais.
  if tg_table_name = 'campanhas' and new.canal <> 'whatsapp' then
    return new;
  elsif tg_table_name = 'campanha_leads'
    and not public.wa_campaign_is_whatsapp(new.campanha_id) then
    return new;
  elsif tg_table_name = 'automacao_rodadas'
    and not public.wa_recipe_is_whatsapp(new.receita_id) then
    return new;
  end if;

  if new.org_id is null then
    raise exception 'organization is required';
  end if;
  if tg_table_name = 'campanhas' and new.canal = 'whatsapp'
    and new.list_id is not null and not exists (
    select 1 from public.lead_lists x where x.id = new.list_id and x.org_id = new.org_id
  ) then
    raise exception 'resource does not belong to organization';
  elsif tg_table_name = 'campanha_leads' then
    if not exists (select 1 from public.campanhas x where x.id = new.campanha_id and x.org_id = new.org_id)
      or not exists (select 1 from public.leads x where x.id = new.lead_id and x.org_id = new.org_id)
      or (new.proposta_id is not null and not exists (
        select 1 from public.propostas x where x.id = new.proposta_id and x.org_id = new.org_id
      )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'wa_mensagens' then
    if not exists (select 1 from public.wa_instancias x where x.id = new.instancia_id and x.org_id = new.org_id)
      or (new.lead_id is not null and not exists (
        select 1 from public.leads x where x.id = new.lead_id and x.org_id = new.org_id
      )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'wa_envios' then
    if not exists (select 1 from public.wa_instancias x where x.id = new.instancia_id and x.org_id = new.org_id)
      or not exists (select 1 from public.leads x where x.id = new.lead_id and x.org_id = new.org_id)
      or (new.campanha_id is not null and not exists (
        select 1 from public.campanhas x where x.id = new.campanha_id and x.org_id = new.org_id
      )) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'sdr_sugestoes' then
    if new.lead_id is not null and not exists (
      select 1 from public.leads x where x.id = new.lead_id and x.org_id = new.org_id
    ) then
      raise exception 'resource does not belong to organization';
    end if;
  elsif tg_table_name = 'automacao_rodadas' and not exists (
    select 1 from public.automacao_receitas x where x.id = new.receita_id and x.org_id = new.org_id
  ) then
    raise exception 'resource does not belong to organization';
  end if;
  return new;
end
$$;

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'campanhas', 'campanha_leads', 'wa_mensagens', 'wa_envios',
    'sdr_sugestoes', 'automacao_rodadas'
  ] loop
    trigger_name := format('trg_%s_tenant_integrity', table_name);
    execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.wa_validate_resource_tenant()',
      trigger_name,
      table_name
    );
  end loop;
end
$$;

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'wa_instancias', 'wa_envios', 'wa_alertas', 'wa_scripts', 'wa_mensagens'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      trigger_name := format('trg_%s_org_immutable', table_name);
      execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.wa_org_id_immutable()',
        trigger_name,
        table_name
      );
    end if;
  end loop;
end
$$;

-- Tokens nunca são expostos ao cliente, mesmo quando o usuário administra a organização.
alter table public.wa_instancia_tokens enable row level security;
revoke all on table public.wa_instancia_tokens from anon, authenticated;

-- Remove somente policies PERMISSIVE das tabelas exclusivas do WhatsApp. Policies
-- RESTRICTIVE (incluindo o gate de acesso à ferramenta) são deliberadamente preservadas.
do $$
declare
  table_name text;
  policy_row record;
begin
  foreach table_name in array array[
    'wa_instancias', 'wa_envios', 'wa_alertas', 'wa_scripts', 'wa_mensagens'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      for policy_row in
        select policyname from pg_policies
        where schemaname = 'public'
          and tablename = table_name
          and permissive = 'PERMISSIVE'
      loop
        execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
      end loop;
    end if;
  end loop;
end
$$;

-- Instâncias: leitura operacional; mutação somente administrativa.
drop policy if exists org_wa_instancias_select on public.wa_instancias;
drop policy if exists org_wa_instancias_insert on public.wa_instancias;
drop policy if exists org_wa_instancias_update on public.wa_instancias;
drop policy if exists org_wa_instancias_delete on public.wa_instancias;
create policy org_wa_instancias_select on public.wa_instancias for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
create policy org_wa_instancias_insert on public.wa_instancias for insert
  with check (public.wa_role_allowed(org_id, array['admin','gerente']));
create policy org_wa_instancias_update on public.wa_instancias for update
  using (public.wa_role_allowed(org_id, array['admin','gerente']))
  with check (public.wa_role_allowed(org_id, array['admin','gerente']));
create policy org_wa_instancias_delete on public.wa_instancias for delete
  using (public.wa_role_allowed(org_id, array['admin','gerente']));

-- Ledgers e alertas: escrita continua restrita às Edge Functions, exceto leitura/ack do alerta.
drop policy if exists org_wa_envios_select on public.wa_envios;
create policy org_wa_envios_select on public.wa_envios for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));

drop policy if exists org_wa_alertas_select on public.wa_alertas;
drop policy if exists org_wa_alertas_update on public.wa_alertas;
create policy org_wa_alertas_select on public.wa_alertas for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
create policy org_wa_alertas_update on public.wa_alertas for update
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']))
  with check (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
revoke update on public.wa_alertas from authenticated;
grant update (lido) on public.wa_alertas to authenticated;

-- Conversas: operadores só veem/alteram threads de leads atribuídos; suporte e gestão veem a org.
drop policy if exists org_wa_mensagens_select on public.wa_mensagens;
drop policy if exists org_wa_mensagens_update on public.wa_mensagens;
drop policy if exists org_wa_mensagens_delete on public.wa_mensagens;
create policy org_wa_mensagens_select on public.wa_mensagens for select
  using (
    public.wa_role_allowed(org_id, array['admin','gerente','suporte'])
    or (
      public.wa_role_allowed(org_id, array['vendedor','sdr'])
      and lead_id is not null
      and exists (
        select 1 from public.leads l
        where l.id = wa_mensagens.lead_id
          and l.org_id = wa_mensagens.org_id
          and l.assigned_to = auth.uid()
      )
    )
  );
create policy org_wa_mensagens_update on public.wa_mensagens for update
  using (
    public.wa_role_allowed(org_id, array['admin','gerente','suporte'])
    or exists (
      select 1 from public.leads l
      where l.id = wa_mensagens.lead_id
        and l.org_id = wa_mensagens.org_id
        and l.assigned_to = auth.uid()
    )
  )
  with check (org_id is not null);
create policy org_wa_mensagens_delete on public.wa_mensagens for delete
  using (public.wa_role_allowed(org_id, array['admin','gerente']));
revoke update on public.wa_mensagens from authenticated;
grant update (lida) on public.wa_mensagens to authenticated;

-- Scripts: leitura/uso operacional; CRUD administrativo.
drop policy if exists org_wa_scripts_select on public.wa_scripts;
drop policy if exists org_wa_scripts_insert on public.wa_scripts;
drop policy if exists org_wa_scripts_update on public.wa_scripts;
drop policy if exists org_wa_scripts_delete on public.wa_scripts;
create policy org_wa_scripts_select on public.wa_scripts for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
create policy org_wa_scripts_insert on public.wa_scripts for insert
  with check (public.wa_role_allowed(org_id, array['admin','gerente']));
create policy org_wa_scripts_update on public.wa_scripts for update
  using (public.wa_role_allowed(org_id, array['admin','gerente']))
  with check (public.wa_role_allowed(org_id, array['admin','gerente']));
create policy org_wa_scripts_delete on public.wa_scripts for delete
  using (public.wa_role_allowed(org_id, array['admin','gerente']));

-- Campanhas é compartilhada com e-mail/Estúdio. Policies RESTRICTIVE acrescentam
-- a matriz WhatsApp sem remover ou afrouxar as policies dos outros canais.
drop policy if exists wa_campanhas_select_restrito on public.campanhas;
drop policy if exists wa_campanhas_insert_restrito on public.campanhas;
drop policy if exists wa_campanhas_update_restrito on public.campanhas;
drop policy if exists wa_campanhas_delete_restrito on public.campanhas;
create policy wa_campanhas_select_restrito on public.campanhas
  as restrictive for select using (
    canal <> 'whatsapp'
    or public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte'])
  );
create policy wa_campanhas_insert_restrito on public.campanhas
  as restrictive for insert with check (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  );
create policy wa_campanhas_update_restrito on public.campanhas
  as restrictive for update using (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  ) with check (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  );
create policy wa_campanhas_delete_restrito on public.campanhas
  as restrictive for delete using (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  );

drop policy if exists wa_campanha_leads_select_restrito on public.campanha_leads;
drop policy if exists wa_campanha_leads_insert_restrito on public.campanha_leads;
drop policy if exists wa_campanha_leads_update_restrito on public.campanha_leads;
drop policy if exists wa_campanha_leads_delete_restrito on public.campanha_leads;
create policy wa_campanha_leads_select_restrito on public.campanha_leads
  as restrictive for select using (
    not public.wa_campaign_is_whatsapp(campanha_id)
    or public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte'])
  );
create policy wa_campanha_leads_insert_restrito on public.campanha_leads
  as restrictive for insert with check (
    not public.wa_campaign_is_whatsapp(campanha_id)
    or public.wa_role_allowed(org_id, array['admin','gerente'])
  );
create policy wa_campanha_leads_update_restrito on public.campanha_leads
  as restrictive for update using (
    not public.wa_campaign_is_whatsapp(campanha_id)
    or public.wa_role_allowed(org_id, array['admin','gerente'])
  ) with check (
    not public.wa_campaign_is_whatsapp(campanha_id)
    or public.wa_role_allowed(org_id, array['admin','gerente'])
  );
create policy wa_campanha_leads_delete_restrito on public.campanha_leads
  as restrictive for delete using (
    not public.wa_campaign_is_whatsapp(campanha_id)
    or public.wa_role_allowed(org_id, array['admin','gerente'])
  );

-- Automações também são compartilhadas. As restrições abaixo só alcançam receitas WhatsApp.
drop policy if exists wa_automacao_receitas_select_restrito on public.automacao_receitas;
drop policy if exists wa_automacao_receitas_write_restrito on public.automacao_receitas;
create policy wa_automacao_receitas_select_restrito on public.automacao_receitas
  as restrictive for select using (
    canal <> 'whatsapp'
    or public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte'])
  );
create policy wa_automacao_receitas_write_restrito on public.automacao_receitas
  as restrictive for all using (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  ) with check (
    canal <> 'whatsapp' or public.wa_role_allowed(org_id, array['admin','gerente'])
  );

drop policy if exists wa_automacao_rodadas_select_restrito on public.automacao_rodadas;
create policy wa_automacao_rodadas_select_restrito on public.automacao_rodadas
  as restrictive for select using (
    not public.wa_recipe_is_whatsapp(receita_id)
    or public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte'])
  );

-- Sugestões do SDR continuam com as policies-base da organização, acrescidas do
-- requisito de gestão/suporte ou atribuição explícita do lead.
drop policy if exists wa_sdr_sugestoes_select_restrito on public.sdr_sugestoes;
drop policy if exists wa_sdr_sugestoes_update_restrito on public.sdr_sugestoes;
create policy wa_sdr_sugestoes_select_restrito on public.sdr_sugestoes
  as restrictive for select using (
    public.wa_role_allowed(org_id, array['admin','gerente','suporte'])
    or exists (
      select 1 from public.leads l
      where l.id = sdr_sugestoes.lead_id
        and l.org_id = sdr_sugestoes.org_id
        and l.assigned_to = auth.uid()
    )
  );
create policy wa_sdr_sugestoes_update_restrito on public.sdr_sugestoes
  as restrictive for update using (
    public.wa_role_allowed(org_id, array['admin','gerente','suporte'])
    or exists (
      select 1 from public.leads l
      where l.id = sdr_sugestoes.lead_id
        and l.org_id = sdr_sugestoes.org_id
        and l.assigned_to = auth.uid()
    )
  )
  with check (org_id is not null);
revoke update on public.sdr_sugestoes from authenticated;
grant update (estado, texto, decidido_em) on public.sdr_sugestoes to authenticated;

commit;
