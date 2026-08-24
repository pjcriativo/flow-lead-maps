-- Catálogo global de empresas já descobertas. O CRM continua isolado por organização;
-- somente os dados públicos usados na prospecção são compartilhados para evitar novas cobranças.

create or replace function public.normalize_search_term(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select btrim(
    regexp_replace(
      translate(
        lower(trim(coalesce(p_value, ''))),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  )
$$;

create table if not exists public.lead_niche_aliases (
  alias_key text primary key,
  family_key text not null,
  family_label text not null,
  created_at timestamptz not null default now()
);

insert into public.lead_niche_aliases (alias_key, family_key, family_label) values
  ('dentista', 'odontologia', 'Odontologia'),
  ('dentistas', 'odontologia', 'Odontologia'),
  ('odontologia', 'odontologia', 'Odontologia'),
  ('clinica odontologica', 'odontologia', 'Odontologia'),
  ('consultorio odontologico', 'odontologia', 'Odontologia'),
  ('advogado', 'advocacia', 'Advocacia'),
  ('advogados', 'advocacia', 'Advocacia'),
  ('advocacia', 'advocacia', 'Advocacia'),
  ('escritorio de advocacia', 'advocacia', 'Advocacia'),
  ('pet shop', 'pet shop', 'Pet shop'),
  ('loja de animais', 'pet shop', 'Pet shop'),
  ('banho e tosa', 'pet shop', 'Pet shop'),
  ('academia', 'academia', 'Academia'),
  ('academia de ginastica', 'academia', 'Academia'),
  ('centro de treinamento', 'academia', 'Academia'),
  ('imobiliaria', 'imobiliaria', 'Imobiliária'),
  ('corretora de imoveis', 'imobiliaria', 'Imobiliária'),
  ('restaurante', 'restaurante', 'Restaurante'),
  ('restaurantes', 'restaurante', 'Restaurante'),
  ('pizzaria', 'pizzaria', 'Pizzaria'),
  ('clinica medica', 'clinica medica', 'Clínica médica'),
  ('clinica de saude', 'clinica medica', 'Clínica médica'),
  ('contabilidade', 'contabilidade', 'Contabilidade'),
  ('contador', 'contabilidade', 'Contabilidade'),
  ('escritorio contabil', 'contabilidade', 'Contabilidade'),
  ('barbearia', 'barbearia', 'Barbearia'),
  ('salao de beleza', 'salao de beleza', 'Salão de beleza'),
  ('estetica', 'estetica', 'Estética'),
  ('clinica de estetica', 'estetica', 'Estética')
on conflict (alias_key) do update
set family_key = excluded.family_key,
    family_label = excluded.family_label;

create or replace function public.canonical_lead_niche_key(p_value text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select a.family_key
      from public.lead_niche_aliases a
      where a.alias_key = public.normalize_search_term(p_value)
    ),
    public.normalize_search_term(p_value)
  )
$$;

create table if not exists public.lead_catalog (
  place_id text primary key,
  business_key text,
  source text not null,
  name text not null,
  category text,
  address text,
  phone text,
  website text,
  rating numeric(4, 2),
  review_count integer,
  instagram text,
  facebook text,
  latitude double precision,
  longitude double precision,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lead_catalog_business
  on public.lead_catalog (business_key)
  where business_key is not null;
create index if not exists idx_lead_catalog_location
  on public.lead_catalog (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists idx_lead_catalog_last_seen
  on public.lead_catalog (last_seen_at desc);

create table if not exists public.lead_catalog_hits (
  query_key text not null,
  place_id text not null references public.lead_catalog(place_id) on delete cascade,
  niche_family text not null,
  area_kind text not null check (area_kind in ('cidade', 'mapa')),
  city_key text not null default '',
  state_key text not null default '',
  center_lat double precision,
  center_lng double precision,
  radius_km numeric(8, 2),
  result_rank integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (query_key, place_id)
);

create index if not exists idx_lead_catalog_hits_city
  on public.lead_catalog_hits (niche_family, city_key, state_key, last_seen_at desc)
  where area_kind = 'cidade';
create index if not exists idx_lead_catalog_hits_map
  on public.lead_catalog_hits (niche_family, last_seen_at desc)
  where area_kind = 'mapa';

create table if not exists public.lead_search_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  query_key text not null,
  niche text not null,
  city text,
  state text,
  requested integer not null check (requested >= 0),
  catalog_returned integer not null default 0 check (catalog_returned >= 0),
  cache_returned integer not null default 0 check (cache_returned >= 0),
  provider_returned integer not null default 0 check (provider_returned >= 0),
  returned_candidates integer not null default 0 check (returned_candidates >= 0),
  duplicates_avoided integer not null default 0 check (duplicates_avoided >= 0),
  paid_run_started boolean not null default false,
  reason text not null check (
    reason in ('catalog', 'cache', 'catalog_cache', 'recent_paid', 'source_exhausted', 'paid_expansion')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_search_events_created
  on public.lead_search_events (created_at desc);
create index if not exists idx_lead_search_events_org_created
  on public.lead_search_events (org_id, created_at desc);
create index if not exists idx_lead_search_events_query
  on public.lead_search_events (query_key, created_at desc);

alter table public.lead_niche_aliases enable row level security;
alter table public.lead_catalog enable row level security;
alter table public.lead_catalog_hits enable row level security;
alter table public.lead_search_events enable row level security;
revoke all on public.lead_niche_aliases, public.lead_catalog, public.lead_catalog_hits,
  public.lead_search_events from anon, authenticated;
grant select, insert, update on public.lead_niche_aliases, public.lead_catalog,
  public.lead_catalog_hits, public.lead_search_events to service_role;

create or replace function public.store_shared_lead_catalog(
  p_query_key text,
  p_niche text,
  p_area_kind text,
  p_city text,
  p_state text,
  p_center_lat double precision,
  p_center_lng double precision,
  p_radius_km numeric,
  p_items jsonb
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family text;
  v_count integer := 0;
begin
  if nullif(trim(p_query_key), '') is null
     or nullif(trim(p_niche), '') is null
     or p_area_kind not in ('cidade', 'mapa')
     or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid shared lead catalog payload';
  end if;

  v_family := public.canonical_lead_niche_key(p_niche);

  with source_rows as (
    select item, ordinality::integer as result_rank
    from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality)
    where nullif(trim(item ->> 'source_id'), '') is not null
      and nullif(trim(item ->> 'name'), '') is not null
  )
  insert into public.lead_catalog (
    place_id, business_key, source, name, category, address, phone, website,
    rating, review_count, instagram, facebook, latitude, longitude,
    first_seen_at, last_seen_at, updated_at
  )
  select
    item ->> 'source_id',
    public.lead_business_identity(item ->> 'name', item ->> 'address'),
    coalesce(nullif(item ->> 'source', ''), 'apify'),
    item ->> 'name',
    nullif(item ->> 'category', ''),
    nullif(item ->> 'address', ''),
    nullif(item ->> 'phone', ''),
    nullif(item ->> 'website', ''),
    case when jsonb_typeof(item -> 'rating') = 'number' then (item ->> 'rating')::numeric end,
    case when jsonb_typeof(item -> 'review_count') = 'number' then (item ->> 'review_count')::integer end,
    nullif(item ->> 'instagram', ''),
    nullif(item ->> 'facebook', ''),
    case when jsonb_typeof(item -> 'lat') = 'number' then (item ->> 'lat')::double precision end,
    case when jsonb_typeof(item -> 'lng') = 'number' then (item ->> 'lng')::double precision end,
    clock_timestamp(), clock_timestamp(), clock_timestamp()
  from source_rows
  on conflict (place_id) do update
  set business_key = coalesce(excluded.business_key, lead_catalog.business_key),
      source = excluded.source,
      name = excluded.name,
      category = coalesce(excluded.category, lead_catalog.category),
      address = coalesce(excluded.address, lead_catalog.address),
      phone = coalesce(excluded.phone, lead_catalog.phone),
      website = coalesce(excluded.website, lead_catalog.website),
      rating = coalesce(excluded.rating, lead_catalog.rating),
      review_count = coalesce(excluded.review_count, lead_catalog.review_count),
      instagram = coalesce(excluded.instagram, lead_catalog.instagram),
      facebook = coalesce(excluded.facebook, lead_catalog.facebook),
      latitude = coalesce(excluded.latitude, lead_catalog.latitude),
      longitude = coalesce(excluded.longitude, lead_catalog.longitude),
      last_seen_at = clock_timestamp(),
      updated_at = clock_timestamp();

  with source_rows as (
    select item, ordinality::integer as result_rank
    from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality)
    where nullif(trim(item ->> 'source_id'), '') is not null
  )
  insert into public.lead_catalog_hits (
    query_key, place_id, niche_family, area_kind, city_key, state_key,
    center_lat, center_lng, radius_km, result_rank, first_seen_at, last_seen_at
  )
  select
    p_query_key,
    item ->> 'source_id',
    v_family,
    p_area_kind,
    public.normalize_search_term(p_city),
    public.normalize_search_term(p_state),
    p_center_lat,
    p_center_lng,
    p_radius_km,
    result_rank,
    clock_timestamp(),
    clock_timestamp()
  from source_rows
  where exists (
    select 1 from public.lead_catalog c where c.place_id = item ->> 'source_id'
  )
  on conflict (query_key, place_id) do update
  set niche_family = excluded.niche_family,
      area_kind = excluded.area_kind,
      city_key = excluded.city_key,
      state_key = excluded.state_key,
      center_lat = excluded.center_lat,
      center_lng = excluded.center_lng,
      radius_km = excluded.radius_km,
      result_rank = excluded.result_rank,
      last_seen_at = clock_timestamp();

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

create or replace function public.search_shared_lead_catalog(
  p_org_id uuid,
  p_niche text,
  p_city text,
  p_state text,
  p_use_map boolean,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_limit integer,
  p_max_age_days integer default 90
) returns table (
  source text,
  source_id text,
  name text,
  category text,
  address text,
  phone text,
  website text,
  rating double precision,
  review_count integer,
  instagram text,
  facebook text,
  lat double precision,
  lng double precision
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family text;
  v_limit integer;
  v_age integer;
begin
  if p_org_id is null or nullif(trim(p_niche), '') is null then
    raise exception 'invalid shared lead catalog search';
  end if;
  v_family := public.canonical_lead_niche_key(p_niche);
  v_limit := least(500, greatest(0, coalesce(p_limit, 0)));
  v_age := least(365, greatest(1, coalesce(p_max_age_days, 90)));

  return query
  with candidates as (
    select
      c.*,
      row_number() over (
        partition by coalesce(c.business_key, c.place_id)
        order by
          ((c.phone is not null)::integer * 30
            + (c.website is not null)::integer * 20
            + (c.instagram is not null)::integer * 10
            + least(coalesce(c.review_count, 0), 500) / 25) desc,
          c.last_seen_at desc,
          h.result_rank asc
      ) as identity_rank
    from public.lead_catalog c
    join public.lead_catalog_hits h on h.place_id = c.place_id
    where h.niche_family = v_family
      and c.last_seen_at >= clock_timestamp() - make_interval(days => v_age)
      and (
        (
          not coalesce(p_use_map, false)
          and h.area_kind = 'cidade'
          and h.city_key = public.normalize_search_term(p_city)
          and h.state_key = public.normalize_search_term(p_state)
        )
        or (
          coalesce(p_use_map, false)
          and p_lat is not null
          and p_lng is not null
          and c.latitude is not null
          and c.longitude is not null
          and 6371 * acos(
            least(1, greatest(-1,
              cos(radians(p_lat)) * cos(radians(c.latitude))
              * cos(radians(c.longitude) - radians(p_lng))
              + sin(radians(p_lat)) * sin(radians(c.latitude))
            ))
          ) <= greatest(0.1, coalesce(p_radius_km, 10))
        )
      )
      and not exists (
        select 1
        from public.lead_seen_registry seen
        where seen.org_id = p_org_id
          and (
            seen.place_id = c.place_id
            or (c.business_key is not null and seen.business_key = c.business_key)
          )
      )
  )
  select
    c.source,
    c.place_id,
    c.name,
    c.category,
    c.address,
    c.phone,
    c.website,
    c.rating::double precision,
    c.review_count,
    c.instagram,
    c.facebook,
    c.latitude,
    c.longitude
  from candidates c
  where c.identity_rank = 1
  order by
    ((c.phone is not null)::integer * 30
      + (c.website is not null)::integer * 20
      + (c.instagram is not null)::integer * 10
      + least(coalesce(c.review_count, 0), 500) / 25) desc,
    c.last_seen_at desc
  limit v_limit;
end
$$;

revoke all on function public.normalize_search_term(text) from public, anon, authenticated;
revoke all on function public.canonical_lead_niche_key(text) from public, anon, authenticated;
revoke all on function public.store_shared_lead_catalog(
  text, text, text, text, text, double precision, double precision, numeric, jsonb
) from public, anon, authenticated;
revoke all on function public.search_shared_lead_catalog(
  uuid, text, text, text, boolean, double precision, double precision, double precision, integer, integer
) from public, anon, authenticated;
grant execute on function public.store_shared_lead_catalog(
  text, text, text, text, text, double precision, double precision, numeric, jsonb
) to service_role;
grant execute on function public.search_shared_lead_catalog(
  uuid, text, text, text, boolean, double precision, double precision, double precision, integer, integer
) to service_role;

-- Aproveita imediatamente o estoque já pago que ainda está no cache de Maps.
do $$
declare
  cache_row record;
  parts text[];
  area_kind text;
begin
  for cache_row in
    select query_key, items
    from public.apify_search_cache
    where query_key like 'apify-google-maps-v1|%'
      and jsonb_typeof(items) = 'array'
      and jsonb_array_length(items) > 0
  loop
    parts := string_to_array(cache_row.query_key, '|');
    area_kind := case when parts[3] = 'mapa' then 'mapa' else 'cidade' end;
    perform public.store_shared_lead_catalog(
      cache_row.query_key,
      coalesce(parts[2], ''),
      area_kind,
      case when area_kind = 'cidade' then coalesce(parts[4], '') else '' end,
      case when area_kind = 'cidade' then coalesce(parts[5], '') else '' end,
      case when area_kind = 'mapa' then nullif(parts[4], '')::double precision else null end,
      case when area_kind = 'mapa' then nullif(parts[5], '')::double precision else null end,
      case when area_kind = 'mapa' then nullif(parts[6], '')::numeric else null end,
      cache_row.items
    );
  end loop;
end
$$;

comment on table public.lead_catalog is
  'Catálogo global de empresas públicas já descobertas, reutilizado antes de qualquer busca paga.';
comment on table public.lead_catalog_hits is
  'Associa cada empresa aos nichos equivalentes e áreas em que ela foi encontrada.';
comment on table public.lead_search_events is
  'Telemetria base-first: estoque reutilizado, duplicatas evitadas e necessidade real de run pago.';
