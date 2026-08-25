-- Flow Business: CRM, cadencias assistidas, contas oficiais Meta e Flow Builder.
-- Acoes sem endpoint oficial (seguir, curtir, visitar perfil) continuam manuais.

alter table public.planos
  add column if not exists limite_flow_business_contas integer not null default 1,
  add column if not exists limite_flow_business_crm integer not null default 300,
  add column if not exists limite_flow_business_cadencias integer not null default 1,
  add column if not exists limite_flow_business_fluxos integer not null default 0;

update public.planos
set limite_flow_business_contas = case
      when instagram_nivel = 'agencia' then 10
      when instagram_nivel = 'pro' then 3 else 1 end,
    limite_flow_business_crm = case
      when instagram_nivel = 'agencia' then 20000
      when instagram_nivel = 'pro' then 3000 else 300 end,
    limite_flow_business_cadencias = case
      when instagram_nivel = 'agencia' then 50
      when instagram_nivel = 'pro' then 5 else 1 end,
    limite_flow_business_fluxos = case
      when instagram_nivel = 'agencia' then 100
      when instagram_nivel = 'pro' then 10 else 0 end;

alter table public.planos
  drop constraint if exists planos_flow_business_contas_nonnegative,
  add constraint planos_flow_business_contas_nonnegative
    check (limite_flow_business_contas >= 0),
  drop constraint if exists planos_flow_business_crm_nonnegative,
  add constraint planos_flow_business_crm_nonnegative
    check (limite_flow_business_crm >= 0),
  drop constraint if exists planos_flow_business_cadencias_nonnegative,
  add constraint planos_flow_business_cadencias_nonnegative
    check (limite_flow_business_cadencias >= 0),
  drop constraint if exists planos_flow_business_fluxos_nonnegative,
  add constraint planos_flow_business_fluxos_nonnegative
    check (limite_flow_business_fluxos >= 0);

-- Contas: preserva instancias Evolution legadas e passa a identificar o provedor.
alter table public.ig_instancias
  add column if not exists provider text not null default 'evolution_legacy',
  add column if not exists meta_ig_user_id text,
  add column if not exists account_type text,
  add column if not exists profile_picture_url text,
  add column if not exists permissions text[] not null default '{}'::text[],
  add column if not exists token_expires_at timestamptz,
  add column if not exists connected_by uuid references auth.users(id) on delete set null,
  add column if not exists connected_at timestamptz,
  add column if not exists last_webhook_at timestamptz,
  add column if not exists error_message text;

alter table public.ig_instancias drop constraint if exists ig_instancias_provider_check;
alter table public.ig_instancias add constraint ig_instancias_provider_check
  check (provider in ('meta_official', 'evolution_legacy'));
create unique index if not exists ig_instancias_meta_user_unique
  on public.ig_instancias(org_id, meta_ig_user_id);

alter table public.ig_instancia_tokens alter column token drop not null;
alter table public.ig_instancia_tokens
  add column if not exists access_token_ciphertext text,
  add column if not exists refresh_token_ciphertext text,
  add column if not exists scopes text[] not null default '{}'::text[],
  add column if not exists expires_at timestamptz;

create table if not exists public.instagram_oauth_states (
  state text primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redirect_to text not null default '/dashboard?secao=flow-business',
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.instagram_oauth_states enable row level security;
revoke all on public.instagram_oauth_states from anon, authenticated;

-- CRM -----------------------------------------------------------------------
create table if not exists public.instagram_crm_cards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  stage text not null default 'novo' check (stage in (
    'novo','analisando','aquecendo','pronto_abordar','abordado','respondeu',
    'qualificado','proposta','cliente','perdido'
  )),
  temperature text not null default 'frio' check (temperature in ('frio','morno','quente')),
  assigned_to uuid references auth.users(id) on delete set null,
  tags text[] not null default '{}'::text[],
  summary text,
  source text,
  next_action_type text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  loss_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, lead_id)
);
create index if not exists instagram_crm_cards_org_stage_idx
  on public.instagram_crm_cards(org_id, stage, updated_at desc);
create index if not exists instagram_crm_cards_org_next_idx
  on public.instagram_crm_cards(org_id, next_action_at)
  where next_action_at is not null;

create table if not exists public.instagram_crm_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  card_id uuid not null references public.instagram_crm_cards(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'created','stage_changed','note','profile_viewed','followed','liked','commented',
    'dm_sent','follow_up','reply_received','qualified','proposal','won','lost',
    'cadence_started','cadence_completed','task_completed','webhook'
  )),
  title text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists instagram_crm_activities_card_idx
  on public.instagram_crm_activities(card_id, occurred_at desc);

create table if not exists public.instagram_cadences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, name)
);

create table if not exists public.instagram_cadence_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cadence_id uuid not null references public.instagram_cadences(id) on delete cascade,
  position integer not null check (position > 0),
  day_offset integer not null default 0 check (day_offset >= 0),
  action_type text not null check (action_type in (
    'analyze','visit_profile','follow','like','comment','send_dm','follow_up','review'
  )),
  title text not null,
  instructions text,
  is_manual boolean not null default true,
  created_at timestamptz not null default now(),
  unique(cadence_id, position)
);

create table if not exists public.instagram_cadence_enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  card_id uuid not null references public.instagram_crm_cards(id) on delete cascade,
  cadence_id uuid not null references public.instagram_cadences(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists instagram_cadence_one_active_per_card
  on public.instagram_cadence_enrollments(card_id)
  where status = 'active';

create table if not exists public.instagram_crm_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  card_id uuid not null references public.instagram_crm_cards(id) on delete cascade,
  enrollment_id uuid references public.instagram_cadence_enrollments(id) on delete cascade,
  cadence_step_id uuid references public.instagram_cadence_steps(id) on delete set null,
  action_type text not null check (action_type in (
    'analyze','visit_profile','follow','like','comment','send_dm','follow_up','review','custom'
  )),
  title text not null,
  instructions text,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','completed','skipped','cancelled')),
  assigned_to uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists instagram_crm_tasks_org_due_idx
  on public.instagram_crm_tasks(org_id, status, due_at);
create unique index if not exists instagram_crm_task_step_unique
  on public.instagram_crm_tasks(enrollment_id, cadence_step_id)
  where enrollment_id is not null and cadence_step_id is not null;

-- Inbox enriquecido ---------------------------------------------------------
alter table public.ig_conversas
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists unread_count integer not null default 0 check (unread_count >= 0),
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_outbound_at timestamptz,
  add column if not exists messaging_window_expires_at timestamptz,
  add column if not exists source text,
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.ig_mensagens
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists delivery_status text not null default 'received'
    check (delivery_status in ('queued','sent','delivered','read','received','failed'));

-- Flow Builder --------------------------------------------------------------
create table if not exists public.instagram_flows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  account_id uuid references public.ig_instancias(id) on delete set null,
  name text not null,
  description text,
  trigger_type text not null default 'incoming_message' check (trigger_type in (
    'incoming_message','comment_keyword','story_reply','story_mention','ig_referral',
    'crm_stage','tag_added','manual'
  )),
  trigger_config jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','paused')),
  version integer not null default 1 check (version > 0),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists instagram_flows_org_status_idx
  on public.instagram_flows(org_id, status, updated_at desc);

create table if not exists public.instagram_flow_nodes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  flow_id uuid not null references public.instagram_flows(id) on delete cascade,
  node_type text not null check (node_type in ('trigger','action','condition','wait')),
  subtype text not null check (subtype in (
    'trigger','send_message','send_media','quick_replies','add_tag','remove_tag',
    'move_crm','assign_user','create_task','notify_team','webhook','condition','wait'
  )),
  label text not null,
  config jsonb not null default '{}'::jsonb,
  position_x integer not null default 0,
  position_y integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists instagram_flow_nodes_flow_idx
  on public.instagram_flow_nodes(flow_id, position_y, position_x);

create table if not exists public.instagram_flow_edges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  flow_id uuid not null references public.instagram_flows(id) on delete cascade,
  source_node_id uuid not null references public.instagram_flow_nodes(id) on delete cascade,
  target_node_id uuid not null references public.instagram_flow_nodes(id) on delete cascade,
  source_handle text not null default 'default',
  created_at timestamptz not null default now(),
  unique(flow_id, source_node_id, target_node_id, source_handle),
  check (source_node_id <> target_node_id)
);

create table if not exists public.instagram_flow_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  flow_id uuid not null references public.instagram_flows(id) on delete cascade,
  conversation_id uuid references public.ig_conversas(id) on delete set null,
  card_id uuid references public.instagram_crm_cards(id) on delete set null,
  status text not null default 'running' check (status in ('running','waiting','completed','failed','cancelled')),
  current_node_id uuid references public.instagram_flow_nodes(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists instagram_flow_runs_org_status_idx
  on public.instagram_flow_runs(org_id, status, updated_at desc);

-- Integridade tenant-aware: um ID relacionado nunca pode atravessar organizacoes.
alter table public.ig_instancias
  add constraint ig_instancias_org_id_id_unique unique(org_id, id);
alter table public.instagram_crm_cards
  add constraint instagram_crm_cards_org_id_id_unique unique(org_id, id);
alter table public.instagram_cadences
  add constraint instagram_cadences_org_id_id_unique unique(org_id, id);
alter table public.instagram_cadence_steps
  add constraint instagram_cadence_steps_org_id_id_unique unique(org_id, id);
alter table public.instagram_cadence_enrollments
  add constraint instagram_cadence_enrollments_org_id_id_unique unique(org_id, id);
alter table public.instagram_flows
  add constraint instagram_flows_org_id_id_unique unique(org_id, id);
alter table public.instagram_flow_nodes
  add constraint instagram_flow_nodes_org_id_id_unique unique(org_id, id);

alter table public.instagram_crm_activities
  add constraint instagram_crm_activities_card_org_fkey
  foreign key(org_id, card_id) references public.instagram_crm_cards(org_id, id) on delete cascade;
alter table public.instagram_cadence_steps
  add constraint instagram_cadence_steps_cadence_org_fkey
  foreign key(org_id, cadence_id) references public.instagram_cadences(org_id, id) on delete cascade;
alter table public.instagram_cadence_enrollments
  add constraint instagram_cadence_enrollments_card_org_fkey
  foreign key(org_id, card_id) references public.instagram_crm_cards(org_id, id) on delete cascade,
  add constraint instagram_cadence_enrollments_cadence_org_fkey
  foreign key(org_id, cadence_id) references public.instagram_cadences(org_id, id) on delete cascade;
alter table public.instagram_crm_tasks
  add constraint instagram_crm_tasks_card_org_fkey
  foreign key(org_id, card_id) references public.instagram_crm_cards(org_id, id) on delete cascade,
  add constraint instagram_crm_tasks_enrollment_org_fkey
  foreign key(org_id, enrollment_id) references public.instagram_cadence_enrollments(org_id, id) on delete cascade;
alter table public.instagram_flow_nodes
  add constraint instagram_flow_nodes_flow_org_fkey
  foreign key(org_id, flow_id) references public.instagram_flows(org_id, id) on delete cascade;
alter table public.instagram_flow_edges
  add constraint instagram_flow_edges_flow_org_fkey
  foreign key(org_id, flow_id) references public.instagram_flows(org_id, id) on delete cascade,
  add constraint instagram_flow_edges_source_org_fkey
  foreign key(org_id, source_node_id) references public.instagram_flow_nodes(org_id, id) on delete cascade,
  add constraint instagram_flow_edges_target_org_fkey
  foreign key(org_id, target_node_id) references public.instagram_flow_nodes(org_id, id) on delete cascade;
alter table public.instagram_flow_runs
  add constraint instagram_flow_runs_flow_org_fkey
  foreign key(org_id, flow_id) references public.instagram_flows(org_id, id) on delete cascade,
  add constraint instagram_flow_runs_card_org_fkey
  foreign key(org_id, card_id) references public.instagram_crm_cards(org_id, id) on delete cascade;

-- Mantem updated_at confiavel mesmo quando uma escrita nao passa por RPC.
create or replace function public.flow_business_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_crm_cards','instagram_cadences','instagram_crm_tasks',
    'instagram_flows','instagram_flow_nodes','instagram_flow_runs'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.flow_business_touch_updated_at()',
      t || '_touch_updated_at', t
    );
  end loop;
end $$;

-- RLS -----------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_crm_cards','instagram_crm_activities','instagram_cadences',
    'instagram_cadence_steps','instagram_cadence_enrollments','instagram_crm_tasks',
    'instagram_flows','instagram_flow_nodes','instagram_flow_edges','instagram_flow_runs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.eh_super_admin() or public.pertence_a_org(org_id)) with check (public.eh_super_admin() or public.pertence_a_org(org_id))',
      t || '_all', t
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Backfill: cada perfil ja coletado entra uma unica vez no CRM.
insert into public.instagram_crm_cards (
  org_id, lead_id, assigned_to, source, temperature, created_at, updated_at
)
select ranked.org_id, ranked.lead_id, ranked.assigned_to, ranked.discovery_source,
  case
    when ranked.effective_score >= 75 then 'quente'
    when ranked.effective_score >= 45 then 'morno'
    else 'frio'
  end,
  coalesce(ranked.collected_at, now()), now()
from (
  select p.org_id, p.lead_id, l.assigned_to, p.discovery_source, p.collected_at,
    coalesce(p.lead_score, l.score, 0) as effective_score,
    row_number() over (
      partition by p.org_id
      order by coalesce(p.lead_score, l.score, 0) desc, p.collected_at desc
    ) as position,
    pl.limite_flow_business_crm as plan_limit
  from public.instagram_profiles p
  join public.leads l on l.id = p.lead_id
  join public.orgs o on o.id = p.org_id
  join public.planos pl on pl.id = o.plano_id
) ranked
where ranked.position <= ranked.plan_limit
on conflict (org_id, lead_id) do nothing;

-- Cadencia padrao para todas as organizacoes existentes.
insert into public.instagram_cadences (org_id, name, description, is_system)
select id, 'Aquecimento consultivo',
  'Cadência assistida de 10 dias: analisar, visitar, interagir, abordar e acompanhar.', true
from public.orgs
on conflict (org_id, name) do nothing;

insert into public.instagram_cadence_steps (
  org_id, cadence_id, position, day_offset, action_type, title, instructions, is_manual
)
select c.org_id, c.id, s.position, s.day_offset, s.action_type, s.title, s.instructions, true
from public.instagram_cadences c
cross join (values
  (1, 0, 'analyze', 'Analisar oportunidade', 'Leia a bio, valide o fit e identifique um gancho real.'),
  (2, 1, 'visit_profile', 'Visitar o perfil', 'Abra o perfil e observe publicações, oferta e posicionamento.'),
  (3, 2, 'follow', 'Seguir o perfil', 'Siga manualmente apenas quando houver aderência real.'),
  (4, 3, 'like', 'Interagir com conteúdo', 'Curta uma publicação relevante; evite ações em massa.'),
  (5, 4, 'comment', 'Comentar com contexto', 'Faça um comentário genuíno, específico e sem oferta direta.'),
  (6, 5, 'send_dm', 'Enviar abordagem personalizada', 'Use o gancho identificado e envie manualmente pelo Instagram.'),
  (7, 7, 'follow_up', 'Primeiro follow-up', 'Retome de forma breve, acrescentando valor.'),
  (8, 10, 'review', 'Revisar oportunidade', 'Registre o resultado e decida se continua, recicla ou encerra.')
) as s(position, day_offset, action_type, title, instructions)
where c.is_system = true and c.name = 'Aquecimento consultivo'
on conflict (cadence_id, position) do nothing;

-- Limites de estoque, protegidos no servidor inclusive contra chamadas diretas.
create or replace function public.flow_business_enforce_stock_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
  v_resource text := tg_argv[0];
begin
  if new.org_id is null then raise exception 'org_required'; end if;
  if v_resource = 'accounts' and new.meta_ig_user_id is not null and exists (
    select 1 from public.ig_instancias
    where org_id = new.org_id and meta_ig_user_id = new.meta_ig_user_id
  ) then return new; end if;
  perform pg_advisory_xact_lock(
    hashtextextended('flow_business_limit:' || v_resource || ':' || new.org_id::text, 0)
  );

  if v_resource = 'accounts' then
    select p.limite_flow_business_contas into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.ig_instancias where org_id = new.org_id;
  elsif v_resource = 'crm' then
    select p.limite_flow_business_crm into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_crm_cards where org_id = new.org_id;
  elsif v_resource = 'cadences' then
    select p.limite_flow_business_cadencias into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_cadences where org_id = new.org_id;
  elsif v_resource = 'flows' then
    select p.limite_flow_business_fluxos into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_flows where org_id = new.org_id;
  else
    raise exception 'invalid_flow_business_resource';
  end if;

  if v_limit is null then raise exception 'plan_not_found'; end if;
  if v_used >= v_limit then
    raise exception 'flow_business_limit:%:%/%', v_resource, v_used, v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_flow_business_account_limit on public.ig_instancias;
create trigger trg_flow_business_account_limit before insert on public.ig_instancias
for each row execute function public.flow_business_enforce_stock_limit('accounts');
drop trigger if exists trg_flow_business_crm_limit on public.instagram_crm_cards;
create trigger trg_flow_business_crm_limit before insert on public.instagram_crm_cards
for each row execute function public.flow_business_enforce_stock_limit('crm');
drop trigger if exists trg_flow_business_cadence_limit on public.instagram_cadences;
create trigger trg_flow_business_cadence_limit before insert on public.instagram_cadences
for each row execute function public.flow_business_enforce_stock_limit('cadences');
drop trigger if exists trg_flow_business_flow_limit on public.instagram_flows;
create trigger trg_flow_business_flow_limit before insert on public.instagram_flows
for each row execute function public.flow_business_enforce_stock_limit('flows');

-- Perfis novos entram no CRM sem interromper a producao de leads quando o CRM estiver cheio.
create or replace function public.flow_business_sync_instagram_profile_to_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
  v_assigned_to uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('flow_business_crm:' || new.org_id::text, 0));
  select p.limite_flow_business_crm into v_limit
  from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
  select count(*) into v_used from public.instagram_crm_cards where org_id = new.org_id;
  if v_limit is null or v_used >= v_limit then return new; end if;

  select assigned_to into v_assigned_to from public.leads where id = new.lead_id;
  insert into public.instagram_crm_cards(
    org_id, lead_id, assigned_to, source, temperature, created_at, updated_at
  ) values (
    new.org_id, new.lead_id, v_assigned_to, coalesce(new.discovery_source, 'instagram'),
    case when coalesce(new.lead_score, 0) >= 75 then 'quente'
      when coalesce(new.lead_score, 0) >= 45 then 'morno' else 'frio' end,
    coalesce(new.collected_at, now()), now()
  ) on conflict (org_id, lead_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_flow_business_sync_profile on public.instagram_profiles;
create trigger trg_flow_business_sync_profile
after insert or update of lead_score, discovery_source on public.instagram_profiles
for each row execute function public.flow_business_sync_instagram_profile_to_crm();

-- RPCs atomicas para manter historico e proxima acao consistentes.
create or replace function public.flow_business_add_lead_to_crm(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_card_id uuid;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if v_lead.id is null or (
    auth.role() <> 'service_role' and not public.eh_super_admin()
    and not public.pertence_a_org(v_lead.org_id)
  ) then raise exception 'forbidden'; end if;

  select id into v_card_id from public.instagram_crm_cards
  where org_id = v_lead.org_id and lead_id = v_lead.id;
  if v_card_id is not null then return v_card_id; end if;

  insert into public.instagram_crm_cards(org_id, lead_id, assigned_to, source)
  values (v_lead.org_id, v_lead.id, v_lead.assigned_to, 'manual')
  returning id into v_card_id;
  insert into public.instagram_crm_activities(org_id, card_id, activity_type, title, actor_user_id)
  values (v_lead.org_id, v_card_id, 'created', 'Lead adicionado ao CRM', auth.uid());
  return v_card_id;
end;
$$;

create or replace function public.flow_business_start_cadence(p_card_id uuid, p_cadence_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.instagram_crm_cards%rowtype;
  v_cadence public.instagram_cadences%rowtype;
  v_enrollment uuid;
begin
  select * into v_card from public.instagram_crm_cards where id = p_card_id for update;
  select * into v_cadence from public.instagram_cadences where id = p_cadence_id;
  if v_card.id is null or v_cadence.id is null or v_card.org_id <> v_cadence.org_id then
    raise exception 'invalid_card_or_cadence';
  end if;
  if auth.role() <> 'service_role' and not public.eh_super_admin()
     and not public.pertence_a_org(v_card.org_id) then raise exception 'forbidden'; end if;
  if not v_cadence.is_active then raise exception 'cadence_inactive'; end if;

  update public.instagram_cadence_enrollments
  set status = 'cancelled', completed_at = now()
  where card_id = p_card_id and status = 'active';
  update public.instagram_crm_tasks set status = 'cancelled', updated_at = now()
  where card_id = p_card_id and status = 'pending';

  insert into public.instagram_cadence_enrollments(org_id, card_id, cadence_id, created_by)
  values (v_card.org_id, p_card_id, p_cadence_id, auth.uid()) returning id into v_enrollment;

  insert into public.instagram_crm_tasks(
    org_id, card_id, enrollment_id, cadence_step_id, action_type,
    title, instructions, due_at, assigned_to
  )
  select v_card.org_id, p_card_id, v_enrollment, s.id, s.action_type,
    s.title, s.instructions, now() + make_interval(days => s.day_offset), v_card.assigned_to
  from public.instagram_cadence_steps s
  where s.cadence_id = p_cadence_id order by s.position;

  update public.instagram_crm_cards
  set stage = 'aquecendo', next_action_type = (
      select action_type from public.instagram_crm_tasks
      where enrollment_id = v_enrollment order by due_at, created_at limit 1
    ),
    next_action_at = (
      select due_at from public.instagram_crm_tasks
      where enrollment_id = v_enrollment order by due_at, created_at limit 1
    ), updated_at = now()
  where id = p_card_id;
  insert into public.instagram_crm_activities(
    org_id, card_id, activity_type, title, detail, actor_user_id, metadata
  ) values (
    v_card.org_id, p_card_id, 'cadence_started', 'Cadência iniciada',
    v_cadence.name, auth.uid(), jsonb_build_object('cadenceId', p_cadence_id)
  );
  return v_enrollment;
end;
$$;

create or replace function public.flow_business_complete_task(p_task_id uuid, p_outcome text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.instagram_crm_tasks%rowtype;
  v_next public.instagram_crm_tasks%rowtype;
begin
  select * into v_task from public.instagram_crm_tasks where id = p_task_id for update;
  if v_task.id is null then raise exception 'task_not_found'; end if;
  if auth.role() <> 'service_role' and not public.eh_super_admin()
     and not public.pertence_a_org(v_task.org_id) then raise exception 'forbidden'; end if;
  if v_task.status <> 'pending' then raise exception 'task_already_closed'; end if;

  update public.instagram_crm_tasks set status = 'completed', completed_at = now(),
    completed_by = auth.uid(), outcome = p_outcome, updated_at = now()
  where id = p_task_id;
  insert into public.instagram_crm_activities(
    org_id, card_id, activity_type, title, detail, actor_user_id,
    metadata
  ) values (
    v_task.org_id, v_task.card_id, 'task_completed', v_task.title, p_outcome, auth.uid(),
    jsonb_build_object('taskId', v_task.id, 'actionType', v_task.action_type)
  );

  select * into v_next from public.instagram_crm_tasks
  where card_id = v_task.card_id and status = 'pending'
  order by due_at, created_at limit 1;
  update public.instagram_crm_cards set
    next_action_type = v_next.action_type,
    next_action_at = v_next.due_at,
    last_contact_at = case when v_task.action_type in ('send_dm','follow_up') then now() else last_contact_at end,
    stage = case when v_task.action_type = 'send_dm' then 'abordado' else stage end,
    updated_at = now()
  where id = v_task.card_id;

  if v_next.id is null and v_task.enrollment_id is not null then
    update public.instagram_cadence_enrollments set status = 'completed', completed_at = now()
    where id = v_task.enrollment_id;
    insert into public.instagram_crm_activities(org_id, card_id, activity_type, title, actor_user_id)
    values (v_task.org_id, v_task.card_id, 'cadence_completed', 'Cadência concluída', auth.uid());
  end if;
  return jsonb_build_object('ok', true, 'nextTaskId', v_next.id);
end;
$$;

create or replace function public.flow_business_move_card(
  p_card_id uuid, p_stage text, p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.instagram_crm_cards%rowtype;
  v_old_stage text;
begin
  if p_stage not in ('novo','analisando','aquecendo','pronto_abordar','abordado',
    'respondeu','qualificado','proposta','cliente','perdido') then
    raise exception 'invalid_stage';
  end if;
  select * into v_card from public.instagram_crm_cards where id = p_card_id for update;
  if v_card.id is null or (auth.role() <> 'service_role' and not public.eh_super_admin()
    and not public.pertence_a_org(v_card.org_id)) then raise exception 'forbidden'; end if;
  v_old_stage := v_card.stage;
  update public.instagram_crm_cards set stage = p_stage,
    won_at = case when p_stage = 'cliente' then now() else won_at end,
    lost_at = case when p_stage = 'perdido' then now() else lost_at end,
    loss_reason = case when p_stage = 'perdido' then p_reason else loss_reason end,
    updated_at = now() where id = p_card_id;
  insert into public.instagram_crm_activities(
    org_id, card_id, activity_type, title, detail, actor_user_id, metadata
  ) values (
    v_card.org_id, p_card_id, 'stage_changed', 'Etapa atualizada', p_reason, auth.uid(),
    jsonb_build_object('from', v_old_stage, 'to', p_stage)
  );
end;
$$;

create or replace function public.flow_business_create_cadence(
  p_name text, p_description text, p_steps jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
  v_cadence_id uuid;
  v_step jsonb;
begin
  if auth.uid() is null or v_org is null or nullif(trim(p_name), '') is null then
    raise exception 'invalid_cadence';
  end if;
  if jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) < 1
     or jsonb_array_length(p_steps) > 20 then raise exception 'invalid_steps'; end if;

  insert into public.instagram_cadences(org_id, name, description, created_by)
  values (v_org, trim(p_name), nullif(trim(p_description), ''), auth.uid())
  returning id into v_cadence_id;

  for v_step in select value from jsonb_array_elements(p_steps) loop
    insert into public.instagram_cadence_steps(
      org_id, cadence_id, position, day_offset, action_type, title, instructions, is_manual
    ) values (
      v_org, v_cadence_id,
      (v_step->>'position')::integer,
      greatest(0, (v_step->>'dayOffset')::integer),
      v_step->>'actionType',
      nullif(trim(v_step->>'title'), ''),
      nullif(trim(v_step->>'instructions'), ''),
      true
    );
  end loop;
  return v_cadence_id;
end;
$$;

create or replace function public.flow_business_save_flow(
  p_flow_id uuid,
  p_name text,
  p_description text,
  p_account_id uuid,
  p_trigger_type text,
  p_trigger_config jsonb,
  p_nodes jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
  v_flow_id uuid;
  v_node jsonb;
  v_node_id uuid;
  v_previous_id uuid;
  v_position integer := 0;
begin
  if auth.uid() is null or v_org is null or nullif(trim(p_name), '') is null then
    raise exception 'invalid_flow';
  end if;
  if p_trigger_type not in ('incoming_message','comment_keyword','story_reply','story_mention',
    'ig_referral','crm_stage','tag_added','manual') then raise exception 'invalid_trigger'; end if;
  if jsonb_typeof(p_nodes) <> 'array' or jsonb_array_length(p_nodes) > 50 then
    raise exception 'invalid_nodes';
  end if;
  if p_account_id is not null and not exists (
    select 1 from public.ig_instancias where id = p_account_id and org_id = v_org
  ) then raise exception 'invalid_account'; end if;

  if p_flow_id is null then
    insert into public.instagram_flows(
      org_id, account_id, name, description, trigger_type, trigger_config, created_by
    ) values (
      v_org, p_account_id, trim(p_name), nullif(trim(p_description), ''),
      p_trigger_type, coalesce(p_trigger_config, '{}'::jsonb), auth.uid()
    ) returning id into v_flow_id;
  else
    select id into v_flow_id from public.instagram_flows
    where id = p_flow_id and org_id = v_org for update;
    if v_flow_id is null then raise exception 'flow_not_found'; end if;
    update public.instagram_flows set account_id = p_account_id, name = trim(p_name),
      description = nullif(trim(p_description), ''), trigger_type = p_trigger_type,
      trigger_config = coalesce(p_trigger_config, '{}'::jsonb), status = 'draft',
      version = version + 1, published_at = null, updated_at = now()
    where id = v_flow_id;
    delete from public.instagram_flow_edges where flow_id = v_flow_id;
    delete from public.instagram_flow_nodes where flow_id = v_flow_id;
  end if;

  insert into public.instagram_flow_nodes(
    org_id, flow_id, node_type, subtype, label, config, position_x, position_y
  ) values (
    v_org, v_flow_id, 'trigger', 'trigger', 'Quando: ' || replace(p_trigger_type, '_', ' '),
    coalesce(p_trigger_config, '{}'::jsonb), 0, 0
  ) returning id into v_previous_id;

  for v_node in select value from jsonb_array_elements(p_nodes) loop
    v_position := v_position + 1;
    insert into public.instagram_flow_nodes(
      org_id, flow_id, node_type, subtype, label, config, position_x, position_y
    ) values (
      v_org, v_flow_id,
      coalesce(nullif(v_node->>'nodeType', ''), 'action'),
      v_node->>'subtype',
      nullif(trim(v_node->>'label'), ''),
      coalesce(v_node->'config', '{}'::jsonb),
      coalesce((v_node->>'positionX')::integer, 0),
      coalesce((v_node->>'positionY')::integer, v_position * 160)
    ) returning id into v_node_id;
    insert into public.instagram_flow_edges(
      org_id, flow_id, source_node_id, target_node_id
    ) values (v_org, v_flow_id, v_previous_id, v_node_id);
    v_previous_id := v_node_id;
  end loop;
  return v_flow_id;
end;
$$;

create or replace function public.flow_business_publish_flow(p_flow_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flow public.instagram_flows%rowtype;
  v_actions integer;
  v_has_outbound boolean;
  v_has_unsupported boolean;
begin
  select * into v_flow from public.instagram_flows where id = p_flow_id for update;
  if v_flow.id is null or (auth.role() <> 'service_role' and not public.eh_super_admin()
    and not public.pertence_a_org(v_flow.org_id)) then raise exception 'forbidden'; end if;
  if not exists (
    select 1 from public.orgs o join public.planos p on p.id = o.plano_id
    where o.id = v_flow.org_id and p.limite_flow_business_fluxos > 0
  ) then raise exception 'flow_not_available_on_plan'; end if;
  select count(*) into v_actions from public.instagram_flow_nodes
  where flow_id = p_flow_id and node_type <> 'trigger';
  if v_actions < 1 then raise exception 'flow_without_actions'; end if;
  select exists(select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
    and node_type <> 'trigger' and subtype not in (
      'send_message','add_tag','move_crm','create_task'
    )) into v_has_unsupported;
  if v_has_unsupported then raise exception 'flow_contains_unavailable_action'; end if;
  if v_flow.account_id is null or not exists (
    select 1 from public.ig_instancias where id = v_flow.account_id
      and org_id = v_flow.org_id and provider = 'meta_official' and status = 'conectado'
  ) then raise exception 'official_account_required'; end if;

  select exists(select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
    and subtype in ('send_message','send_media','quick_replies')) into v_has_outbound;
  if v_has_outbound and v_flow.trigger_type not in (
    'incoming_message','comment_keyword'
  ) then raise exception 'outbound_requires_customer_entry_point'; end if;
  if v_flow.trigger_type = 'comment_keyword' and (
    select count(*) from public.instagram_flow_nodes
    where flow_id = p_flow_id and subtype = 'send_message'
  ) > 1 then raise exception 'comment_flow_allows_one_private_reply'; end if;
  if v_flow.trigger_type = 'comment_keyword'
    and nullif(trim(v_flow.trigger_config->>'keyword'), '') is null
  then raise exception 'comment_keyword_required'; end if;
  if exists (
    select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
      and subtype = 'send_message' and nullif(trim(config->>'text'), '') is null
  ) then raise exception 'flow_message_empty'; end if;

  update public.instagram_flows set status = 'active', published_at = now(), updated_at = now()
  where id = p_flow_id;
end;
$$;

create or replace function public.flow_business_plan_snapshot(p_org uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.role() = 'service_role' or public.eh_super_admin() or public.pertence_a_org(p_org)
  then jsonb_build_object(
    'limits', jsonb_build_object(
      'accounts', p.limite_flow_business_contas,
      'crmContacts', p.limite_flow_business_crm,
      'cadences', p.limite_flow_business_cadencias,
      'flows', p.limite_flow_business_fluxos
    ),
    'used', jsonb_build_object(
      'accounts', (select count(*) from public.ig_instancias where org_id = p_org),
      'crmContacts', (select count(*) from public.instagram_crm_cards where org_id = p_org),
      'cadences', (select count(*) from public.instagram_cadences where org_id = p_org),
      'flows', (select count(*) from public.instagram_flows where org_id = p_org)
    ),
    'features', jsonb_build_object(
      'officialAccounts', p.limite_flow_business_contas > 0,
      'automations', p.limite_flow_business_fluxos > 0,
      'teamAssignment', p.instagram_nivel in ('pro','agencia')
    )
  ) else null end
  from public.orgs o join public.planos p on p.id = o.plano_id where o.id = p_org
$$;

create or replace function public.flow_business_workspace_snapshot(p_card_limit integer default 300)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
begin
  if auth.uid() is null or v_org is null then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'plan', public.flow_business_plan_snapshot(v_org),
    'cards', coalesce((
      select jsonb_agg(row_data order by row_data->>'updatedAt' desc)
      from (
        select jsonb_build_object(
          'id', c.id, 'leadId', c.lead_id, 'stage', c.stage,
          'temperature', c.temperature, 'tags', c.tags, 'summary', c.summary,
          'source', c.source, 'nextActionType', c.next_action_type,
          'nextActionAt', c.next_action_at, 'updatedAt', c.updated_at,
          'businessName', l.business_name, 'category', l.category, 'city', l.city,
          'state', l.state, 'score', l.score, 'instagramUrl', l.instagram_url,
          'username', ip.username, 'fullName', ip.full_name,
          'profilePictureUrl', ip.profile_pic_url, 'followersCount', ip.followers_count
        ) as row_data
        from public.instagram_crm_cards c
        join public.leads l on l.id = c.lead_id
        left join public.instagram_profiles ip on ip.lead_id = c.lead_id
        where c.org_id = v_org
        order by c.updated_at desc
        limit least(greatest(coalesce(p_card_limit, 300), 1), 1000)
      ) limited_cards
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'cardId', t.card_id, 'actionType', t.action_type,
        'title', t.title, 'instructions', t.instructions, 'dueAt', t.due_at,
        'status', t.status, 'outcome', t.outcome,
        'businessName', l.business_name, 'instagramUrl', l.instagram_url,
        'username', ip.username
      ) order by t.due_at)
      from public.instagram_crm_tasks t
      join public.instagram_crm_cards c on c.id = t.card_id
      join public.leads l on l.id = c.lead_id
      left join public.instagram_profiles ip on ip.lead_id = c.lead_id
      where t.org_id = v_org and t.status = 'pending'
    ), '[]'::jsonb),
    'cadences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description,
        'isActive', c.is_active, 'isSystem', c.is_system,
        'steps', coalesce((select jsonb_agg(jsonb_build_object(
          'id', s.id, 'position', s.position, 'dayOffset', s.day_offset,
          'actionType', s.action_type, 'title', s.title,
          'instructions', s.instructions, 'isManual', s.is_manual
        ) order by s.position) from public.instagram_cadence_steps s where s.cadence_id = c.id), '[]'::jsonb)
      ) order by c.is_system desc, c.name)
      from public.instagram_cadences c where c.org_id = v_org
    ), '[]'::jsonb),
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.nome, 'username', i.username_ig,
        'provider', i.provider, 'status', i.status, 'accountType', i.account_type,
        'profilePictureUrl', i.profile_picture_url, 'permissions', i.permissions,
        'connectedAt', i.connected_at, 'lastWebhookAt', i.last_webhook_at,
        'errorMessage', i.error_message
      ) order by i.criada_em desc)
      from public.ig_instancias i where i.org_id = v_org
    ), '[]'::jsonb),
    'flows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'accountId', f.account_id, 'name', f.name,
        'description', f.description, 'triggerType', f.trigger_type,
        'triggerConfig', f.trigger_config, 'status', f.status,
        'version', f.version, 'publishedAt', f.published_at,
        'updatedAt', f.updated_at,
        'nodes', coalesce((select jsonb_agg(jsonb_build_object(
          'id', n.id, 'nodeType', n.node_type, 'subtype', n.subtype,
          'label', n.label, 'config', n.config,
          'positionX', n.position_x, 'positionY', n.position_y
        ) order by n.position_y, n.position_x) from public.instagram_flow_nodes n
          where n.flow_id = f.id and n.node_type <> 'trigger'), '[]'::jsonb)
      ) order by f.updated_at desc)
      from public.instagram_flows f where f.org_id = v_org
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.flow_business_ingest_meta_event(
  p_meta_account_id text,
  p_external_contact_id text,
  p_external_contact_name text,
  p_external_event_id text,
  p_text text,
  p_message_type text default 'text',
  p_source text default 'direct',
  p_occurred_at timestamptz default now(),
  p_window_hours integer default 24,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance public.ig_instancias%rowtype;
  v_conversation public.ig_conversas%rowtype;
  v_message_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if nullif(trim(p_external_contact_id), '') is null or nullif(trim(p_external_event_id), '') is null then
    raise exception 'invalid_event';
  end if;
  select * into v_instance from public.ig_instancias
  where meta_ig_user_id = p_meta_account_id and provider = 'meta_official'
  order by connected_at desc nulls last limit 1;
  if v_instance.id is null then return jsonb_build_object('accepted', false, 'reason', 'account_not_found'); end if;

  insert into public.ig_conversas(
    org_id, instancia_id, external_contact_id, external_contact_name, source,
    last_message_text, last_message_at, last_inbound_at, messaging_window_expires_at,
    unread_count, atualizado_em
  ) values (
    v_instance.org_id, v_instance.id, p_external_contact_id,
    nullif(trim(p_external_contact_name), ''), p_source, p_text, p_occurred_at,
    p_occurred_at, p_occurred_at + make_interval(hours => greatest(0, p_window_hours)),
    0, now()
  ) on conflict (instancia_id, external_contact_id) do update set
    external_contact_name = coalesce(excluded.external_contact_name, ig_conversas.external_contact_name),
    source = coalesce(excluded.source, ig_conversas.source),
    atualizado_em = now()
  returning * into v_conversation;

  insert into public.ig_mensagens(
    org_id, conversa_id, external_message_id, direction, message_type,
    text, timestamp, metadata, delivery_status
  ) values (
    v_instance.org_id, v_conversation.id, p_external_event_id, 'inbound',
    coalesce(nullif(p_message_type, ''), 'text'), p_text, p_occurred_at,
    coalesce(p_metadata, '{}'::jsonb), 'received'
  ) on conflict (external_message_id) do nothing returning id into v_message_id;
  if v_message_id is null then
    return jsonb_build_object('accepted', true, 'duplicate', true,
      'orgId', v_instance.org_id, 'instanceId', v_instance.id,
      'conversationId', v_conversation.id, 'leadId', v_conversation.lead_id);
  end if;

  update public.ig_conversas set
    last_message_text = p_text, last_message_at = p_occurred_at,
    last_inbound_at = p_occurred_at,
    messaging_window_expires_at = p_occurred_at + make_interval(hours => greatest(0, p_window_hours)),
    unread_count = unread_count + 1, atualizado_em = now()
  where id = v_conversation.id;
  update public.ig_instancias set last_webhook_at = now(), atualizado_em = now(), error_message = null
  where id = v_instance.id;
  return jsonb_build_object('accepted', true, 'duplicate', false,
    'orgId', v_instance.org_id, 'instanceId', v_instance.id,
    'conversationId', v_conversation.id, 'leadId', v_conversation.lead_id);
end;
$$;

grant execute on function public.flow_business_add_lead_to_crm(uuid) to authenticated, service_role;
grant execute on function public.flow_business_start_cadence(uuid, uuid) to authenticated, service_role;
grant execute on function public.flow_business_complete_task(uuid, text) to authenticated, service_role;
grant execute on function public.flow_business_move_card(uuid, text, text) to authenticated, service_role;
grant execute on function public.flow_business_create_cadence(text, text, jsonb) to authenticated, service_role;
grant execute on function public.flow_business_save_flow(uuid, text, text, uuid, text, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.flow_business_publish_flow(uuid) to authenticated, service_role;
grant execute on function public.flow_business_plan_snapshot(uuid) to authenticated, service_role;
grant execute on function public.flow_business_workspace_snapshot(integer) to authenticated, service_role;
revoke all on function public.flow_business_ingest_meta_event(text,text,text,text,text,text,text,timestamptz,integer,jsonb) from public, anon, authenticated;
grant execute on function public.flow_business_ingest_meta_event(text,text,text,text,text,text,text,timestamptz,integer,jsonb) to service_role;

comment on table public.instagram_crm_tasks is
  'Fila assistida do Flow Business. Acoes de seguir/curtir/comentar sao sempre manuais.';
comment on table public.instagram_flows is
  'Fluxos oficiais do Instagram; publicacao depende de conta Meta conectada e janela de mensagens valida.';
