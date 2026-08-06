-- Cache compartilhado e trava anti-estouro para pesquisas Google Maps via Apify.
-- O cache guarda somente dados públicos de empresas já devolvidos pelo Actor.
create table if not exists public.apify_search_cache (
  query_key text primary key,
  items jsonb not null default '[]'::jsonb,
  searched_depth integer not null default 0 check (searched_depth >= 0),
  refreshed_at timestamptz,
  refreshing_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.apify_search_cache enable row level security;
revoke all on public.apify_search_cache from anon, authenticated;

create or replace function public.claim_apify_search_cache(
  p_query_key text,
  p_target_depth integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.apify_search_cache%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if nullif(trim(p_query_key), '') is null or p_target_depth < 1 then
    raise exception 'invalid apify cache claim';
  end if;

  insert into public.apify_search_cache (query_key)
  values (p_query_key)
  on conflict (query_key) do nothing;

  select * into v_row
  from public.apify_search_cache
  where query_key = p_query_key
  for update;

  if v_row.refreshed_at >= v_now - interval '30 days'
     and v_row.searched_depth >= p_target_depth then
    return jsonb_build_object(
      'decision', 'cache',
      'items', v_row.items,
      'searched_depth', v_row.searched_depth
    );
  end if;

  if v_row.refreshing_until is not null and v_row.refreshing_until > v_now then
    return jsonb_build_object('decision', 'wait');
  end if;

  update public.apify_search_cache
  set refreshing_until = v_now + interval '3 minutes', updated_at = v_now
  where query_key = p_query_key;
  return jsonb_build_object('decision', 'refresh');
end;
$$;

create or replace function public.store_apify_search_cache(
  p_query_key text,
  p_searched_depth integer,
  p_items jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_items) <> 'array' or p_searched_depth < 1 then
    raise exception 'invalid apify cache payload';
  end if;

  insert into public.apify_search_cache (
    query_key, items, searched_depth, refreshed_at, refreshing_until, updated_at
  ) values (
    p_query_key, p_items, p_searched_depth, clock_timestamp(), null, clock_timestamp()
  )
  on conflict (query_key) do update
  set items = excluded.items,
      searched_depth = excluded.searched_depth,
      refreshed_at = excluded.refreshed_at,
      refreshing_until = null,
      updated_at = excluded.updated_at;
end;
$$;

create or replace function public.release_apify_search_cache(p_query_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.apify_search_cache
  set refreshing_until = null, updated_at = clock_timestamp()
  where query_key = p_query_key;
$$;

revoke all on function public.claim_apify_search_cache(text, integer) from public, anon, authenticated;
revoke all on function public.store_apify_search_cache(text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.release_apify_search_cache(text) from public, anon, authenticated;
grant execute on function public.claim_apify_search_cache(text, integer) to service_role;
grant execute on function public.store_apify_search_cache(text, integer, jsonb) to service_role;
grant execute on function public.release_apify_search_cache(text) to service_role;

comment on table public.apify_search_cache is
  'Resultados públicos recentes do Google Maps reutilizados para evitar runs Apify duplicados.';
