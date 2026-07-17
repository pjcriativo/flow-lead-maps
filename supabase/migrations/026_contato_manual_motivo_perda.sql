-- Contato manual + motivo de perda estruturado.
-- (1) lead_contatos: histórico de contatos manuais (WhatsApp/telefone/e-mail/presencial),
--     alimenta a LINHA DO TEMPO do lead. RLS por org (user_id = auth.uid()), igual às demais.
-- (2) leads: motivo de perda ESTRUTURADO (contável) + anotação + quando — para o painel
--     de aprendizado. NÃO cria status novo: usa os já existentes 'lost'/'nurture'.

create table if not exists public.lead_contatos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  canal text not null check (canal in ('whatsapp', 'telefone', 'email', 'presencial', 'outro')),
  anotacao text,
  contatado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists lead_contatos_lead_idx
  on public.lead_contatos (lead_id, contatado_em desc);

alter table public.lead_contatos enable row level security;

drop policy if exists "Users manage own lead_contatos" on public.lead_contatos;
create policy "Users manage own lead_contatos" on public.lead_contatos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- default do user_id = dono da sessão (defesa extra: nunca gravar contato de outra org)
alter table public.lead_contatos alter column user_id set default auth.uid();

-- Motivo de perda estruturado (lista fixa na app) + anotação livre + quando.
alter table public.leads add column if not exists motivo_perda text;
alter table public.leads add column if not exists motivo_perda_nota text;
alter table public.leads add column if not exists perda_em timestamptz;
