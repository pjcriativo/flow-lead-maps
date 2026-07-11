-- Fase 1 — Prospecção e qualificação (Brasil)
-- Complementa o schema de `leads` para busca via Google Places + score cliente-ouro.

-- WhatsApp separado do telefone (formato internacional 55+DDD+numero, pronto p/ wa.me)
alter table public.leads add column if not exists whatsapp text;

-- Momento do enriquecimento (visita ao site: e-mail/whatsapp/qualidade)
alter table public.leads add column if not exists enriched_at timestamptz;

-- Dedupe forte por dono + place_id do Google (evita lead duplicado entre buscas).
-- Parcial: só quando place_id existe. Permite upsert on conflict.
create unique index if not exists uq_leads_user_place
  on public.leads (user_id, place_id)
  where place_id is not null;
