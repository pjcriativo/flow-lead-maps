-- Rastreabilidade da prospecção multicanal: o lead lembra DE ONDE e POR QUAL ESTRATÉGIA veio.
-- Sem isso não dá para responder a pergunta que importa: "qual estratégia converte mais?".
--
-- MESMO PIPELINE: nada de tabela nova. São colunas opcionais na própria `leads`, então score,
-- redesign, campanha e o funil inteiro continuam funcionando sem mudar uma linha.
-- Nenhuma coleta está ligada ainda — isto é só o lugar pronto para receber.

alter table leads
  -- de qual fonte veio: 'google_maps' | 'instagram' | 'linkedin' (null = base antiga do Maps)
  add column if not exists origem_fonte text,
  -- qual estratégia encontrou: 'IG-1'..'IG-10' | 'LI-1'..'LI-10'
  add column if not exists origem_estrategia text,
  -- LinkedIn: o cargo da PESSOA (owner_name guarda o nome; business_name, a empresa)
  add column if not exists cargo text,
  -- Instagram: seguidores do perfil. NÃO cabe em review_count, que é avaliação do Google —
  -- misturar os dois seria mentir no score.
  add column if not exists seguidores integer;

alter table leads
  drop constraint if exists leads_origem_fonte_check;
alter table leads
  add constraint leads_origem_fonte_check
  check (origem_fonte is null or origem_fonte in ('google_maps', 'instagram', 'linkedin'));

-- "qual estratégia converte mais" é sempre consultado por (dono, estratégia).
create index if not exists idx_leads_origem
  on leads (user_id, origem_fonte, origem_estrategia)
  where origem_fonte is not null;

comment on column leads.origem_fonte is 'Fonte de prospecção que trouxe o lead (google_maps/instagram/linkedin).';
comment on column leads.origem_estrategia is 'Estratégia usada (IG-1..IG-10, LI-1..LI-10) — base para medir conversão por estratégia.';
comment on column leads.cargo is 'Cargo do decisor (LinkedIn). O nome da pessoa fica em owner_name.';
comment on column leads.seguidores is 'Seguidores do perfil (Instagram). Separado de review_count de propósito.';
