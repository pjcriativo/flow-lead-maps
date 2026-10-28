-- CENTRAL OPENAI — catálogo dinâmico (Prompt 47). PREPARADA, NÃO APLICADA EM PRODUÇÃO. Idempotente.
-- Incremental sobre 202610280001 (ia_config / ia_provedores / ia_modelos). Aplicar só com autorização explícita.
--
-- A API GET /v1/models informa apenas id, data de criação e dono. Tudo o mais (categorias, modalidades,
-- endpoint) é INFERIDO do id pela Edge e marcado como tal (classificacao_origem = 'inferida'); preços,
-- contexto e limites são informados pelo Super Admin (origem 'manual'). Nada aqui chama a OpenAI nem gasta.
-- Retrocompatível: linhas existentes ganham defaults seguros (disponibilidade 'desconhecida', chat_ceo = true).

alter table public.ia_modelos
  add column if not exists disponibilidade text not null default 'desconhecida'
    check (disponibilidade in ('disponivel', 'indisponivel', 'desconhecida')),
  add column if not exists visto_em timestamptz,
  add column if not exists primeiro_visto_em timestamptz,
  add column if not exists api_criado_em timestamptz,
  add column if not exists api_dono text check (api_dono is null or length(api_dono) <= 80),
  add column if not exists categorias text[] not null default '{}',
  add column if not exists modalidades_entrada text[] not null default '{}',
  add column if not exists modalidades_saida text[] not null default '{}',
  add column if not exists endpoint text not null default 'desconhecido'
    check (endpoint in ('responses', 'chat_completions', 'completions', 'images', 'audio_transcriptions',
                        'audio_speech', 'realtime', 'embeddings', 'moderations', 'videos', 'desconhecido')),
  add column if not exists familia text check (familia is null or length(familia) <= 80),
  add column if not exists snapshot text check (snapshot is null or length(snapshot) <= 20),
  add column if not exists classificacao_origem text not null default 'inferida'
    check (classificacao_origem in ('inferida', 'manual')),
  -- texto + ferramentas na Responses API: único tipo de modelo que o runtime de conversa pode usar
  add column if not exists chat_ceo boolean not null default true,
  add column if not exists suporta_estruturadas boolean,
  add column if not exists contexto_tokens integer check (contexto_tokens is null or contexto_tokens between 1 and 100000000),
  add column if not exists saida_max_tokens integer check (saida_max_tokens is null or saida_max_tokens between 1 and 100000000),
  -- preços além de entrada/saída por 1M tokens: [{item, unidade, usd, modo}] validado pela Edge
  add column if not exists precos_extra jsonb not null default '[]'::jsonb check (jsonb_typeof(precos_extra) = 'array'),
  add column if not exists preco_origem text check (preco_origem is null or preco_origem in ('manual', 'documentacao_oficial')),
  add column if not exists preco_fonte text check (preco_fonte is null or length(preco_fonte) <= 200),
  add column if not exists preco_atualizado_em timestamptz,
  -- só um teste funcional real preenche isto (nenhuma ação desta etapa o faz: sem inferência paga)
  add column if not exists homologado_em timestamptz;

create index if not exists ia_modelos_provider_disp_idx on public.ia_modelos (provider, disponibilidade);

alter table public.ia_provedores
  add column if not exists catalogo_sincronizado_em timestamptz,
  add column if not exists catalogo_total integer check (catalogo_total is null or catalogo_total >= 0);

-- Capacidades independentes do CEO (economico, analise_complexa, visao, imagem, transcricao, voz).
-- O modelo principal continua em modelo_ceo e o padrão em modelo_padrao. Nunca é trocado automaticamente.
alter table public.ia_config
  add column if not exists modelos_por_capacidade jsonb not null default '{}'::jsonb
    check (jsonb_typeof(modelos_por_capacidade) = 'object');

-- Modelos permitidos para CONVERSA: igual à versão anterior, agora excluindo modelos habilitados de outras
-- modalidades (imagem, áudio, embeddings...) mesmo que alguém informe preço por token para eles.
create or replace function public.agent_modelos_permitidos()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct q.id order by q.id), '{}'::text[]) from (
    select s as id from unnest(array['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-8']) s
    where not exists (select 1 from public.ia_modelos m where m.id = s and not m.ativo)
    union
    select m.id from public.ia_modelos m join public.ia_provedores p on p.provider = m.provider
    where m.ativo and p.ativo and m.usd_in_mtok is not null and m.usd_out_mtok is not null
      and m.chat_ceo and m.disponibilidade <> 'indisponivel'
  ) q
$$;
