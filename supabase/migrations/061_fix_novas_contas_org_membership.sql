-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 061: Correção definitiva de Orgs e Memberships para Novas Contas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA IDENTIFICADO:
-- Novas contas criadas após a migration 042 não recebiam registros em `orgs` e
-- `memberships` no trigger `handle_new_user()`.
-- Consequentemente, ao buscar leads, o `org_id` ficava NULL. Devido às regras de
-- RLS (`pode_ver_lead`), a busca gravava no banco, mas a consulta do frontend
-- retornava 0 leads (bloqueado pela RLS para non-super-admins).
--
-- SOLUÇÃO:
-- 1. Atualizar `handle_new_user()` para criar automaticamente a Org e a Membership (admin).
-- 2. Fazer backfill de Orgs e Memberships para todas as contas atuais sem org.
-- 3. Atualizar `leads.org_id` para todas as buscas/leads antigos com `org_id IS NULL`.

-- 1. Atualiza o trigger handle_new_user() para criar Org + Membership automaticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Insere ou atualiza o perfil do usuário
  insert into public.profiles (id, email, full_name, phone, plan, acesso_liberado)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'telefone', ''),
    'starter',
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone);

  -- Garante que o novo usuário possua uma Organização
  select id into v_org_id from public.orgs where dono_user_id = new.id limit 1;
  
  if v_org_id is null then
    insert into public.orgs (nome, dono_user_id)
    values (
      coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
      new.id
    )
    returning id into v_org_id;
  end if;

  -- Garante o vínculo do usuário como ADMIN de sua própria Org
  if v_org_id is not null then
    insert into public.memberships (org_id, user_id, papel)
    values (v_org_id, new.id, 'admin')
    on conflict (org_id, user_id) do nothing;

    insert into public.org_papeis (org_id, papel, ativo)
    select v_org_id, p.papel, true
    from (select unnest(enum_range(null::public.papel_org)) as papel) p
    where p.papel <> 'super_admin'
    on conflict (org_id, papel) do nothing;
  end if;

  return new;
end;
$$;

-- 2. BACKFILL: Criar Orgs para usuários existentes que não possuem org
insert into public.orgs (nome, dono_user_id)
select coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)), p.id
from public.profiles p
where not exists (select 1 from public.orgs o where o.dono_user_id = p.id);

-- 3. BACKFILL: Criar Memberships para as orgs criadas
insert into public.memberships (org_id, user_id, papel)
select o.id, o.dono_user_id, 'admin'::public.papel_org
from public.orgs o
on conflict (org_id, user_id) do nothing;

-- 4. BACKFILL: Habilitar papéis da org
insert into public.org_papeis (org_id, papel, ativo)
select o.id, p.papel, true
from public.orgs o
cross join (select unnest(enum_range(null::public.papel_org)) as papel) p
where p.papel <> 'super_admin'
on conflict (org_id, papel) do nothing;

-- 5. BACKFILL DE LEADS: Corrigir leads existentes com org_id NULL
update public.leads l
set org_id = public.org_do_usuario(l.user_id)
where l.org_id is null and l.user_id is not null;
