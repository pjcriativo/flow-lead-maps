-- SEGURANÇA (abuso de custo) — a auditoria achou que `melhorar-proposta` deixava qualquer
-- usuário autenticado gastar IA à vontade (sem limite, sem registro). Aqui entra o registro
-- de USO por org, que alimenta o rate-limit da edge e dá visibilidade de consumo ao dono.
--
-- RLS: a org lê o PRÓPRIO consumo (para a UI mostrar depois). A escrita é só via service_role
-- (dentro da edge) — se o cliente pudesse inserir/apagar, ele furaria o próprio limite.
create table if not exists public.ia_uso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  funcao text not null, -- ex.: 'melhorar-proposta'
  modelo text,
  criado_em timestamptz not null default now()
);

alter table public.ia_uso enable row level security;
drop policy if exists "ia_uso own read" on public.ia_uso;
create policy "ia_uso own read" on public.ia_uso
  for select using (auth.uid() = user_id);
-- Sem policy de insert/update/delete: só service_role escreve.

-- Acelera a contagem do dia por org (o rate-limit).
create index if not exists idx_ia_uso_user_dia on public.ia_uso(user_id, funcao, criado_em);
