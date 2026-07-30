-- Migration 060: Adiciona coluna phone e garante default false para acesso_liberado no trigger handle_new_user
alter table public.profiles add column if not exists phone text;

comment on column public.profiles.phone is 'Telefone / WhatsApp de contato do usuário';

alter table public.profiles add column if not exists acesso_liberado boolean not null default false;
alter table public.profiles alter column acesso_liberado set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
  return new;
end;
$$;
