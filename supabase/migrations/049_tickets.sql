-- ═══ SUPORTE — módulo novo: tickets + respostas ═══
-- Cliente (dentro do app) abre e vê os seus; admin (super_admin) vê e responde TODOS,
-- de todas as orgs. Mesma regra de visibilidade de `leads`: vendedor/sdr só o que É DELE
-- (autor); admin/gerente/suporte veem tudo da própria org. super_admin atravessa por design.

do $$ begin
  create type ticket_prioridade as enum ('baixa', 'media', 'alta');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ticket_status as enum ('aberto', 'em_andamento', 'resolvido', 'fechado');
exception when duplicate_object then null; end $$;

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  -- nullable de propósito (mesmo padrão de org_id nas outras tabelas, migration 042): o
  -- trigger preenche no INSERT; NOT NULL bateria de frente com o tipo gerado do supabase-js.
  org_id uuid references orgs(id) on delete cascade,
  autor_user_id uuid not null references auth.users(id),
  assunto text not null,
  mensagem text not null,
  prioridade ticket_prioridade not null default 'media',
  status ticket_status not null default 'aberto',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table tickets is 'Chamados de suporte. Visibilidade igual a leads: vendedor/sdr só o próprio; admin/gerente/suporte veem a org toda; super_admin atravessa.';

create table if not exists ticket_respostas (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  autor_user_id uuid not null references auth.users(id),
  eh_admin boolean not null default false,
  texto text not null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_ticket_respostas_ticket on ticket_respostas (ticket_id, criado_em);

create or replace function pode_ver_ticket(p_org uuid, p_autor uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select eh_super_admin() or (
    pertence_a_org(p_org) and (
      papel_do_usuario(p_org) in ('admin','gerente','suporte') or p_autor = auth.uid()
    )
  )
$$;

alter table tickets enable row level security;
drop policy if exists tickets_sel on tickets;
create policy tickets_sel on tickets for select using (pode_ver_ticket(org_id, autor_user_id));
drop policy if exists tickets_ins on tickets;
create policy tickets_ins on tickets for insert
  with check (eh_super_admin() or (pertence_a_org(org_id) and autor_user_id = auth.uid()));
-- update (status/prioridade) fica só para o Edge admin (service role) — cliente não muda status.

alter table ticket_respostas enable row level security;
drop policy if exists ticket_respostas_sel on ticket_respostas;
create policy ticket_respostas_sel on ticket_respostas for select
  using (exists (select 1 from tickets t where t.id = ticket_id and pode_ver_ticket(t.org_id, t.autor_user_id)));
drop policy if exists ticket_respostas_ins on ticket_respostas;
create policy ticket_respostas_ins on ticket_respostas for insert
  with check (
    autor_user_id = auth.uid()
    and exists (select 1 from tickets t where t.id = ticket_id and pode_ver_ticket(t.org_id, t.autor_user_id))
  );

-- org_id preenchido sozinho no insert — tickets usa autor_user_id (não user_id), então
-- NÃO reusa preencher_org_id() genérico (ele lê new.user_id, que não existe aqui).
create or replace function preencher_org_id_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null and new.autor_user_id is not null then
    new.org_id := org_do_usuario(new.autor_user_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_org_id_ticket on tickets;
create trigger trg_org_id_ticket before insert on tickets
  for each row execute function preencher_org_id_ticket();
