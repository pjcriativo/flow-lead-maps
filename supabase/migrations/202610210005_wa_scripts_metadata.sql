-- Metadados dos scripts WhatsApp persistidos no Supabase (2026-10-21).
--
-- Problema: a migration 20261016_wa_scripts_premium nunca foi aplicada em produção; categoria,
-- status (ativo) e contador de uso viviam no localStorage de cada navegador — não eram
-- compartilhados entre atendentes nem sobreviviam a outro dispositivo.
--
-- Esta migration substitui a anterior (mesmas colunas, idempotente) e acrescenta:
--   * validação de categoria e de usos >= 0;
--   * wa_register_script_use: qualquer atendente da organização registra o USO de um script
--     (resposta rápida) sem precisar de permissão de edição — o CRUD continua restrito a
--     admin/gerente pelas policies existentes.
alter table public.wa_scripts
  add column if not exists categoria text not null default 'atendimento',
  add column if not exists ativo boolean not null default true,
  add column if not exists usos integer not null default 0,
  add column if not exists ultimo_uso_em timestamptz,
  add column if not exists atualizado_em timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wa_scripts_categoria_check') then
    alter table public.wa_scripts add constraint wa_scripts_categoria_check
      check (categoria in ('boas_vindas','qualificacao','agendamento','follow_up','recuperacao','atendimento'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wa_scripts_usos_check') then
    alter table public.wa_scripts add constraint wa_scripts_usos_check check (usos >= 0);
  end if;
end $$;

create index if not exists idx_wa_scripts_org_categoria on public.wa_scripts(org_id, categoria);
create index if not exists idx_wa_scripts_org_usos on public.wa_scripts(org_id, usos desc);

create or replace function public.wa_register_script_use(p_org uuid, p_script uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usos integer;
begin
  if not public.wa_role_allowed(p_org, array['admin','gerente','vendedor','sdr','suporte']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.wa_scripts
     set usos = usos + 1, ultimo_uso_em = now()
   where id = p_script and org_id = p_org and ativo
  returning usos into v_usos;
  if v_usos is null then
    raise exception 'script not found or inactive' using errcode = 'P0002';
  end if;
  return v_usos;
end
$$;

revoke all on function public.wa_register_script_use(uuid, uuid) from public, anon;
grant execute on function public.wa_register_script_use(uuid, uuid) to authenticated, service_role;
