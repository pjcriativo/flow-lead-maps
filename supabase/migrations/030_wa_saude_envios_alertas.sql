-- ETAPA 3: detecção de ban + rotação + graduação.
-- (a) Saúde do chip: contador de LoggedIn=false SUSTENTADO (zera ao voltar LoggedIn=true) +
--     carimbo da última checagem (janela ≥60s → idempotência: checar 2x não conta 2x).
-- (b) wa_envios: qual CHIP mandou pra cada lead (base da graduação; ETAPA 4 preenche no envio).
-- (c) wa_alertas: avisos VISÍVEIS ao dono (chip queimado, rotação, sem chip) — a UI lê e mostra.
-- RLS por org em tudo; escrita de wa_instancias/wa_alertas segue só via edge (service_role).

alter table public.wa_instancias add column if not exists falhas_login int not null default 0;
alter table public.wa_instancias add column if not exists ultima_checagem_em timestamptz;

create table if not exists public.wa_envios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  instancia_id uuid not null references public.wa_instancias(id) on delete cascade,
  campanha_id uuid,
  enviado_em timestamptz not null default now()
);
create index if not exists wa_envios_lead_idx on public.wa_envios (lead_id, enviado_em desc);
alter table public.wa_envios enable row level security;
drop policy if exists "own wa_envios" on public.wa_envios;
create policy "own wa_envios" on public.wa_envios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.wa_alertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null,
  mensagem text not null,
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists wa_alertas_user_idx on public.wa_alertas (user_id, criado_em desc);
alter table public.wa_alertas enable row level security;
drop policy if exists "own wa_alertas read" on public.wa_alertas;
create policy "own wa_alertas read" on public.wa_alertas for select using (auth.uid() = user_id);
drop policy if exists "own wa_alertas update" on public.wa_alertas;
create policy "own wa_alertas update" on public.wa_alertas for update using (auth.uid() = user_id);
-- INSERT em wa_alertas só via edge (service_role) — sem policy de insert de propósito.
