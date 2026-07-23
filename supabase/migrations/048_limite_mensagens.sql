-- ═══ FECHA O GAP: mensagens tinha CONTADOR mas não tinha LIMITE configurável ═══
-- A migration 046 mapeava _col_limite('mensagens') → null (sempre ilimitado), então
-- "bater o limite de mensagens" nunca poderia acontecer, mesmo instrumentando o envio.
-- Corrige: planos ganha limite_mensagens (igual aos outros 3 recursos) e o mapeamento passa
-- a apontar pra ele. Sem isso, mensagens seria o único recurso "medido mas nunca aplicado".

alter table planos add column if not exists limite_mensagens integer;

-- seed de referência (mensagens de e-mail + WhatsApp somadas, por mês)
update planos set limite_mensagens = 300  where nome = 'Starter'    and limite_mensagens is null;
update planos set limite_mensagens = 1500 where nome = 'Pro'        and limite_mensagens is null;
update planos set limite_mensagens = 5000 where nome = 'Enterprise' and limite_mensagens is null;

create or replace function _col_limite(p_recurso text) returns text language sql immutable as $$
  select case p_recurso
    when 'leads' then 'limite_leads' when 'sites' then 'limite_sites'
    when 'campanhas' then 'limite_campanhas' when 'mensagens' then 'limite_mensagens'
    else null end
$$;
