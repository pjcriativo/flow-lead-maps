-- config_plataforma passa a ter LEITURA PÚBLICA (igual site_conteudo) — necessário porque
-- nome_plataforma/logo_url/favicon_url (migration 054) precisam aparecer na landing PÚBLICA
-- (/ e /pricing), servida sem login. Nenhum campo aqui é secreto: chaves de API de verdade
-- vivem em config_chaves, que continua SEM NENHUMA policy de client (só service role).
drop policy if exists config_plataforma_sel on config_plataforma;
create policy config_plataforma_sel on config_plataforma for select using (true);
