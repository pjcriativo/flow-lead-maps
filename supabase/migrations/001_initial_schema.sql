-- LeadSift Database Schema
-- Run this in Supabase SQL Editor

-- User profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'agency')),
  plan_status text not null default 'trial' check (plan_status in ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  leads_used_monthly integer not null default 0,
  emails_sent_monthly integer not null default 0,
  integrations_connected integer not null default 0,
  monthly_lead_limit integer not null default 100,
  monthly_email_limit integer not null default 500,
  integration_limit integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'starter');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Lead lists
create table if not exists public.lead_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  city text not null,
  niche text not null,
  radius integer not null default 10,
  total_leads integer not null default 0,
  enriched_count integer not null default 0,
  contacted_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lead_lists enable row level security;
create policy "Users can CRUD own lead lists"
  on public.lead_lists for all using (auth.uid() = user_id);

-- Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.lead_lists on delete cascade,
  user_id uuid references auth.users on delete cascade not null,
  place_id text,
  business_name text not null,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  website text,
  category text,
  rating decimal(2,1),
  review_count integer default 0,
  has_website boolean default false,
  has_photos boolean default false,
  has_hours boolean default false,
  has_phone boolean default false,
  email text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  owner_name text,
  score integer not null default 0 check (score >= 0 and score <= 100),
  score_breakdown jsonb default '{}',
  status text not null default 'new' check (status in ('new', 'enriched', 'contacted', 'responded', 'meeting', 'won', 'lost', 'nurture')),
  last_contacted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;
create policy "Users can CRUD own leads"
  on public.leads for all using (auth.uid() = user_id);

create index idx_leads_user_id on public.leads(user_id);
create index idx_leads_list_id on public.leads(list_id);
create index idx_leads_status on public.leads(status);
create index idx_leads_score on public.leads(score desc);

-- Integrations
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  provider text not null check (provider in ('gohighlevel', 'hubspot', 'mailchimp', 'activecampaign', 'zapier', 'slack', 'googlesheets', 'webhook')),
  name text not null,
  is_connected boolean not null default false,
  api_key_encrypted text,
  settings jsonb default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.integrations enable row level security;
create policy "Users can CRUD own integrations"
  on public.integrations for all using (auth.uid() = user_id);

-- Sequences
create table if not exists public.sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sequence steps
create table if not exists public.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references public.sequences on delete cascade not null,
  step_order integer not null,
  delay_days integer not null default 0,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  stripe_invoice_id text,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'draft',
  description text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
create policy "Users can view own invoices"
  on public.invoices for select using (auth.uid() = id);

-- Activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;
create policy "Users can view own activity"
  on public.activity_log for select using (auth.uid() = user_id);
