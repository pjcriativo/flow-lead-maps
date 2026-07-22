-- CORREÇÃO DE SEGURANÇA (achada pela prova-papeis adversarial):
-- o `revoke update (is_super_admin)` da 041 NÃO impede a autopromoção — o Supabase concede
-- UPDATE de tabela inteira ao papel `authenticated`, e revoke de COLUNA não anula grant de
-- TABELA. Um usuário logado conseguia `update profiles set is_super_admin=true where id=<eu>`.
--
-- Trava real: trigger BEFORE UPDATE. Qualquer sessão AUTENTICADA (auth.uid() não nulo) que
-- tente mudar is_super_admin tem a mudança IGNORADA (mantém o valor antigo). Só o service_role
-- e o postgres (auth.uid() nulo — Edge admin, migrations) podem alterar o flag.
create or replace function protege_super_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_super_admin is distinct from old.is_super_admin and auth.uid() is not null then
    new.is_super_admin := old.is_super_admin; -- tentativa de cliente logado → ignorada
  end if;
  return new;
end $$;

drop trigger if exists trg_protege_super_admin on profiles;
create trigger trg_protege_super_admin
  before update on profiles
  for each row execute function protege_super_admin();
