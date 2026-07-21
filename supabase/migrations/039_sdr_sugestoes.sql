-- Agente SDR: RASCUNHOS de resposta para conversas de LEAD. O agente nunca envia — ele sugere,
-- o dono aprova. É o mesmo portão do disparo, aplicado à conversa.
create table if not exists sdr_sugestoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  lead_id uuid references leads(id) on delete cascade,
  -- a mensagem do lead que motivou o rascunho (rastreabilidade)
  mensagem_id uuid,
  texto text not null,
  -- promessas detectadas (preço/prazo/garantia) para o dono revisar ANTES de aprovar
  alertas jsonb not null default '[]'::jsonb,
  estado text not null default 'rascunho'
    check (estado in ('rascunho', 'aprovada', 'descartada', 'enviada')),
  custo_usd numeric(10,4) not null default 0,
  dia_ref text not null,
  mes_ref text not null,
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);
alter table sdr_sugestoes enable row level security;
drop policy if exists "own sdr_sugestoes" on sdr_sugestoes;
create policy "own sdr_sugestoes" on sdr_sugestoes for select using (auth.uid() = user_id);
drop policy if exists "own sdr_sugestoes upd" on sdr_sugestoes;
create policy "own sdr_sugestoes upd" on sdr_sugestoes for update using (auth.uid() = user_id);
create index if not exists idx_sdr_pendentes on sdr_sugestoes (user_id, numero, estado);
create index if not exists idx_sdr_gasto on sdr_sugestoes (user_id, dia_ref, mes_ref);
