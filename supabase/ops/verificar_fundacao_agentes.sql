-- VERIFICAÇÃO DE LEITURA — fundação do CEO de IA (migrations 202610270001 e 202610270002).
-- 100% somente leitura (apenas SELECT em catálogos). Rodar no SQL Editor do projeto
-- lyitsavnqwtsoouhcjie ANTES de pedir autorização para aplicar. Não grava, não cria, não altera.
-- Como ler: cada bloco devolve linhas "ok"/"FALTA"/"CONFLITO". Tudo "ok" nas dependências e
-- "livre" nos conflitos = a migration pode ser aplicada na ordem 001 → 002.

-- 1) Dependências que a 001 exige (devem existir) ---------------------------------------------
select 'dependencia' as tipo, d.nome,
       case when to_regclass('public.' || d.nome) is not null then 'ok' else 'FALTA' end as estado
from (values ('orgs'), ('memberships'), ('profiles'), ('leads'), ('ia_uso')) as d(nome)
union all
select 'funcao', f.nome,
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = f.nome) then 'ok' else 'FALTA' end
from (values ('eh_super_admin'), ('papel_do_usuario'), ('pertence_a_org')) as f(nome);

-- 2) Colunas de leads usadas pela ferramenta consultar_resumo_comercial -----------------------
select 'coluna leads.' || c.col as item,
       case when exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'leads' and column_name = c.col)
            then 'ok' else 'FALTA' end as estado
from (values ('org_id'), ('status'), ('score'), ('sem_contato'), ('created_at')) as c(col);

-- 3) Valores do enum de papéis e CHECK de status de leads (conferir se batem com o código) ----
select 'papel_org' as item, string_agg(e.enumlabel, ', ' order by e.enumsortorder) as valores
from pg_type t join pg_enum e on e.enumtypid = t.oid where t.typname = 'papel_org';
select 'leads_status_check' as item, pg_get_constraintdef(c.oid) as definicao
from pg_constraint c where c.conrelid = 'public.leads'::regclass and c.conname = 'leads_status_check';

-- 4) Conflito: objetos de agente que já existam (esperado: nenhum antes da 001) ---------------
select 'tabela' as tipo, t.nome,
       case when to_regclass('public.' || t.nome) is null then 'livre' else 'CONFLITO (já existe)' end as estado
from (values ('agents'), ('agent_tools'), ('agent_permissions'), ('agent_tasks'),
             ('agent_runs'), ('agent_run_steps'), ('agent_approvals')) as t(nome)
union all
select 'funcao', p.proname, 'CONFLITO (já existe)'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'agent\_%';

-- 5) A migration já foi registrada? (a lista mostra só as versões relevantes) -----------------
select version, name
from supabase_migrations.schema_migrations
where version in ('202610270001', '202610270002') or version >= '202610220002'
order by version;

-- 6) Papéis do Supabase e RLS do service_role (a prova local assume BYPASSRLS) ----------------
select rolname, rolbypassrls from pg_roles where rolname in ('anon', 'authenticated', 'service_role');

-- 7) Estado atual das funções de governança usadas pelas policies (deve ser security definer) -
select p.proname, p.prosecdef as security_definer, p.provolatile as volatilidade
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('eh_super_admin', 'papel_do_usuario', 'pertence_a_org');

-- 8) A RLS de leads existe e filtra por organização? (SECURITY INVOKER da ferramenta depende) -
select policyname, cmd, qual
from pg_policies where schemaname = 'public' and tablename = 'leads';

-- 9) Volume (apenas contagem): garante que o schema é o de produção esperado ------------------
select (select count(*) from public.orgs) as orgs, (select count(*) from public.leads) as leads;
