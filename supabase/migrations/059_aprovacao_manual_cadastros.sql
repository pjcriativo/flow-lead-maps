-- Novos cadastros precisam de liberação manual do super admin.
--
-- Compatibilidade: as contas que já existiam antes desta migration continuam liberadas.
-- Depois do backfill, o default muda para false e passa a valer somente para novos perfis.
alter table public.profiles
  add column if not exists acesso_liberado boolean not null default true;

alter table public.profiles
  alter column acesso_liberado set default false;

comment on column public.profiles.acesso_liberado is
  'Portão da plataforma: somente super admin libera manualmente novos cadastros.';

-- Impede que a policy de UPDATE do próprio perfil seja usada para autoaprovação.
create or replace function public.protege_acesso_liberado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.acesso_liberado is distinct from old.acesso_liberado
     and auth.uid() is not null then
    new.acesso_liberado := old.acesso_liberado;
  end if;
  return new;
end
$$;

drop trigger if exists trg_protege_acesso_liberado on public.profiles;
create trigger trg_protege_acesso_liberado
  before update on public.profiles
  for each row execute function public.protege_acesso_liberado();

-- Função usada pelas policies restritivas. Super admins nunca ficam trancados fora
-- do painel que controla as liberações.
create or replace function public.acesso_ferramenta_liberado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (acesso_liberado = true or is_super_admin = true)
  );
$$;

revoke all on function public.acesso_ferramenta_liberado() from public;
grant execute on function public.acesso_ferramenta_liberado() to authenticated;

-- Segunda barreira: mesmo chamando o PostgREST diretamente, uma conta pendente não
-- consegue ler ou alterar os recursos privados da ferramenta. Tabelas públicas e o
-- próprio perfil ficam fora para login, página de espera, preços e sites publicados.
do $$
declare
  tabela record;
begin
  for tabela in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = true
      and tablename not in (
        'profiles',
        'config_plataforma',
        'planos',
        'sites_publicados',
        'site_conteudo'
      )
  loop
    execute format(
      'drop policy if exists "Acesso liberado à ferramenta" on public.%I',
      tabela.tablename
    );
    execute format(
      'create policy "Acesso liberado à ferramenta" on public.%I as restrictive for all to authenticated using (public.acesso_ferramenta_liberado()) with check (public.acesso_ferramenta_liberado())',
      tabela.tablename
    );
  end loop;
end
$$;
