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
