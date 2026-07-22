-- ═══ SISTEMA DE PAPÉIS — ETAPA 2: RLS user_id → org + papel (o iceberg) ═══
-- Troca "auth.uid() = user_id" por "pertence à org (+ papel/atribuição)". SUPER_ADMIN atravessa
-- por design (só ele). Preserva a GRANULARIDADE de comando de cada policy antiga (SELECT-only
-- continua SELECT-only) para não afrouxar escrita. Escrita real do app é via service role
-- (ignora RLS) — isto governa a LEITURA client-side e barra forja de org_id/papel.
--
-- Regra por tabela:
--   leads               → pode_ver_lead(org_id, assigned_to)  [vendedor/sdr só o atribuído]
--   demais (com org_id) → pertence_a_org(org_id) OR eh_super_admin()
-- WITH CHECK (escrita client-side, quando havia) → pertence_a_org(org_id): barra cross-org.

-- helper: (re)cria uma policy no padrão org para um (tabela, cmd)
create or replace function _rls_org_policy(p_tabela text, p_cmd text)
returns void language plpgsql as $$
declare
  pred text := format('(eh_super_admin() or pertence_a_org(%I.org_id))', p_tabela);
  check_pred text := format('(eh_super_admin() or pertence_a_org(%I.org_id))', p_tabela);
  nome text := format('org_%s_%s', p_tabela, lower(p_cmd));
begin
  execute format('drop policy if exists %I on %I', nome, p_tabela);
  if p_cmd = 'SELECT' then
    execute format('create policy %I on %I for select using %s', nome, p_tabela, pred);
  elsif p_cmd = 'INSERT' then
    execute format('create policy %I on %I for insert with check %s', nome, p_tabela, check_pred);
  elsif p_cmd = 'UPDATE' then
    execute format('create policy %I on %I for update using %s with check %s', nome, p_tabela, pred, check_pred);
  elsif p_cmd = 'DELETE' then
    execute format('create policy %I on %I for delete using %s', nome, p_tabela, pred);
  else -- ALL
    execute format('create policy %I on %I for all using %s with check %s', nome, p_tabela, pred, check_pred);
  end if;
end $$;

do $$
declare
  r record;
  tabelas text[] := array[
    'activity_log','automacao_receitas','automacao_rodadas','campanha_leads','campanhas',
    'email_config','ia_uso','integrations','invoices','lead_contatos','lead_lists',
    'lead_reviews','propostas','redes_buscas','redesigns','sdr_sugestoes',
    'sites_publicados','wa_alertas','wa_envios','wa_instancias','wa_mensagens','wa_scripts'
  ];
  t text;
  c text;
  cmds text[];
begin
  foreach t in array tabelas loop
    -- 1) captura os comandos das policies antigas desta tabela (preserva granularidade)
    select array_agg(distinct cmd) into cmds from pg_policies
      where schemaname='public' and tablename=t;
    -- 2) derruba TODAS as policies antigas da tabela
    for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on %I', r.policyname, t);
    end loop;
    -- 3) recria no padrão org, um por comando que existia (ALL vira ALL)
    if cmds is not null then
      foreach c in array cmds loop
        perform _rls_org_policy(t, c);
      end loop;
    end if;
  end loop;
end $$;

-- ── leads: a única com visibilidade por PAPEL/ATRIBUIÇÃO ──
drop policy if exists "Users can CRUD own leads" on leads;
drop policy if exists org_leads_all on leads;
-- leitura: admin/gerente/suporte veem a org toda; vendedor/sdr só o atribuído; super_admin tudo
create policy leads_select on leads for select
  using (pode_ver_lead(org_id, assigned_to));
-- escrita client-side: dentro da própria org (o app real grava via service role)
create policy leads_ins on leads for insert
  with check (eh_super_admin() or pertence_a_org(org_id));
create policy leads_upd on leads for update
  using (pode_ver_lead(org_id, assigned_to))
  with check (eh_super_admin() or pertence_a_org(org_id));
create policy leads_del on leads for delete
  using (eh_super_admin() or (pertence_a_org(org_id)
    and papel_do_usuario(org_id) in ('admin','gerente')));

-- lead_atribuicoes e org_papeis: leitura pela org; escrita via service role (etapa 3/telas)
alter table lead_atribuicoes enable row level security;
drop policy if exists org_lead_atribuicoes_sel on lead_atribuicoes;
create policy org_lead_atribuicoes_sel on lead_atribuicoes for select
  using (eh_super_admin() or pertence_a_org(org_id));

alter table org_papeis enable row level security;
drop policy if exists org_papeis_sel on org_papeis;
create policy org_papeis_sel on org_papeis for select
  using (eh_super_admin() or pertence_a_org(org_id));

alter table memberships enable row level security;
drop policy if exists memberships_sel on memberships;
-- o usuário vê os membros da(s) org(s) a que pertence (base das telas Staff)
create policy memberships_sel on memberships for select
  using (eh_super_admin() or pertence_a_org(org_id));

alter table orgs enable row level security;
drop policy if exists orgs_sel on orgs;
create policy orgs_sel on orgs for select
  using (eh_super_admin() or pertence_a_org(id));

drop function if exists _rls_org_policy(text, text);
