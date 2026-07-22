-- SUPER ADMIN (dono da plataforma) — primeiro papel REAL da base.
-- O guard do /admin passa a ler este flag (o e-mail hardcoded vira fallback).
-- Memberships/roles completos continuam como TODO conhecido; isto é o degrau mínimo honesto.

alter table profiles
  add column if not exists is_super_admin boolean not null default false;

comment on column profiles.is_super_admin is
  'Dono da plataforma: acessa o painel /admin. Muda só por SQL/service role — nunca pela UI.';

-- ⚠️ ANTI-AUTOPROMOÇÃO: profiles tem policy de update do próprio perfil; sem esta revogação,
-- qualquer usuário logado faria "update profiles set is_super_admin=true" via API.
revoke update (is_super_admin) on profiles from authenticated, anon;

-- o dono (marcosg1) é o super admin
update profiles set is_super_admin = true
 where id = '087205c1-4243-47d1-86fb-bcbdeb3c8e44';
