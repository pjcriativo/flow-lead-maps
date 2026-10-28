# CEO Mestre de IA + Central de IA (Super Admin) — implantação

Estado: **código no repositório, desligado por padrão, nada aplicado em produção.**
Migration `202610280001_ia_provedores_memoria_operacoes.sql` **não aplicada**; Edges `agent-ceo`,
`agent-worker` e `admin-acoes` **não republicadas**. O frontend publicado pelo push é retrocompatível
com o banco atual (as flags abaixo ficam desligadas).

## O que existe

| Área                    | Onde                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Central de IA           | Super Admin → Inteligência Artificial → Provedores & Modelos (`AdminIaProvedores.tsx`)                  |
| Ações do Super Admin    | Edge `admin-acoes`, ações `ia_*` (guarda `profiles.is_super_admin` já vale para toda a Edge)            |
| Cofre da chave          | `config_chaves` (AES-256-GCM, `CHAVES_MASTER_KEY` só como secret). A chave nunca volta ao navegador     |
| Adaptador OpenAI        | `_shared/ai-openai.ts` (Responses API, `store:false`, function calling, itens de raciocínio)            |
| Provedor/modelo/preço   | `ia_config`, `ia_provedores`, `ia_modelos`, `ia_eventos` (sem policy: só `service_role`)                |
| Roteamento + fallback   | `_shared/agent-edge-kit.ts` (`criarChamadorModelo`)                                                     |
| Teto agregado por org   | `agent_orcamento_org` + `agent_orcamento_org_estado` (padrão 3,50/dia e 35/mês = soma dos tetos)        |
| Memória por organização | `agent_memoria` + ferramentas `consultar_memoria` / `registrar_memoria`                                 |
| Operações por nicho     | `agent_operacoes` + `agent_operacao_agentes` + ferramenta `propor_operacao` + `agent_delegar_tarefa_op` |
| Prompt do CEO Mestre    | `_shared/agent-tools.ts` (`CEO_PROMPT_VERSAO`)                                                          |

Telas existentes reaproveitadas (nenhuma tela nova fora do Super Admin): 02 (assistente + operações),
08 (memória), 11 (aprovação de operações), 12 (resultados por operação).

## Flags (Vercel, build time) — todas desligadas por padrão

- `VITE_IA_CENTRAL=true`: mostra a Central no Super Admin e usa o catálogo de modelos na Tela 02.
- `VITE_CEO_MESTRE=true`: mostra operações e memória nas Telas 02/08/12.

## Ordem de implantação (cada passo exige autorização específica)

1. **Backup lógico** (mesmo procedimento da fase anterior) e conferência de `supabase_migrations`.
2. Aplicar a migration 004 em transação (`supabase db query --linked -f`, nunca `db push`),
   validar (`supabase/ops/verificar_fundacao_agentes.sql` + consultas de `ia_*`) e só então
   `supabase migration repair --status applied 202610280001`.
3. Regenerar `src/integrations/supabase/types.ts` (`scripts/gen-types.mjs`).
4. Publicar **exatamente** `admin-acoes`, `agent-ceo` e `agent-worker` (`verify_jwt` conforme `config.toml`).
5. Ligar `VITE_IA_CENTRAL=true` (Production) e republicar o frontend.
6. Super Admin: Provedores → colar a chave da OpenAI (validada com chamada **gratuita** `GET /models`
   antes de gravar) → Ativar → Modelos & preços (informar US$/1M tokens e ativar) → Limites & fallback
   (provedor e modelo do CEO).
7. Administrador da organização: Tela 02 → assistente do CEO (os modelos liberados aparecem; sem
   provedor pronto aparece _“Configure um provedor de IA no Super Admin para ativar o CEO.”_).
8. Ligar `VITE_CEO_MESTRE=true` e republicar.
9. **Primeira chamada paga** (smoke real da Responses API) só com autorização própria.

## Garantias verificadas por teste

- Chave: formato validado, máscara de no máx. 4 caracteres, redação de segredos em erros/logs, nada no
  frontend/localStorage, escrita só no cofre, resposta traz apenas estado.
- Central e orçamento: tabelas sem policy; Super Admin da plataforma lê só agregados (sem conversa,
  memória ou conteúdo de tarefa).
- Memória e operações: RLS só para gestores da própria organização; segredo/e-mail/telefone recusados
  (regex idêntica no SQL e no TypeScript); categorias de meta/decisão/feedback são de pessoas.
- Governança: o CEO só propõe; aprovar operação cria a operação (nunca agente nem permissão); a decisão
  genérica recusa propostas de equipe/operação; agentes compartilhados entre operações só por
  autorização humana; pausar/encerrar cancela o que está na fila.
- Custos: modelo sem preço é recusado; teto por agente (inalterado) + teto agregado por organização,
  ambos no backend; kill-switch relido a cada passo; fallback só autorizado, só em falha transitória e
  só se o custo máximo não exceder o do principal.
- Compatibilidade: sem a migration 004 as Edges operam como antes (Claude) e as telas não exibem nada novo.

Prova em Postgres em memória (pglite) da 001–004: **85 verificações**, fora do repositório (mesmo
procedimento da 003). Adaptador OpenAI testado com `fetch` simulado — **nenhuma chamada paga** foi feita.

## Limitação conhecida (declarar antes de ligar)

A integração com a Responses API foi validada por contrato e por simulação, não contra a API real. O
ponto de maior risco é o reenvio dos itens de raciocínio com `store:false`; o smoke do passo 9 deve
cobrir um turno com ferramenta antes de liberar o CEO para clientes.

## Reversão

- Frontend: desligar `VITE_IA_CENTRAL` / `VITE_CEO_MESTRE` e republicar.
- Provedor: Super Admin → Revogar chave (remove do cofre e desativa) ou desativar o provedor.
- Banco: a migration é aditiva; reverter = desativar o uso (flags) e manter as tabelas. Remoção física só
  com backup e autorização.

## Revisão do adaptador (Prompt 41, item 5)

Conferido por testes simulados: function calling (`function_call` → `function_call_output` por `call_id`),
encadeamento de dois turnos sem `previous_response_id` (contexto é nosso, `store:false`), reenvio dos
itens de raciocínio, contagem de tokens acumulável para custo, erros 401/429/5xx/400/timeout.

Correção feita: modelos sem raciocínio recusam `include: reasoning.encrypted_content` (400). O adaptador
repete **uma vez** sem o campo (o pedido foi rejeitado antes de gerar tokens: sem custo extra).

Atenção ao ligar: em modelos de raciocínio, `max_output_tokens` inclui os tokens de raciocínio; o limite
atual do agente (800) pode gerar resposta `incomplete` (erro permanente 422, sem custo oculto além do
consumido). Se ocorrer no smoke autorizado, subir `max_tokens_saida` do CEO pela UI de limites.

## Chat do CEO (Prompt 42)

Tela 10 vira o chat real com o CEO quando `VITE_CEO_IA_REAL=true` (já ligada): conversa ampla, atalhos
iniciais reais, seletor de operação, cartão "Plano de Operação Comercial" (aprovar usa as RPCs humanas),
copiar, tentar de novo (idempotente) e histórico. Botões "Conversar com CEO" nas Telas 01, 02 e 03.

Sem backend novo o chat funciona (Edge atual): histórico só na sessão. Para persistir e consultar
equipe/tarefas/aprovações pelo chat, depende de autorização específica:

1. Backup + migration `202610280002_ceo_chat_conversas.sql` (provada em pglite: 123 verificações 001–005).
2. Republicar `agent-ceo` (histórico por conversa, contexto da operação, ações no retorno).
3. Regenerar tipos; `VITE_CEO_CHAT=true` e redeploy.
4. Quem já habilitou a delegação do CEO precisa **reabilitar** (a 005 acrescenta `consultar_operacoes` à lista
   concedida por humano); nada é concedido automaticamente.

Isolamento: a conversa é do usuário dono (RLS `user_id = auth.uid()`), dentro da organização; outro admin
da mesma organização e o super admin da plataforma não leem. Segredos colados são redigidos antes de gravar.

## Central OpenAI — catálogo dinâmico (Prompt 47)

A tela Provedores & Modelos deixou de ter lista fixa: o catálogo vem de `GET /v1/models` (gratuito), com
busca, filtros por categoria/status, paginação, detalhes e histórico. Preço agora é **US$ por 1M de tokens**
(antes a tela mostrava por 1K) e qualquer alteração de preço já cadastrado exige confirmação.

**Código no `main`, retrocompatível com o banco/Edge atuais**: sem a migration a tela mostra os modelos já
gravados com a classificação inferida no navegador e avisa; "Atualizar modelos" responde com motivo claro
(`migration_catalogo_pendente` / `acao_desconhecida`) e não altera nada.

Para ativar (cada passo exige autorização específica do dono):

1. Backup + migration `202610290001_ia_catalogo_openai.sql` (aditiva e idempotente; provada em pglite, 12
   verificações). Ela também faz `agent_modelos_permitidos()` excluir modelos de imagem/áudio/indisponíveis.
2. Republicar a Edge `admin-acoes` (ação `ia_catalogo_sincronizar`, preços adicionais, capacidades, teste de
   acesso ao modelo do CEO via `GET /models/{id}`).
3. Regenerar tipos (`src/integrations/supabase/types.ts`).
4. Na tela: **Atualizar modelos** → o Super Admin precifica e habilita (nada nasce habilitado nem com preço).

Garantias: a sincronização nunca altera preço, habilitação, rótulo nem classificação manual; modelos que a
API deixa de listar viram `indisponivel` (não são apagados); lista vazia com 200 não marca o catálogo como
indisponível. Metadados que a API não fornece (contexto, preço, homologação) ficam vazios até o Super Admin
informar; "homologado" só existe após teste funcional real (nenhum foi feito: exige inferência paga).
Reversão: a migration é aditiva (colunas novas com default); basta não usar a ação nova.
