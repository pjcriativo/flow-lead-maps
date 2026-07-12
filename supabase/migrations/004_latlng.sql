-- Fase 1 — coordenadas do lead (OSM/Geoapify já retornam lat/lng).
-- Permite busca por raio e exibição no mapa (front).
alter table public.leads add column if not exists latitude double precision;
alter table public.leads add column if not exists longitude double precision;
