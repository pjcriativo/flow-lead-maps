-- Controles econômicos específicos da coleta social.
-- Separa Instagram/LinkedIn do orçamento de geração de sites e permite cache curto (7 dias)
-- sem alterar o cache de 30 dias já usado pelo Google Maps.

alter table public.config_plataforma
  add column if not exists teto_redes_rodada_usd numeric(10, 4),
  add column if not exists teto_redes_mes_usd numeric(10, 2);

comment on column public.config_plataforma.teto_redes_rodada_usd is
  'Teto por busca social via Apify; null usa o padrão seguro do código (US$ 0,75).';
comment on column public.config_plataforma.teto_redes_mes_usd is
  'Teto mensal por usuário para coleta social via Apify; null usa o padrão seguro do código (US$ 5).';

create or replace function public.claim_apify_search_cache_v2(
  p_query_key text,
  p_target_depth integer,
  p_ttl_hours integer default 168
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.apify_search_cache%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if nullif(trim(p_query_key), '') is null
     or p_target_depth < 1
     or p_ttl_hours < 1
     or p_ttl_hours > 720 then
    raise exception 'invalid apify cache claim';
  end if;

  insert into public.apify_search_cache (query_key)
  values (p_query_key)
  on conflict (query_key) do nothing;

  select * into v_row
  from public.apify_search_cache
  where query_key = p_query_key
  for update;

  if v_row.refreshed_at >= v_now - make_interval(hours => p_ttl_hours)
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
  -- O Actor pode rodar por até 5 minutos; a reserva precisa sobreviver ao run inteiro
  -- para que uma requisição concorrente nunca abra uma segunda cobrança.
  set refreshing_until = v_now + interval '8 minutes', updated_at = v_now
  where query_key = p_query_key;
  return jsonb_build_object('decision', 'refresh');
end;
$$;

revoke all on function public.claim_apify_search_cache_v2(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_apify_search_cache_v2(text, integer, integer)
  to service_role;

comment on table public.apify_search_cache is
  'Resultados públicos recentes de Actors Apify reutilizados entre contas para evitar runs duplicados.';
