-- INCIDENTE DE SEGURANÇA — WhatsApp multi-tenant. Antes existia UMA instância Evolution
-- global ("flowleads", secret EVOLUTION_INSTANCE) compartilhada por TODAS as orgs, e as
-- edges wa-connect/wa-send-test não checavam o dono (zero getUser). Resultado provado na
-- auditoria: a org B via o número real da org A, podia ENVIAR pelo WhatsApp de A, e ao
-- pedir código derrubava a conexão de A (recriarInstancia = delete+create).
--
-- Agora: UMA instância POR ORG.
--   wa_instancias        → metadados (nome ARMAZENADO, número, status). RLS: a org lê a SUA.
--   wa_instancia_tokens  → o token da instância. RLS habilitada e ZERO POLICIES de propósito:
--                          nem o próprio dono lê. Só o service_role (dentro das edges).
--                          Motivo: se o token fosse legível pela anon key, o usuário chamaria
--                          a Evolution direto e furaria nossos limites. A separação em tabela
--                          própria é garantia ESTRUTURAL e auditável (0 policies = ninguém),
--                          diferente de REVOKE de coluna (frágil: `select *` quebra e uma
--                          policy futura re-expõe sem ninguém notar).

create table if not exists public.wa_instancias (
  id uuid primary key default gen_random_uuid(),
  -- 1 instância por org (org = user_id; não há tabela organizations neste app).
  user_id uuid references auth.users on delete cascade not null unique,
  -- NOME ARMAZENADO, nunca derivado em runtime: assim a instância legada "flowleads"
  -- convive com as novas sem virar caso especial no código.
  nome text not null unique,
  numero text, -- jid/número pareado (preenchido pela edge ao consultar o status)
  status text not null default 'desconectado'
    check (status in ('desconectado', 'aguardando', 'conectado', 'erro')),
  criada_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.wa_instancias enable row level security;
drop policy if exists "wa_instancias own read" on public.wa_instancias;
-- A org lê SÓ a sua (nunca a de outra). Escrita: apenas service_role (edges) — sem policy.
create policy "wa_instancias own read" on public.wa_instancias
  for select using (auth.uid() = user_id);

create table if not exists public.wa_instancia_tokens (
  instancia_id uuid primary key references public.wa_instancias on delete cascade,
  token text not null,
  atualizado_em timestamptz not null default now()
);

-- RLS ON + NENHUMA policy = default deny para anon/authenticated. Só service_role lê.
alter table public.wa_instancia_tokens enable row level security;

-- MIGRAÇÃO DO LEGADO: adota a instância "flowleads" (viva, pareada com 554197844716)
-- como a instância da org marcosg1 — SEM re-parear. O token é resolvido e gravado pela
-- edge no primeiro uso (ela lê /instance/all na Evolution com a API key global).
insert into public.wa_instancias (user_id, nome, numero, status)
select '087205c1-4243-47d1-86fb-bcbdeb3c8e44'::uuid, 'flowleads', '554197844716', 'conectado'
where exists (select 1 from auth.users where id = '087205c1-4243-47d1-86fb-bcbdeb3c8e44')
on conflict (user_id) do nothing;

create index if not exists idx_wa_instancias_user on public.wa_instancias(user_id);
