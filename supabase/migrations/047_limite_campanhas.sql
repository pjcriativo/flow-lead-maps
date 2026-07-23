-- ═══ BILLING — fecha o contador que faltava: CAMPANHAS ═══
-- Campanhas nascem por INSERT direto do client (3 pontos em src/services/campanhas.ts, sem
-- Edge própria) — o único jeito de aplicar o limite SEM CONFIAR no client, e que vale para
-- qualquer caminho futuro de criação, é um TRIGGER de banco (mesmo padrão de trg_org_id e
-- trg_protege_super_admin já usados no projeto).
--
-- Reusa a MESMA função consumir_ou_bloquear (fonte única do teto por plano — migration 046).
-- Nome do trigger começa com "trg_z_" de propósito: triggers BEFORE rodam em ordem alfabética
-- do nome, e este precisa rodar DEPOIS de trg_org_id (que preenche NEW.org_id). Por segurança,
-- a função também resolve org_id sozinha se ainda vier nulo.
create or replace function aplicar_limite_campanhas()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := coalesce(new.org_id, org_do_usuario(new.user_id));
  v_res jsonb;
begin
  if v_org is null then return new; end if; -- sem org (não deveria acontecer) — não bloqueia
  v_res := consumir_ou_bloquear(v_org, 'campanhas', 1);
  if (v_res->>'ok')::boolean is false then
    raise exception using
      message = format(
        'Limite de campanhas do plano atingido: %s/%s neste mês. Faça upgrade do plano para criar mais.',
        v_res->>'usado', v_res->>'limite'),
      errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_z_limite_campanhas on campanhas;
create trigger trg_z_limite_campanhas
  before insert on campanhas
  for each row execute function aplicar_limite_campanhas();
