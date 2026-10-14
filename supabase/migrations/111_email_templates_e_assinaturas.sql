-- ══════════════════════════════════════════════════════════════════════════════
-- PROPOSTA DE MIGRATION 111 — PERSISTÊNCIA DE TEMPLATES E ASSINATURAS (PROMPT 50/51)
-- ⚠️ STATUS: PROPOSTA TÉCNICA DOCUMENTADA (NÃO APLICAR NESTE PROMPT)
-- Dependência: Preparação para o Estúdio de Campanhas (Prompt 51).
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. TABELA DE TEMPLATES DE E-MAIL (GLOBAIS E PERSONALIZADOS POR ORG)
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade, -- null para templates oficiais da plataforma
  created_by uuid references auth.users(id) on delete set null,
  slug text,
  nome text not null,
  descricao text,
  categoria text not null,
  categoria_label text not null,
  assunto_padrao text not null,
  preheader_padrao text,
  cta_texto text,
  cta_url text,
  conteudo_html text not null,
  tema_escuro boolean not null default false,
  is_global boolean not null default false,
  variaveis_suportadas text[] not null default array['nome', 'empresa', 'cidade', 'nome_remetente', 'empresa_remetente', 'telefone_remetente', 'site_remetente'],
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.email_templates is 'Catálogo de templates de e-mail globais e personalizados por organização.';

-- 2. TABELA DE ASSINATURAS CORPORATIVAS
create table if not exists public.assinaturas_corporativas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade, -- null para assinaturas modelo da plataforma
  created_by uuid references auth.users(id) on delete set null,
  nome text not null,
  cargo text,
  empresa text,
  telefone text,
  email text,
  site text,
  endereco text,
  linkedin text,
  instagram text,
  whatsapp text,
  html_template text not null,
  is_padrao boolean not null default false,
  is_global boolean not null default false,
  badge_label text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.assinaturas_corporativas is 'Modelos de assinaturas de e-mail e configurações padrão por organização.';

-- 3. TABELA DE FAVORITOS (ESCOPO POR ORG E USUÁRIO)
create table if not exists public.template_favoritos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  tipo text not null check (tipo in ('email', 'assinatura')),
  criado_em timestamptz not null default now(),
  unique (org_id, user_id, template_id)
);

comment on table public.template_favoritos is 'Registro de favoritos de templates e assinaturas isolados por organização e usuário.';

-- 4. POLÍTICAS DE RLS (ISOLAMENTO MULTI-TENANT RIGOROSO)
alter table public.email_templates enable row level security;
alter table public.assinaturas_corporativas enable row level security;
alter table public.template_favoritos enable row level security;

-- Templates: leitura de globais + templates da própria org
drop policy if exists email_templates_select on public.email_templates;
create policy email_templates_select on public.email_templates
  for select using (
    is_global = true or
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

-- Templates: escrita apenas para a própria org (não pode alterar globais)
drop policy if exists email_templates_insert on public.email_templates;
create policy email_templates_insert on public.email_templates
  for insert with check (
    is_global = false and
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

drop policy if exists email_templates_update on public.email_templates;
create policy email_templates_update on public.email_templates
  for update using (
    is_global = false and
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

-- Assinaturas: leitura de globais + da própria org
drop policy if exists assinaturas_select on public.assinaturas_corporativas;
create policy assinaturas_select on public.assinaturas_corporativas
  for select using (
    is_global = true or
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

-- Assinaturas: escrita restrita à org
drop policy if exists assinaturas_insert on public.assinaturas_corporativas;
create policy assinaturas_insert on public.assinaturas_corporativas
  for insert with check (
    is_global = false and
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

drop policy if exists assinaturas_update on public.assinaturas_corporativas;
create policy assinaturas_update on public.assinaturas_corporativas
  for update using (
    is_global = false and
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );

-- Favoritos: acesso restrito ao membro da org
drop policy if exists template_favoritos_all on public.template_favoritos;
create policy template_favoritos_all on public.template_favoritos
  for all using (
    user_id = auth.uid() and
    org_id in (select org_id from public.memberships where user_id = auth.uid())
  );
