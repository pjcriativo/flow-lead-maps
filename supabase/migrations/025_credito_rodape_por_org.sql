-- MARCA FORA DO OUTPUT: o rodapé do site gerado dizia "Site desenvolvido com Flow Leads".
-- O lead é prospect da AGÊNCIA, não cliente da plataforma — ele rolava até o rodapé e via a
-- ferramenta. (A plataforma segue 100% Flow Leads; isto é só o que chega no lead.)
--
-- Default NULL = SEM crédito nenhum. Se a org quiser assinar o site ("Site por Agência X"),
-- preenche aqui. Nunca volta a citar a plataforma.
alter table public.profiles add column if not exists site_credito text;

comment on column public.profiles.site_credito is
  'Crédito opcional no rodapé do site gerado (ex.: "Site por Agência X"). NULL = sem crédito. Nunca cita a plataforma.';
