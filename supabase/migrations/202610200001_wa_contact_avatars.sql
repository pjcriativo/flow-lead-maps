-- Cache estável do avatar real consultado na Evolution GO.
-- A URL da CDN do WhatsApp é renovada periodicamente e quando o navegador sinaliza expiração.
alter table public.wa_conversas
  add column if not exists contact_avatar_url text,
  add column if not exists contact_avatar_id text,
  add column if not exists contact_avatar_checked_at timestamptz;

create index if not exists wa_conversas_avatar_refresh_idx
  on public.wa_conversas (org_id, contact_avatar_checked_at)
  where status <> 'archived';
