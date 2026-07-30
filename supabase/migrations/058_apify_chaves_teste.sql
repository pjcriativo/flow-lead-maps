-- UX do pool Apify: o resultado do "Testar chave" agora PERSISTE — cada chave mostra
-- sempre "✓ Testada em <data> · crédito X" / "✗ Falha: <motivo real da Apify>" /
-- "— Nunca testada". Sem campo vazio e mudo.
alter table apify_chaves
  add column if not exists testada_em timestamptz,
  add column if not exists teste_ok boolean,
  add column if not exists teste_detalhe text;
