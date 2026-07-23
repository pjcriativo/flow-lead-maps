-- ═══ Cofre de chaves — gerenciamento de API keys pelo painel admin ═══
-- Escrita-apenas do lado do client: o valor completo NUNCA é lido de volta por ninguém
-- (nem super_admin) fora do runtime das Edges. O banco guarda só o CIFRADO (AES-256-GCM,
-- chave-mestra no secret CHAVES_MASTER_KEY — nunca no banco) + os últimos 4 caracteres em
-- texto puro (só pra exibir "••••••••4f2a" na UI).
--
-- RLS: SEM NENHUMA policy de select/insert/update/delete pro client — só o service role
-- (edge admin-acoes, que checa is_super_admin no servidor) toca essas tabelas. Isso é mais
-- forte que "só super_admin lê": nem o super_admin lê o valor puro por nenhum caminho.
create table if not exists config_chaves (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  valor_cifrado text not null,
  ultimos4 text not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);
alter table config_chaves enable row level security;

create table if not exists config_chaves_auditoria (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  alterado_por uuid references auth.users(id),
  alterado_em timestamptz not null default now()
);
alter table config_chaves_auditoria enable row level security;
create index if not exists idx_config_chaves_auditoria_data on config_chaves_auditoria (alterado_em desc);
