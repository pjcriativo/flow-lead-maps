-- ═══ SISTEMA DE PAPÉIS — ETAPA 1: ESTRUTURA (sem tocar RLS) ═══
-- Materializa o tenant (orgs), o vínculo user↔org↔papel (memberships), o histórico de
-- atribuição de leads e as FUNÇÕES de autorização (fonte única). org_id entra em TODAS as
-- tabelas de dados com backfill + trigger de preenchimento — o código atual continua gravando
-- user_id e NADA muda de comportamento nesta etapa (RLS segue a antiga, por user_id).
-- Papéis: super_admin (plataforma) > admin (dono da org) > gerente > vendedor/sdr > suporte.

-- 1) ORGS ------------------------------------------------------------------
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dono_user_id uuid not null references auth.users(id),
  criada_em timestamptz not null default now()
);
comment on table orgs is 'Tenant. Todo dado de negócio pertence a UMA org (org_id).';

-- 2) MEMBERSHIPS -----------------------------------------------------------
do $$ begin
  create type papel_org as enum ('super_admin','admin','gerente','vendedor','sdr','suporte');
exception when duplicate_object then null; end $$;

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_org not null default 'vendedor',
  criada_em timestamptz not null default now(),
  unique (org_id, user_id)
);
comment on table memberships is 'Quem é o quê em cada org. Papel super_admin de PLATAFORMA vem de profiles.is_super_admin (fonte única já protegida); aqui ele existe no enum só por completude.';

-- 3) HISTÓRICO DE ATRIBUIÇÃO ------------------------------------------------
create table if not exists lead_atribuicoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  org_id uuid references orgs(id),
  de_user_id uuid references auth.users(id),
  para_user_id uuid not null references auth.users(id),
  por_user_id uuid references auth.users(id),
  motivo text,
  criado_em timestamptz not null default now()
);
create index if not exists idx_lead_atribuicoes_lead on lead_atribuicoes (lead_id, criado_em);

-- 4) CONFIG DE PAPÉIS POR ORG (tela Roles: toggle Enable/Disable REAL) -------
create table if not exists org_papeis (
  org_id uuid not null references orgs(id) on delete cascade,
  papel papel_org not null,
  ativo boolean not null default true,
  primary key (org_id, papel)
);
comment on table org_papeis is 'Toggle real da tela Roles: papel desativado na org não pode receber novos membros.';

-- 5) BACKFILL: cada dono atual vira ADMIN da sua org ------------------------
insert into orgs (nome, dono_user_id)
select coalesce(nullif(trim(p.company_name), ''), split_part(p.email, '@', 1)), p.id
from profiles p
where not exists (select 1 from orgs o where o.dono_user_id = p.id);

insert into memberships (org_id, user_id, papel)
select o.id, o.dono_user_id, 'admin'
from orgs o
on conflict (org_id, user_id) do nothing;

-- papéis da org: seed todos ativos (menos super_admin, que não é papel de org)
insert into org_papeis (org_id, papel, ativo)
select o.id, p.papel, true
from orgs o
cross join (select unnest(enum_range(null::papel_org)) as papel) p
where p.papel <> 'super_admin'
on conflict (org_id, papel) do nothing;

-- 6) ORG_ID EM TODAS AS TABELAS DE DADOS + BACKFILL + TRIGGER ---------------
-- O trigger preenche org_id a partir do user_id no INSERT — nenhuma Edge/tela precisa
-- mudar agora, e nada nasce órfão de org.
create or replace function org_do_usuario(p_user uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.org_id from memberships m where m.user_id = p_user
  order by m.criada_em asc limit 1
$$;

create or replace function preencher_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null and new.user_id is not null then
    new.org_id := org_do_usuario(new.user_id);
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'activity_log','automacao_receitas','automacao_rodadas','campanha_leads','campanhas',
    'email_config','ia_uso','integrations','invoices','lead_contatos','lead_lists',
    'lead_reviews','leads','propostas','redes_buscas','redesigns','sdr_sugestoes',
    'sequences','sites_publicados','wa_alertas','wa_envios','wa_instancias','wa_mensagens',
    'wa_scripts'
  ] loop
    execute format('alter table %I add column if not exists org_id uuid references orgs(id)', t);
    execute format(
      'update %I x set org_id = org_do_usuario(x.user_id) where x.org_id is null and x.user_id is not null', t);
    execute format('drop trigger if exists trg_org_id on %I', t);
    execute format(
      'create trigger trg_org_id before insert on %I for each row execute function preencher_org_id()', t);
    execute format('create index if not exists idx_%s_org on %I (org_id)', t, t);
  end loop;
end $$;

-- 7) ASSIGNED_TO no lead (handoff da etapa 3) --------------------------------
alter table leads add column if not exists assigned_to uuid references auth.users(id);
update leads set assigned_to = user_id where assigned_to is null;
create index if not exists idx_leads_assigned on leads (org_id, assigned_to);
comment on column leads.assigned_to is 'Responsável ATUAL pelo lead (muda no funil via handoff; histórico em lead_atribuicoes).';

-- 8) FUNÇÕES DE AUTORIZAÇÃO (fonte única; a RLS da etapa 2 usa ESTAS) --------
create or replace function eh_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from profiles where id = auth.uid()), false)
$$;

create or replace function papel_do_usuario(p_org uuid)
returns text language sql stable security definer set search_path = public as $$
  select m.papel::text from memberships m
  where m.org_id = p_org and m.user_id = auth.uid() limit 1
$$;

create or replace function pertence_a_org(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_org is not null and exists (
    select 1 from memberships m where m.org_id = p_org and m.user_id = auth.uid())
$$;

-- Vendedor/SDR só veem lead ATRIBUÍDO a eles; admin/gerente/suporte veem a org toda.
create or replace function pode_ver_lead(p_org uuid, p_assigned uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select eh_super_admin() or (
    pertence_a_org(p_org) and (
      papel_do_usuario(p_org) in ('admin','gerente','suporte')
      or p_assigned = auth.uid()
    )
  )
$$;
