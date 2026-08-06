-- Deduplicação permanente por conta.
-- A identidade do lead pertence à organização, não ao usuário que executou a busca.

create table if not exists public.lead_seen_registry (
  org_id uuid not null references public.orgs(id) on delete cascade,
  place_id text not null,
  business_key text,
  first_user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  primary key (org_id, place_id)
);

alter table public.lead_seen_registry
  add column if not exists business_key text;

create or replace function public.normalize_lead_identity_part(p_value text)
returns text
language sql
immutable
strict
set search_path = public
as $$
  select regexp_replace(
    translate(
      lower(trim(p_value)),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ),
    '[^a-z0-9]+',
    '',
    'g'
  )
$$;

create or replace function public.lead_business_identity(p_name text, p_address text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when nullif(public.normalize_lead_identity_part(p_name), '') is null
      or nullif(public.normalize_lead_identity_part(p_address), '') is null
      then null
    else public.normalize_lead_identity_part(p_name)
      || '|'
      || public.normalize_lead_identity_part(p_address)
  end
$$;

alter table public.lead_seen_registry enable row level security;
revoke all on public.lead_seen_registry from anon, authenticated;
grant select, insert on public.lead_seen_registry to service_role;

insert into public.lead_seen_registry (org_id, place_id, first_user_id, first_seen_at)
select distinct on (l.org_id, l.place_id)
  l.org_id,
  l.place_id,
  l.user_id,
  l.created_at
from public.leads l
where l.org_id is not null and l.place_id is not null
order by l.org_id, l.place_id, l.created_at, l.id
on conflict (org_id, place_id) do nothing;

update public.lead_seen_registry registry
set business_key = public.lead_business_identity(lead.business_name, lead.address)
from public.leads lead
where lead.org_id = registry.org_id
  and lead.place_id = registry.place_id
  and registry.business_key is null
  and public.lead_business_identity(lead.business_name, lead.address) is not null;

create unique index if not exists uq_lead_seen_org_business
  on public.lead_seen_registry (org_id, business_key)
  where business_key is not null;

create unique index if not exists uq_leads_org_place
  on public.leads (org_id, place_id);

create unique index if not exists uq_leads_org_business
  on public.leads (org_id, public.lead_business_identity(business_name, address))
  where public.lead_business_identity(business_name, address) is not null;

-- Mantém o índice legado durante a transição de todas as rotas de ingestão. Ele é redundante,
-- mas compatível; a garantia nova e mais forte é uq_leads_org_place + o registro permanente.
create unique index if not exists uq_leads_user_place
  on public.leads (user_id, place_id);

create or replace function public.registrar_lead_inedito_da_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed_place_id text;
  v_business_key text;
begin
  if new.place_id is null then
    return new;
  end if;

  if new.org_id is null then
    raise exception 'lead com place_id exige org_id';
  end if;

  v_business_key := public.lead_business_identity(new.business_name, new.address);

  insert into public.lead_seen_registry (org_id, place_id, business_key, first_user_id)
  values (new.org_id, new.place_id, v_business_key, new.user_id)
  on conflict do nothing
  returning place_id into v_claimed_place_id;

  if v_claimed_place_id is null then
    return null;
  end if;

  return new;
end
$$;

drop trigger if exists trg_z_lead_dedupe_registry on public.leads;
create trigger trg_z_lead_dedupe_registry
  before insert on public.leads
  for each row execute function public.registrar_lead_inedito_da_org();

revoke all on function public.registrar_lead_inedito_da_org() from public, anon, authenticated;
revoke all on function public.normalize_lead_identity_part(text) from public, anon, authenticated;
revoke all on function public.lead_business_identity(text, text) from public, anon, authenticated;

comment on table public.lead_seen_registry is
  'Histórico permanente de estabelecimentos já entregues por organização; não é apagado junto com um lead.';
comment on function public.registrar_lead_inedito_da_org() is
  'Reserva atomicamente o place_id e a identidade normalizada do estabelecimento por organização.';
