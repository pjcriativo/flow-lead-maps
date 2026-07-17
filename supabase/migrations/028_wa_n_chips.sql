-- WhatsApp: N instâncias (chips) por org, com FUNÇÃO e ORDEM de rodízio.
-- Antes: 1 instância/org. Agora: N. Cada chip é 'disparo' (rodízio a frio) ou 'conversa'
-- (número com histórico — NUNCA dispara frio). status ganha 'queimada' (banido/queimado).
--
-- Vocabulário de status: mantém o existente (desconectado/aguardando/conectado/erro), que o
-- edge e o teste de isolamento já leem/escrevem, e ADICIONA 'queimada' — o único estado novo.
-- (Não renomeei para feminino p/ não churnar o edge e a regressão de isolamento.)
-- RLS por org já existe (wa_instancias "own read" = auth.uid()=user_id); escrita só via edge
-- (service_role). wa_instancia_tokens segue RLS on + 0 policies — NÃO regredir.

alter table public.wa_instancias
  add column if not exists funcao text not null default 'disparo'
    check (funcao in ('disparo', 'conversa'));

alter table public.wa_instancias
  add column if not exists ordem int not null default 0;

-- status += 'queimada'
alter table public.wa_instancias drop constraint if exists wa_instancias_status_check;
alter table public.wa_instancias
  add constraint wa_instancias_status_check
  check (status in ('desconectado', 'aguardando', 'conectado', 'erro', 'queimada'));

-- A instância legada do dono (flowleads / 554197844716) tem HISTÓRICO e é o melhor chip:
-- marcar como 'conversa' para JAMAIS entrar no rodízio de disparo frio.
update public.wa_instancias set funcao = 'conversa' where nome = 'flowleads';
