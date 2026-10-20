-- Conexões do WhatsApp são arquivadas em vez de apagadas fisicamente. Isso permite ao usuário
-- remover a sessão sem destruir envios, conversas, incidentes e auditoria ligados à instância.

alter table public.wa_instancias
  add column if not exists deleted_at timestamptz;

create index if not exists wa_instancias_active_org_idx
  on public.wa_instancias(org_id, funcao, ordem)
  where deleted_at is null;

drop policy if exists org_wa_instancias_select on public.wa_instancias;
drop policy if exists "wa_instancias own read" on public.wa_instancias;
create policy org_wa_instancias_select on public.wa_instancias for select
  using (
    deleted_at is null
    and public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte'])
  );

-- A cota considera somente conexões ativas. Uma conexão arquivada libera a vaga sem apagar o
-- histórico que referencia sua linha.
create or replace function public.aplicar_limite_estoque_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := coalesce(new.org_id, public.org_do_usuario(new.user_id));
  v_limit integer;
  v_used integer;
  v_resource text := tg_argv[0];
begin
  if v_org is null then raise exception 'organizacao_nao_encontrada'; end if;
  if exists (
    select 1 from public.orgs o join public.profiles p on p.id = o.dono_user_id
    where o.id = v_org and coalesce(p.is_super_admin, false)
  ) then
    new.org_id := v_org;
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_resource || ':' || v_org::text, 0));

  if v_resource = 'whatsapp' then
    select p.limite_whatsapp into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id
    where o.id = v_org;
    select count(*) into v_used
    from public.wa_instancias
    where org_id = v_org and deleted_at is null;
  elsif v_resource = 'templates' then
    select p.limite_templates into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = v_org;
    select count(*) into v_used from public.wa_scripts where org_id = v_org;
  elsif v_resource = 'segmentos' then
    select p.limite_segmentos into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = v_org;
    select count(*) into v_used from public.lead_lists where org_id = v_org;
  else
    raise exception 'recurso_de_estoque_invalido';
  end if;

  if v_limit is not null and v_used + 1 > v_limit then
    raise exception 'Limite de % do plano atingido: %/%', v_resource, v_used, v_limit;
  end if;
  new.org_id := v_org;
  return new;
end;
$$;
