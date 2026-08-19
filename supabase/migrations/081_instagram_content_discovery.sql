-- Fase 2 do Instagram Prospect Engine: hashtags, locais e sinais de conteudo.

alter table public.instagram_job_steps
  drop constraint if exists instagram_job_steps_step_type_check;
alter table public.instagram_job_steps
  add constraint instagram_job_steps_step_type_check
  check (step_type in (
    'discover_sources',
    'discover_content',
    'collect_comments',
    'enrich_profiles',
    'analyze_content',
    'qualify'
  ));

alter table public.instagram_profile_evidence
  drop constraint if exists instagram_profile_evidence_evidence_type_check;
alter table public.instagram_profile_evidence
  add constraint instagram_profile_evidence_evidence_type_check
  check (evidence_type in (
    'comment',
    'reply',
    'mention',
    'profile_signal',
    'hashtag_post',
    'place_post'
  ));

alter table public.instagram_profile_evidence
  add column if not exists content_score integer check (content_score between 0 and 100),
  add column if not exists signal_data jsonb not null default '{}'::jsonb;

alter table public.instagram_profiles
  add column if not exists content_score integer check (content_score between 0 and 100),
  add column if not exists content_signals jsonb not null default '{}'::jsonb;

create index if not exists instagram_profile_evidence_job_content_idx
  on public.instagram_profile_evidence (job_id, content_score desc nulls last, created_at);

comment on column public.instagram_profiles.content_signals is
  'Metricas robustas e sinais comerciais calculados sobre posts ou Reels da descoberta.';
