-- Fase 1 — Prospecção e qualificação (Brasil)
-- Complementa o schema de `leads` para busca via Google Places + score cliente-ouro.

-- WhatsApp separado do telefone (formato internacional 55+DDD+numero, pronto p/ wa.me)
alter table public.leads add column if not exists whatsapp text;

-- Momento do enriquecimento (visita ao site: e-mail/whatsapp/qualidade)
alter table public.leads add column if not exists enriched_at timestamptz;

-- Dedupe forte por dono + place_id da fonte (evita lead duplicado entre buscas).
-- Índice CHEIO (não parcial): o upsert on_conflict do PostgREST não casa com
-- índice parcial. NULLs são distintos no Postgres, então leads manuais sem
-- place_id continuam permitidos em quantidade.
drop index if exists public.uq_leads_user_place;
create unique index if not exists uq_leads_user_place
  on public.leads (user_id, place_id);
