-- Fase 4 do Instagram Prospect Engine: score multidimensional e explicavel.

alter table public.instagram_profiles
  add column if not exists lead_score integer check (lead_score between 0 and 100),
  add column if not exists fit_score integer check (fit_score between 0 and 100),
  add column if not exists activity_score integer check (activity_score between 0 and 100),
  add column if not exists score_v2 jsonb not null default '{}'::jsonb;

create index if not exists instagram_profiles_org_lead_score_idx
  on public.instagram_profiles (org_id, lead_score desc nulls last, collected_at desc);
create index if not exists instagram_profiles_org_intent_score_idx
  on public.instagram_profiles (org_id, intent_score desc nulls last, collected_at desc);

alter table public.instagram_search_results
  add column if not exists intent_score integer check (intent_score between 0 and 100),
  add column if not exists fit_score integer check (fit_score between 0 and 100),
  add column if not exists activity_score integer check (activity_score between 0 and 100),
  add column if not exists authenticity_score integer check (authenticity_score between 0 and 100),
  add column if not exists score_v2 jsonb not null default '{}'::jsonb;

alter table public.instagram_profile_evidence
  add column if not exists fit_score integer check (fit_score between 0 and 100),
  add column if not exists activity_score integer check (activity_score between 0 and 100),
  add column if not exists authenticity_score integer check (authenticity_score between 0 and 100),
  add column if not exists score_v2 jsonb not null default '{}'::jsonb;

comment on column public.instagram_profiles.score_v2 is
  'Score Instagram v2 completo: dimensoes, pesos por origem, contribuicoes e explicacao auditavel.';
comment on column public.instagram_profile_evidence.score_v2 is
  'Score calculado no momento da evidencia para preservar a decisao historica.';
