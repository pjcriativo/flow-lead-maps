-- CORRECAO 02 - persistencia da Biblioteca e do Estudio.
-- PREPARADA, NAO EXECUTADA. Incremental sobre a proposta 111 e compatível com
-- ambientes onde as tabelas da 111 eventualmente já existam.

-- A migration 111 continua no histórico. Os ALTERs abaixo fecham suas lacunas.
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(), org_id uuid references public.orgs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null, slug text, nome text not null,
  descricao text, categoria text not null, categoria_label text not null, assunto_padrao text not null,
  preheader_padrao text, cta_texto text, cta_url text, conteudo_html text not null,
  tema_escuro boolean not null default false, is_global boolean not null default false,
  variaveis_suportadas text[] not null default '{}', criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists public.assinaturas_corporativas (
  id uuid primary key default gen_random_uuid(), org_id uuid references public.orgs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null, nome text not null, cargo text,
  empresa text, telefone text, email text, site text, endereco text, linkedin text, instagram text,
  whatsapp text, html_template text not null, is_padrao boolean not null default false,
  is_global boolean not null default false, badge_label text, criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists public.template_favoritos (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, template_id text not null,
  tipo text not null check(tipo in ('email','assinatura')), criado_em timestamptz not null default now()
);

alter table public.email_templates
  add column if not exists template_origem_id text,
  add column if not exists template_origem_versao text,
  add column if not exists configuracoes jsonb not null default '{}'::jsonb,
  add column if not exists versao integer not null default 1;

alter table public.assinaturas_corporativas
  add column if not exists modelo_origem_id text,
  add column if not exists modelo_origem_versao text,
  add column if not exists logo_url text,
  add column if not exists dados jsonb not null default '{}'::jsonb,
  add column if not exists versao integer not null default 1;

-- Conteúdo privado sempre pertence a um tenant. Templates globais oficiais
-- continuam versionados em templates-data.ts e não são duplicados por cliente.
alter table public.email_templates drop constraint if exists email_templates_privado_org_check;
alter table public.email_templates add constraint email_templates_privado_org_check
  check (is_global or org_id is not null);
alter table public.assinaturas_corporativas drop constraint if exists assinaturas_privada_org_check;
alter table public.assinaturas_corporativas add constraint assinaturas_privada_org_check
  check (is_global or org_id is not null);

create unique index if not exists uq_assinatura_padrao_org
  on public.assinaturas_corporativas(org_id)
  where is_padrao and not is_global;
create index if not exists idx_email_templates_org_atualizado
  on public.email_templates(org_id, atualizado_em desc);
create index if not exists idx_assinaturas_org_atualizado
  on public.assinaturas_corporativas(org_id, atualizado_em desc);
create index if not exists idx_template_favoritos_usuario
  on public.template_favoritos(org_id, user_id, tipo);
alter table public.template_favoritos
  drop constraint if exists template_favoritos_org_id_user_id_template_id_key;
alter table public.template_favoritos
  drop constraint if exists template_favoritos_escopo_key;
alter table public.template_favoritos
  add constraint template_favoritos_escopo_key unique(org_id,user_id,tipo,template_id);

create or replace function public.html_email_seguro(p_html text)
returns boolean language sql immutable parallel safe as $$
  select p_html is not null
    and p_html !~* '<[[:space:]]*(script|iframe|object|embed|form|meta|base)([[:space:]/>])'
    and p_html !~* '\son[a-z]+\s*='
    and p_html !~* '(javascript|vbscript)\s*:'
    and p_html !~* 'data\s*:\s*text/html'
$$;

alter table public.email_templates drop constraint if exists email_templates_html_seguro_check;
alter table public.email_templates add constraint email_templates_html_seguro_check
  check (public.html_email_seguro(conteudo_html));
alter table public.assinaturas_corporativas drop constraint if exists assinaturas_html_seguro_check;
alter table public.assinaturas_corporativas add constraint assinaturas_html_seguro_check
  check (public.html_email_seguro(html_template));

create table if not exists public.email_template_versoes (
  id bigint generated always as identity primary key,
  template_id uuid not null,
  org_id uuid not null references public.orgs(id) on delete cascade,
  versao integer not null,
  snapshot jsonb not null,
  alterado_por uuid references auth.users(id) on delete set null,
  alterado_em timestamptz not null default now(),
  unique(template_id, versao)
);

create table if not exists public.assinatura_versoes (
  id bigint generated always as identity primary key,
  assinatura_id uuid not null,
  org_id uuid not null references public.orgs(id) on delete cascade,
  versao integer not null,
  snapshot jsonb not null,
  alterado_por uuid references auth.users(id) on delete set null,
  alterado_em timestamptz not null default now(),
  unique(assinatura_id, versao)
);

create or replace function public.auditar_template_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_global then raise exception 'Templates globais são imutáveis' using errcode='42501'; end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.org_id is distinct from old.org_id
       or new.created_by is distinct from old.created_by
       or new.is_global is distinct from old.is_global then
      raise exception 'Identidade e organizacao do template sao imutaveis' using errcode='23514';
    end if;
  end if;
  insert into email_template_versoes(template_id, org_id, versao, snapshot, alterado_por)
  values(old.id, old.org_id, old.versao, to_jsonb(old), auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  new.versao := old.versao + 1;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists trg_auditar_template_email on public.email_templates;
create trigger trg_auditar_template_email before update or delete on public.email_templates
for each row execute function public.auditar_template_email();

create or replace function public.auditar_assinatura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_global then raise exception 'Assinaturas globais são imutáveis' using errcode='42501'; end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.org_id is distinct from old.org_id
       or new.created_by is distinct from old.created_by
       or new.is_global is distinct from old.is_global then
      raise exception 'Identidade e organizacao da assinatura sao imutaveis' using errcode='23514';
    end if;
  end if;
  insert into assinatura_versoes(assinatura_id, org_id, versao, snapshot, alterado_por)
  values(old.id, old.org_id, old.versao, to_jsonb(old), auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  new.versao := old.versao + 1;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists trg_auditar_assinatura on public.assinaturas_corporativas;
create trigger trg_auditar_assinatura before update or delete on public.assinaturas_corporativas
for each row execute function public.auditar_assinatura();

-- Evolução da entidade oficial: não cria uma segunda tabela de campanhas.
alter table public.campanhas
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists revisao integer not null default 0;
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.campanhas'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* 'status.*ativa.*concluida'
  loop
    execute format('alter table public.campanhas drop constraint %I', v_constraint.conname);
  end loop;
end $$;
alter table public.campanhas add constraint campanhas_status_check check
  (status in ('rascunho','em_revisao','ativa','concluida'));
alter table public.campanhas drop constraint if exists campanhas_revisao_check;
alter table public.campanhas add constraint campanhas_revisao_check check (revisao >= 0);
create index if not exists idx_campanhas_org_status_atualizado
  on public.campanhas(org_id, status, atualizado_em desc);
create unique index if not exists uq_campanhas_id_org on public.campanhas(id, org_id);
create unique index if not exists uq_leads_id_org on public.leads(id, org_id);

create or replace function public.proteger_identidade_campanha()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.org_id is distinct from old.org_id
     or new.user_id is distinct from old.user_id
     or new.canal is distinct from old.canal then
    raise exception 'Organizacao, criador e canal da campanha sao imutaveis' using errcode='23514';
  end if;
  return new;
end $$;
drop trigger if exists trg_proteger_identidade_campanha on public.campanhas;
create trigger trg_proteger_identidade_campanha before update on public.campanhas
for each row execute function public.proteger_identidade_campanha();

create table if not exists public.campanha_email_drafts (
  campanha_id uuid primary key references public.campanhas(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  template_id text not null,
  template_versao text not null,
  template_nome text not null,
  template_html_snapshot text not null,
  template_config_snapshot jsonb not null default '{}'::jsonb,
  blocos jsonb not null default '[]'::jsonb,
  assinatura_id text,
  assinatura_nome text,
  assinatura_html_snapshot text not null default '',
  assunto text not null,
  pre_cabecalho text not null default '',
  remetente_nome text not null,
  remetente_email text not null,
  responder_para text not null,
  filtros_envio jsonb not null default '{}'::jsonb,
  programacao jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint campanha_email_html_seguro check
    (public.html_email_seguro(template_html_snapshot) and public.html_email_seguro(assinatura_html_snapshot))
);

create table if not exists public.campanha_email_destinatarios (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete restrict,
  email_snapshot text,
  selecionado boolean not null default false,
  estado_elegibilidade text not null,
  motivo_exclusao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(campanha_id, lead_id),
  check (estado_elegibilidade in
    ('sem_email','nao_validado','elegivel_confirmado','bloqueado','descadastro','reclamacao')),
  check (estado_elegibilidade <> 'elegivel_confirmado' or email_snapshot is not null)
);
create index if not exists idx_campanha_destinatarios_campanha
  on public.campanha_email_destinatarios(campanha_id, selecionado);

alter table public.campanha_email_drafts
  drop constraint if exists campanha_email_drafts_tenant_fkey;
alter table public.campanha_email_drafts
  add constraint campanha_email_drafts_tenant_fkey
  foreign key(campanha_id,org_id) references public.campanhas(id,org_id) on delete cascade;
alter table public.campanha_email_destinatarios
  drop constraint if exists campanha_email_destinatarios_campanha_tenant_fkey;
alter table public.campanha_email_destinatarios
  add constraint campanha_email_destinatarios_campanha_tenant_fkey
  foreign key(campanha_id,org_id) references public.campanhas(id,org_id) on delete cascade;
alter table public.campanha_email_destinatarios
  drop constraint if exists campanha_email_destinatarios_lead_tenant_fkey;
alter table public.campanha_email_destinatarios
  add constraint campanha_email_destinatarios_lead_tenant_fkey
  foreign key(lead_id,org_id) references public.leads(id,org_id) on delete restrict;

-- Somente administradores/gerentes alteram ativos da Biblioteca. Leitura é da org.
alter table public.email_templates enable row level security;
alter table public.assinaturas_corporativas enable row level security;
alter table public.template_favoritos enable row level security;
drop policy if exists email_templates_select on public.email_templates;
create policy email_templates_select on public.email_templates for select using
  (is_global or eh_super_admin() or pertence_a_org(org_id));
drop policy if exists email_templates_insert on public.email_templates;
create policy email_templates_insert on public.email_templates for insert with check
  (not is_global and org_id is not null and created_by=auth.uid() and
   (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));
drop policy if exists email_templates_update on public.email_templates;
create policy email_templates_update on public.email_templates for update using
  (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))))
  with check (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));
drop policy if exists email_templates_delete on public.email_templates;
create policy email_templates_delete on public.email_templates for delete using
  (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));

drop policy if exists assinaturas_select on public.assinaturas_corporativas;
create policy assinaturas_select on public.assinaturas_corporativas for select using
  (is_global or eh_super_admin() or pertence_a_org(org_id));
drop policy if exists assinaturas_insert on public.assinaturas_corporativas;
create policy assinaturas_insert on public.assinaturas_corporativas for insert with check
  (not is_global and org_id is not null and created_by=auth.uid() and
   (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));
drop policy if exists assinaturas_update on public.assinaturas_corporativas;
create policy assinaturas_update on public.assinaturas_corporativas for update using
  (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))))
  with check (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));
drop policy if exists assinaturas_delete on public.assinaturas_corporativas;
create policy assinaturas_delete on public.assinaturas_corporativas for delete using
  (not is_global and (eh_super_admin() or (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))));

drop policy if exists template_favoritos_all on public.template_favoritos;
create policy template_favoritos_all on public.template_favoritos for all using
  (user_id=auth.uid() and (eh_super_admin() or pertence_a_org(org_id)))
  with check (user_id=auth.uid() and (eh_super_admin() or pertence_a_org(org_id)));

alter table public.email_template_versoes enable row level security;
alter table public.assinatura_versoes enable row level security;
alter table public.campanha_email_drafts enable row level security;
alter table public.campanha_email_destinatarios enable row level security;
drop policy if exists email_template_versoes_select on public.email_template_versoes;
create policy email_template_versoes_select on public.email_template_versoes for select using
  (eh_super_admin() or pertence_a_org(org_id));
drop policy if exists assinatura_versoes_select on public.assinatura_versoes;
create policy assinatura_versoes_select on public.assinatura_versoes for select using
  (eh_super_admin() or pertence_a_org(org_id));
drop policy if exists campanha_email_drafts_select on public.campanha_email_drafts;
create policy campanha_email_drafts_select on public.campanha_email_drafts for select using
  (eh_super_admin() or pertence_a_org(org_id));
drop policy if exists campanha_email_destinatarios_select on public.campanha_email_destinatarios;
create policy campanha_email_destinatarios_select on public.campanha_email_destinatarios for select using
  (eh_super_admin() or pertence_a_org(org_id));

-- As policies legadas de campanhas permitem escrita a qualquer membro da org.
-- Policies restritivas preservam esse comportamento para campanhas antigas, mas
-- exigem o papel correto sempre que o registro entra no fluxo do Estudio.
drop policy if exists campanhas_estudio_insert_restrito on public.campanhas;
create policy campanhas_estudio_insert_restrito on public.campanhas
  as restrictive for insert with check (
    status not in ('rascunho','em_revisao') or eh_super_admin() or
    (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))
  );
drop policy if exists campanhas_estudio_update_restrito on public.campanhas;
create policy campanhas_estudio_update_restrito on public.campanhas
  as restrictive for update using (
    status not in ('rascunho','em_revisao') or eh_super_admin() or
    (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))
  ) with check (
    status not in ('rascunho','em_revisao') or eh_super_admin() or
    (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))
  );
drop policy if exists campanhas_estudio_delete_restrito on public.campanhas;
create policy campanhas_estudio_delete_restrito on public.campanhas
  as restrictive for delete using (
    status not in ('rascunho','em_revisao') or eh_super_admin() or
    (pertence_a_org(org_id) and papel_do_usuario(org_id) in ('admin','gerente'))
  );

-- Operações compostas permanecem atômicas e validam tenant/papel no banco.
create or replace function public.salvar_rascunho_estudio(
  p_org_id uuid, p_campanha_id uuid, p_revisao_esperada integer, p_draft jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid(); v_campanha uuid; v_revisao integer; v_lista uuid;
  v_atualizado timestamptz;
begin
  if v_user is null then raise exception 'Autenticação obrigatória' using errcode='28000'; end if;
  if not (eh_super_admin() or (pertence_a_org(p_org_id) and papel_do_usuario(p_org_id) in ('admin','gerente'))) then
    raise exception 'Sem permissão para salvar campanhas nesta organização' using errcode='42501';
  end if;
  if coalesce(jsonb_typeof(p_draft),'null') <> 'object' then
    raise exception 'Rascunho deve ser um objeto JSON' using errcode='22023';
  end if;
  if p_revisao_esperada is null or p_revisao_esperada < 0 then
    raise exception 'Revisao esperada invalida' using errcode='22023';
  end if;
  if coalesce(p_draft->>'status','') not in ('rascunho','em_revisao') then
    raise exception 'Status de rascunho invalido' using errcode='22023';
  end if;
  if coalesce(jsonb_typeof(coalesce(p_draft->'templateConfigSnapshot','{}'::jsonb)),'null') <> 'object'
     or coalesce(jsonb_typeof(coalesce(p_draft->'blocos','[]'::jsonb)),'null') <> 'array'
     or coalesce(jsonb_typeof(coalesce(p_draft->'filtrosEnvio','{}'::jsonb)),'null') <> 'object'
     or coalesce(jsonb_typeof(coalesce(p_draft->'programacao','{}'::jsonb)),'null') <> 'object'
     or coalesce(jsonb_typeof(coalesce(p_draft->'leadsIdsSelecionados','[]'::jsonb)),'null') <> 'array' then
    raise exception 'Estrutura JSON invalida no rascunho' using errcode='22023';
  end if;
  if nullif(trim(coalesce(p_draft->>'nome','')),'') is null
     or nullif(trim(coalesce(p_draft->>'templateId','')),'') is null
     or nullif(trim(coalesce(p_draft->>'templateVersao','')),'') is null
     or nullif(trim(coalesce(p_draft->>'templateNome','')),'') is null
     or nullif(trim(coalesce(p_draft->>'templateHtmlSnapshot','')),'') is null
     or nullif(trim(coalesce(p_draft->>'assunto','')),'') is null
     or nullif(trim(coalesce(p_draft->>'remetenteNome','')),'') is null
     or nullif(trim(coalesce(p_draft->>'remetenteEmail','')),'') is null
     or nullif(trim(coalesce(p_draft->>'responderPara','')),'') is null then
    raise exception 'Campos obrigatorios do rascunho nao foram preenchidos' using errcode='23502';
  end if;
  v_lista := nullif(p_draft->>'listaId','')::uuid;
  if v_lista is null or not exists(select 1 from lead_lists where id=v_lista and org_id=p_org_id) then
    raise exception 'Lista inválida para a organização ativa' using errcode='23503';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(p_draft->'leadsIdsSelecionados','[]'::jsonb)) selected(id)
    where not exists (
      select 1 from leads l where l.id::text=selected.id and l.org_id=p_org_id and l.list_id=v_lista
    )
  ) then
    raise exception 'Destinatário inválido para a lista e organização ativas' using errcode='23503';
  end if;

  if p_campanha_id is null then
    if p_revisao_esperada <> 0 then
      raise exception 'Uma nova campanha deve iniciar na revisao zero' using errcode='22023';
    end if;
    insert into campanhas(user_id,org_id,list_id,nome,status,canal,atualizado_em,revisao)
    values(v_user,p_org_id,v_lista,p_draft->>'nome','rascunho','email',now(),1)
    returning id,revisao,atualizado_em into v_campanha,v_revisao,v_atualizado;
  else
    update campanhas set nome=p_draft->>'nome', list_id=v_lista,
      status=case when p_draft->>'status'='em_revisao' then 'em_revisao' else 'rascunho' end,
      atualizado_em=now(), revisao=revisao+1
    where id=p_campanha_id and org_id=p_org_id and canal='email' and revisao=p_revisao_esperada
    returning id,revisao,atualizado_em into v_campanha,v_revisao,v_atualizado;
    if v_campanha is null then raise exception 'Conflito de revisão: recarregue antes de salvar' using errcode='40001'; end if;
  end if;

  insert into campanha_email_drafts(
    campanha_id,org_id,template_id,template_versao,template_nome,template_html_snapshot,
    template_config_snapshot,blocos,assinatura_id,assinatura_nome,assinatura_html_snapshot,
    assunto,pre_cabecalho,remetente_nome,remetente_email,responder_para,filtros_envio,programacao,atualizado_em)
  values(v_campanha,p_org_id,p_draft->>'templateId',p_draft->>'templateVersao',p_draft->>'templateNome',
    p_draft->>'templateHtmlSnapshot',coalesce(p_draft->'templateConfigSnapshot','{}'),coalesce(p_draft->'blocos','[]'),
    nullif(p_draft->>'assinaturaId',''),p_draft->>'assinaturaNome',coalesce(p_draft->>'assinaturaHtmlSnapshot',''),
    p_draft->>'assunto',coalesce(p_draft->>'preCabecalho',''),p_draft->>'remetenteNome',
    p_draft->>'remetenteEmail',p_draft->>'responderPara',coalesce(p_draft->'filtrosEnvio','{}'),
    coalesce(p_draft->'programacao','{}'),now())
  on conflict(campanha_id) do update set
    template_id=excluded.template_id,template_versao=excluded.template_versao,
    template_nome=excluded.template_nome,template_html_snapshot=excluded.template_html_snapshot,
    template_config_snapshot=excluded.template_config_snapshot,blocos=excluded.blocos,
    assinatura_id=excluded.assinatura_id,assinatura_nome=excluded.assinatura_nome,
    assinatura_html_snapshot=excluded.assinatura_html_snapshot,assunto=excluded.assunto,
    pre_cabecalho=excluded.pre_cabecalho,remetente_nome=excluded.remetente_nome,
    remetente_email=excluded.remetente_email,responder_para=excluded.responder_para,
    filtros_envio=excluded.filtros_envio,programacao=excluded.programacao,atualizado_em=now();

  delete from campanha_email_destinatarios where campanha_id=v_campanha;
  insert into campanha_email_destinatarios(campanha_id,org_id,lead_id,email_snapshot,selecionado,estado_elegibilidade,motivo_exclusao)
  with candidatos as (
    select l.*,
      row_number() over(partition by lower(nullif(trim(l.email),'')) order by l.created_at,l.id) as email_ordem
    from leads l where l.org_id=p_org_id and l.list_id=v_lista
  )
  select v_campanha,p_org_id,l.id,lower(nullif(trim(l.email),'')),
    coalesce((p_draft->'leadsIdsSelecionados') ? l.id::text,false),
    case when nullif(trim(l.email),'') is null then 'sem_email'
         when l.email_opt_out then 'descadastro'
         when l.email_ordem > 1 then 'bloqueado'
         else 'nao_validado' end,
    case when nullif(trim(l.email),'') is null then 'E-mail ausente'
         when l.email_opt_out then 'Lead descadastrado'
         when l.email_ordem > 1 then 'E-mail duplicado na lista'
         else 'Elegibilidade não comprovada' end
  from candidatos l;

  return jsonb_build_object('campaignId',v_campanha,'revision',v_revisao,'updatedAt',v_atualizado);
end $$;
revoke all on function public.salvar_rascunho_estudio(uuid,uuid,integer,jsonb) from public;
grant execute on function public.salvar_rascunho_estudio(uuid,uuid,integer,jsonb) to authenticated;

-- Assinatura padrão é trocada sob um único lock transacional.
create or replace function public.definir_assinatura_padrao(p_org_id uuid,p_assinatura_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not (eh_super_admin() or (pertence_a_org(p_org_id) and papel_do_usuario(p_org_id) in ('admin','gerente'))) then
    raise exception 'Sem permissão' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_org_id::text,0));
  if not exists(select 1 from assinaturas_corporativas where id=p_assinatura_id and org_id=p_org_id and not is_global) then
    raise exception 'Assinatura inválida' using errcode='23503';
  end if;
  update assinaturas_corporativas set is_padrao=false
  where org_id=p_org_id and not is_global and is_padrao and id<>p_assinatura_id;
  update assinaturas_corporativas set is_padrao=true
  where id=p_assinatura_id and org_id=p_org_id and not is_global and not is_padrao;
end $$;
revoke all on function public.definir_assinatura_padrao(uuid,uuid) from public;
grant execute on function public.definir_assinatura_padrao(uuid,uuid) to authenticated;

-- Rollback planejado: remover primeiro RPCs/policies/tabelas filhas/índices;
-- manter colunas de campanhas até exportar rascunhos. Nenhum DROP de dado é automático.
