-- Habilitacao global da conexao oficial do Instagram.
-- A escrita continua restrita a Edge admin-acoes, protegida por is_super_admin.
alter table public.config_plataforma
  add column if not exists instagram_oauth_ativo boolean not null default false;

comment on column public.config_plataforma.instagram_oauth_ativo is
  'Permite iniciar novas conexoes oficiais do Instagram quando todos os secrets OAuth estiverem configurados.';
