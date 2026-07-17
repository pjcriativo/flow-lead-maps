-- AUTOMAÇÃO DE PROSPECÇÃO — receita (o dono cria/aprova 1x) + rodadas (cada execução do robô).
-- REUSA o motor: o robô só BUSCA + QUALIFICA + PREPARA (rascunho) e PARA no portão. Nunca envia.
-- TETO DE GASTO obrigatório: limites por rodada e por mês (leads e US$); ao bater, para e avisa.
-- Agendamento começa DESLIGADO (ativa=false) — disparo manual até o dono ligar (segurança).

create table if not exists public.automacao_receitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  ativa boolean not null default false,                 -- agendamento ligado?
  -- alvo
  nicho text not null,
  cidade text not null,
  uf text,
  fonte text not null default 'apify',
  -- qualificação
  score_minimo int not null default 70,
  exigir_contato boolean not null default true,         -- descarta lead sem e-mail/WhatsApp
  canal text not null default 'whatsapp' check (canal in ('whatsapp', 'email')),
  wa_config jsonb,                                       -- copy/variações da rodada (canal whatsapp)
  -- volume/frequência
  leads_por_rodada int not null default 20,
  frequencia text not null default 'manual' check (frequencia in ('manual', 'diaria', 'semanal')),
  -- TETOS (o robô gasta dinheiro sozinho — sem isto não liga)
  max_leads_rodada int not null default 20,
  max_leads_mes int not null default 200,
  max_usd_rodada numeric not null default 5,
  max_usd_mes numeric not null default 50,
  custo_lead_usd numeric not null default 0.004,        -- estimativa Apify (~US$0,08/20)
  -- rastreio mensal (zera quando o mês vira)
  mes_ref text,                                          -- 'YYYY-MM'
  leads_mes int not null default 0,
  gasto_mes_usd numeric not null default 0,
  ultima_rodada_em timestamptz,
  criada_em timestamptz not null default now()
);
alter table public.automacao_receitas enable row level security;
drop policy if exists "own receitas" on public.automacao_receitas;
create policy "own receitas" on public.automacao_receitas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.automacao_rodadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  receita_id uuid not null references public.automacao_receitas(id) on delete cascade,
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  leads_buscados int not null default 0,
  leads_qualificados int not null default 0,
  leads_descartados int not null default 0,
  leads_preparados int not null default 0,
  custo_usd numeric not null default 0,
  campanha_id uuid,                                     -- campanha criada p/ revisão do dono
  status text not null default 'rodando'
    check (status in ('rodando', 'concluida', 'parada_teto', 'erro')),
  detalhe text
);
create index if not exists automacao_rodadas_receita_idx
  on public.automacao_rodadas (receita_id, iniciada_em desc);
alter table public.automacao_rodadas enable row level security;
drop policy if exists "own rodadas read" on public.automacao_rodadas;
create policy "own rodadas read" on public.automacao_rodadas for select using (auth.uid() = user_id);
-- INSERT/UPDATE das rodadas só via edge (service_role) — o robô roda no servidor.
