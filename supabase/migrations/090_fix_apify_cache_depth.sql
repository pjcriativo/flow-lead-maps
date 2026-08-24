-- O cache legado de Maps gravava a profundidade pedida como se fosse a quantidade
-- realmente devolvida. A v3 mantém as duas medidas separadas e marca quando a fonte
-- foi esgotada, evitando repetir uma cobrança que não encontrará novos lugares.
update public.apify_search_cache
set requested_depth = greatest(requested_depth, searched_depth),
    searched_depth = jsonb_array_length(items),
    exhausted = jsonb_array_length(items) < greatest(requested_depth, searched_depth),
    updated_at = clock_timestamp()
where query_key like 'apify-google-maps-v1|%';
