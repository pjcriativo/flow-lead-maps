-- Google Maps P0: server-owned audit logs and referential integrity.
-- Do not apply automatically. Rollback FK only (if explicitly required):
-- ALTER TABLE public.leads DROP CONSTRAINT leads_list_id_fkey;
-- ALTER TABLE public.leads ADD CONSTRAINT leads_list_id_fkey FOREIGN KEY (list_id)
--   REFERENCES public.lead_lists(id) ON DELETE CASCADE;

begin;

drop policy if exists "Usuário lê consumo de API de sua organização" on public.api_consumption_logs;
drop policy if exists "Usuários autenticados podem inserir logs de consumo" on public.api_consumption_logs;
drop policy if exists "Super admin lê todos os logs de consumo de API" on public.api_consumption_logs;
REVOKE ALL ON TABLE public.api_consumption_logs FROM anon, authenticated;
grant select, insert, update, delete on table public.api_consumption_logs to service_role;

create or replace function public.google_maps_search_history(p_org uuid, p_limit integer default 200)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  quantity integer,
  niche text,
  city text,
  state text,
  radius_km numeric,
  run_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin()
     and not public.pertence_a_org(p_org) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select l.id, l.created_at, l.quantity,
    left(coalesce(l.metadata->>'nicho', 'Geral'), 160),
    left(coalesce(l.metadata->>'cidade', 'Brasil'), 160),
    left(coalesce(l.metadata->>'uf', ''), 8),
    case when (l.metadata->>'raio_km') ~ '^[0-9]+([.][0-9]+)?$'
      then (l.metadata->>'raio_km')::numeric else null end,
    case upper(coalesce(l.metadata->>'run_status', ''))
      when 'FAILED' then 'erro'
      when 'ABORTED' then 'erro'
      when 'TIMED-OUT' then 'erro'
      when 'SUCCEEDED' then 'concluida'
      else 'parcial'
    end
  from public.api_consumption_logs l
  where l.org_id = p_org and l.service = 'apify_maps'
  order by l.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 200);
end;
$$;

revoke all on function public.google_maps_search_history(uuid, integer) from public, anon;
grant execute on function public.google_maps_search_history(uuid, integer) to authenticated, service_role;

create or replace function public.google_maps_plan_usage(p_org uuid)
returns table (plan_name text, lead_limit integer, used integer, remaining integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin()
     and not public.pertence_a_org(p_org) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_limit := public.limite_plano(p_org, 'leads');
  select coalesce(c.leads, 0) into v_used
  from public.consumo_org c
  where c.org_id = p_org and c.mes_ref = to_char(now() at time zone 'utc', 'YYYY-MM');
  v_used := coalesce(v_used, 0);

  return query select coalesce(p.nome, 'Sem plano'), v_limit, v_used,
    case when v_limit is null then null else greatest(0, v_limit - v_used) end
  from public.orgs o left join public.planos p on p.id = o.plano_id
  where o.id = p_org;
end;
$$;

revoke all on function public.google_maps_plan_usage(uuid) from public, anon;
grant execute on function public.google_maps_plan_usage(uuid) to authenticated, service_role;

lock table public.leads in share row exclusive mode;
do $$
begin
  if exists (
    select 1 from public.leads l
    where l.list_id is not null
      and not exists (select 1 from public.lead_lists ll where ll.id = l.list_id)
  ) then
    raise exception 'Existem leads órfãos de lead_lists; migration interrompida';
  end if;
end $$;

do $$
declare v_constraint text;
begin
  select c.conname into v_constraint
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
  where c.conrelid = 'public.leads'::regclass
    and c.contype = 'f' and a.attname = 'list_id'
  limit 1;

  if v_constraint is null then
    raise exception 'FK de leads.list_id não encontrada';
  end if;
  execute format('alter table public.leads drop constraint %I', v_constraint);
end $$;

alter table public.leads
  add constraint leads_list_id_fkey foreign key (list_id)
  references public.lead_lists(id) ON DELETE RESTRICT;

commit;
