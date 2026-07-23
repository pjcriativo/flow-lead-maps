-- ═══ BILLING — CAMADA 1: CADASTRO DE PLANOS ═══
-- Só o cadastro (planos + qual plano cada org assina). A MEDIÇÃO de uso é a migration 046;
-- a COBRANÇA (gateway) é TODO — ver docs/DIVIDAS.md.

create table if not exists planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10, 2) not null default 0,
  periodo text not null default 'mensal' check (periodo in ('mensal', 'anual')),
  -- LIMITES por período (null = ilimitado; o dono da plataforma não tem plano/limite)
  limite_leads integer,        -- leads coletados por mês
  limite_sites integer,        -- gerações de site por IA por mês
  limite_campanhas integer,    -- campanhas criadas por mês
  limite_whatsapp integer,     -- chips de WhatsApp conectados
  limite_templates integer,    -- modelos de mensagem (wa_scripts)
  limite_segmentos integer,    -- listas/segmentos de leads
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
comment on table planos is 'Planos de assinatura (limites por período). Cobrança recorrente é TODO (gateway).';

alter table orgs add column if not exists plano_id uuid references planos(id);

-- Seed de referência: Starter / Pro / Enterprise (idempotente por nome).
insert into planos (nome, descricao, preco, periodo, limite_leads, limite_sites, limite_campanhas, limite_whatsapp, limite_templates, limite_segmentos, ordem)
select * from (values
  ('Starter', 'Para quem opera sozinho e quer explorar sourcing de leads limpo.', 19.00, 'mensal', 1500, 50, 5, 4, 5, 5, 1),
  ('Pro', 'Para times em crescimento: mais volume, enriquecimento mais rápido.', 39.00, 'mensal', 5000, 50, 20, 10, 20, 25, 2),
  ('Enterprise', 'Times maiores que precisam de limites sob medida e suporte.', 69.00, 'mensal', 8000, 120, 70, 15, 60, 60, 3)
) as v(nome, descricao, preco, periodo, limite_leads, limite_sites, limite_campanhas, limite_whatsapp, limite_templates, limite_segmentos, ordem)
where not exists (select 1 from planos p where p.nome = v.nome);

-- Backfill: toda org atual assina o Starter (referência; troca depois).
update orgs set plano_id = (select id from planos where nome = 'Starter' limit 1)
 where plano_id is null;

alter table planos enable row level security;
drop policy if exists planos_sel on planos;
-- planos são catálogo: qualquer usuário logado pode LER (a org precisa ver o próprio plano).
-- Escrita é só service role (Edge admin-acoes, guard super_admin).
create policy planos_sel on planos for select using (auth.uid() is not null);
