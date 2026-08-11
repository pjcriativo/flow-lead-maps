-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 074: Validação Rigorosa de E-mails Autênticos
-- ═══════════════════════════════════════════════════════════════════════════
-- Impede o cadastro e a liberação de acesso de contas com e-mails falsos,
-- temporários ou de teste (@teste, @fake, @test.com, etc.).

create or replace function public.is_authentic_email(p_email text)
returns boolean
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user text;
  v_domain text;
begin
  if p_email is null or trim(p_email) = '' then
    return false;
  end if;

  v_email := lower(trim(p_email));

  -- 1. Validação de formato (sintaxe basica)
  if v_email !~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' then
    return false;
  end if;

  v_user := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- Tamanho mínimo do nome do usuário
  if length(v_user) < 2 then
    return false;
  end if;

  -- Nomes de usuário proibidos
  if v_user in ('teste', 'test', 'admin', 'fake', 'asdf', 'qwerty', '123456', 'usuario', 'user', 'abc') then
    return false;
  end if;

  -- Exceção para e-mails de teste do sistema interno (ex: @flowleads.local ou @flowleads.app)
  if v_domain like '%flowleads.local' or v_domain like '%flowleads.app' then
    return true;
  end if;

  -- 2. TLDs / Extensões proibidas
  if v_domain like '%.test' or v_domain like '%.teste' or v_domain like '%.invalid' or v_domain like '%.fake' or v_domain like '%.tmp' or v_domain like '%.temp' then
    return false;
  end if;

  -- 3. Domínios bloqueados conhecidos
  if v_domain in (
    'teste.com', 'teste.com.br', 'test.com', 'test.com.br',
    'example.com', 'fake.com', 'invalid.com', 'temp.com',
    'tempmail.com', 'trashmail.com', 'mailinator.com', 'yopmail.com',
    'disposable.com', '10minutemail.com', 'guerrillamail.com',
    'sharklasers.com', 'throwaway.com', 'fakeinbox.com', 'minitts.net',
    'dispostable.com', 'getairmail.com', 'mailnesia.com', 'maildrop.cc',
    'crazymailing.com', 'mohmal.com', 'mailcatch.com'
  ) then
    return false;
  end if;

  -- 4. Palavras-chave proibidas no domínio
  if v_domain like '%teste%' or v_domain like '%test%' or v_domain like '%fake%'
     or v_domain like '%invalid%' or v_domain like '%disposable%' or v_domain like '%trashmail%'
     or v_domain like '%tempmail%' or v_domain like '%10minute%' or v_domain like '%yopmail%'
     or v_domain like '%mailinator%' or v_domain like '%throwaway%' then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.is_authentic_email(text) from public;
grant execute on function public.is_authentic_email(text) to anon, authenticated, service_role;

-- 5. Atualiza handle_new_user para rejeitar e-mails não autênticos
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Rejeita imediatamente no banco se o e-mail for falso ou de teste
  if not public.is_authentic_email(new.email) then
    raise exception 'E-mail "%" inválido ou descartável. Utilize um e-mail autêntico.', new.email;
  end if;

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

-- 6. Trigger de proteção em profiles para proibir liberação de acesso a e-mails falsos
create or replace function public.check_authentic_email_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.acesso_liberado = true and not public.is_authentic_email(new.email) then
    raise exception 'Não é permitido liberar acesso para a conta "%" pois o e-mail é de teste ou inválido.', new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_check_authentic_email on public.profiles;
create trigger tr_check_authentic_email
  before insert or update on public.profiles
  for each row
  execute function public.check_authentic_email_trigger();
