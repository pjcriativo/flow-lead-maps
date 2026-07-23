-- ═══ ETAPA 4 — Notificações (admin → usuários da plataforma) + Assinantes (CRUD manual) ═══
-- Notificações: admin manda um aviso in-app; cada usuário recebe UMA linha em
-- notificacao_destinatarios (registra quem recebeu, de propósito). NÃO mexe em
-- consumo_org/consumir_ou_bloquear — não é prospecção, não consome cota nem rampa.
-- Escrita só via service role (admin-acoes); RLS aqui só cobre LEITURA do próprio usuário
-- (e marcar a própria linha como lida).

create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

create table if not exists notificacao_destinatarios (
  id uuid primary key default gen_random_uuid(),
  notificacao_id uuid not null references notificacoes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enviado_em timestamptz not null default now(),
  lida_em timestamptz
);
create index if not exists idx_notificacao_destinatarios_user on notificacao_destinatarios (user_id, enviado_em desc);

alter table notificacoes enable row level security;
drop policy if exists notificacoes_sel on notificacoes;
create policy notificacoes_sel on notificacoes for select
  using (
    eh_super_admin()
    or exists (
      select 1 from notificacao_destinatarios nd
      where nd.notificacao_id = notificacoes.id and nd.user_id = auth.uid()
    )
  );
-- sem insert/update/delete pra client: só o edge admin-acoes (service role) grava.

alter table notificacao_destinatarios enable row level security;
drop policy if exists notificacao_destinatarios_sel on notificacao_destinatarios;
create policy notificacao_destinatarios_sel on notificacao_destinatarios for select
  using (user_id = auth.uid() or eh_super_admin());
drop policy if exists notificacao_destinatarios_upd on notificacao_destinatarios;
-- o usuário só marca a PRÓPRIA linha como lida (lida_em) — não muda dono/notificação.
create policy notificacao_destinatarios_upd on notificacao_destinatarios for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ═══ Assinantes — CRUD manual (sem base de captura ainda; cadastro é manual mesmo) ═══
create table if not exists assinantes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

alter table assinantes enable row level security;
drop policy if exists assinantes_sel on assinantes;
-- só o super_admin (plataforma) enxerga/gerencia — não é dado de nenhuma org específica.
create policy assinantes_sel on assinantes for select using (eh_super_admin());
-- insert/update/delete só via service role (admin-acoes) — mesma regra de notificacoes.
