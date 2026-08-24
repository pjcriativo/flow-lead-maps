-- O próprio livro-caixa passa a funcionar como histórico de consultas pagas por
-- organização. A chave normalizada fica em metadata.query_key; este índice torna
-- barata a verificação que impede a mesma conta de pagar duas vezes em 30 dias.
create index if not exists idx_api_consumption_maps_org_query_created
  on public.api_consumption_logs (
    org_id,
    (metadata ->> 'query_key'),
    created_at desc
  )
  where service = 'apify_maps' and metadata ? 'query_key';
