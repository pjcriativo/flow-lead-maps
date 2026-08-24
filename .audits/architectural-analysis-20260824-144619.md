# Relatório de Análise Arquitetural — Flow Leads

**Data**: 2026-08-24 14:46:19 (America/Sao_Paulo)
**Arquivos analisados**: 334 arquivos TypeScript/JavaScript
**Linhas analisadas**: 72.999 linhas físicas; 68.658 linhas não vazias
**Arquivos completamente mortos**: 28
**Grupos de duplicação confirmados**: 11

---

## Resumo executivo

O Flow Leads tem uma arquitetura de produto reconhecível: TanStack Start/React no frontend, uma camada de serviços para a maior parte das operações, Supabase/RLS na persistência e 26 Edge Functions apoiadas por 59 módulos `_shared`. Controles importantes de acesso, CORS, custo de APIs e isolamento por organização existem explicitamente no código.

O estado atual, porém, não oferece uma base confiável para entrega:

1. **O TypeScript falha com 11 erros**, todos em funcionalidades novas de Instagram. Dois vêm de uma prop omitida na desestruturação de `CompetitorDashboard`; nove vêm de tipos Supabase desatualizados em relação à migration `087_ig_evolution_inbox.sql`.
2. **Contratos e Financeiro continuam sendo funcionalidades fictícias mutáveis**: mostram dados compartilhados em memória, permitem ações aparentes e perdem tudo ao recarregar.
3. **Não existe suíte formal de testes nem comando `test`**. Há 64 scripts operacionais avulsos, mas zero arquivos `*.test.*`/`*.spec.*`.
4. **151 arquivos operacionais ficam fora do `tsconfig` principal**: 85 arquivos de Edge Functions, 64 scripts `.mjs`, `test-keys.ts` e um utilitário em `scratch/`.
5. **O lint falha com 2.885 problemas**: 2.868 erros e 17 avisos. Destes, 2.865 erros são automaticamente corrigíveis e majoritariamente de Prettier; o volume faz o lint deixar de ser um gate útil.
6. **Há 28 arquivos inalcançáveis no grafo de imports**, somando 2.992 linhas não vazias, 177 exports e até 22 dependências sem consumidor vivo.
7. **A complexidade cresceu com o módulo de Instagram**: 30 arquivos manuscritos passam de 500 linhas, 201 funções passam de 50 linhas e 224 nós condicionais aparecem em profundidade 3 ou maior.
8. **O backend privilegiado segue subtipado**: há 63 usos manuscritos de `any`, 27 double assertions e 19 Edge Functions repetindo autenticação com `auth.getUser()`.

### Contagem consolidada

- **Código morto**: 28 arquivos; 177 exports dentro deles; 17 símbolos adicionais sem nenhuma referência
- **Superfície pública desnecessária**: 212 exports usados apenas dentro do próprio módulo, mas nunca importados
- **Funcionalidade duplicada**: 11 grupos relevantes confirmados
- **Antipadrões arquiteturais**: 30 módulos gigantes, 2 stores globais de mock, 9 componentes acoplados ao Supabase, 7 Edge Functions acopladas a `src/lib`, 1 dispatcher com 43 comparações de ação
- **Problemas de tipos**: 11 erros de compilação, 63 `any` manuscritos, 27 double assertions, 2 `@ts-expect-error` e 27 diagnósticos de código interno não usado
- **Code smells**: 201 funções longas, 30 listas longas de parâmetros, 224 condicionais profundamente aninhadas e literais de domínio repetidos entre runtimes

**Redução estimada**: remover o código morto e consolidar duplicações pode eliminar aproximadamente 3.500–4.000 linhas não vazias, cerca de 5–6% da base atual.

---

## Evolução desde a auditoria de 2026-08-19

Desde o relatório anterior, 57 arquivos de código foram alterados e a base cresceu de 293 para 334 arquivos.

| Indicador | 2026-08-19 | 2026-08-24 | Tendência |
| --- | ---: | ---: | --- |
| Arquivos de código | 293 | 334 | +41 |
| Linhas não vazias | 55.915 | 68.658 | +12.743 |
| Erros TypeScript | 5 | 11 | piorou; erros antigos saíram e novos entraram |
| Problemas ESLint | 232 | 2.885 | piorou fortemente, sobretudo Prettier |
| Módulos >500 linhas | 26 | 30 | +4 |
| Funções >50 linhas | 157 | 201 | +44 |
| Listas com 4+ parâmetros | 19 | 30 | +11 |
| Condicionais em profundidade 3+ | 159 | 224 | +65 |
| Componentes com Supabase direto | 8 | 9 | +1 |
| Edge Functions importando `src/lib` | 6 | 7 | +1 |
| Testes formais | 0 | 0 | sem evolução |

O crescimento se concentrou nas fases de Instagram. Isso explica os novos hotspots `instagram-discovery/index.ts`, `CompetitorIntelligence.tsx`, `ContentDiscoveryHunter.tsx`, `InstagramAnalyticsDashboard.tsx` e `InstagramWorkspace.tsx`.

---

## Mapa da arquitetura

```text
TanStack Start / Router
  └─ 17 rotas
      ├─ 103 componentes React
      │   ├─ 21 serviços de frontend ──> Supabase client / RLS
      │   └─ 9 componentes ────────────> Supabase client diretamente
      └─ SSR / middleware ─────────────> Supabase server client

Supabase Edge Functions
  ├─ 26 entry points
  ├─ 59 módulos _shared
  │   ├─ acesso, CORS, cofre e limites
  │   ├─ providers de busca, IA, WhatsApp e Instagram
  │   └─ geração de sites e templates
  ├─ 19 handlers repetem auth.getUser()
  └─ 7 handlers importam 16 módulos de src/lib

Persistência
  ├─ Supabase + 88 migrations
  ├─ tipos gerados do frontend (desatualizados para migration 087)
  └─ 2 stores de mock em memória (Contratos e Financeiro)
```

### Pontos fortes observados

- `strict: true` está habilitado para o frontend.
- O projeto tem módulos compartilhados explícitos para CORS, acesso, cofre, gasto, cache e limites.
- RLS e isolamento por organização estão representados nas migrations e serviços.
- Os providers de busca ficam separados em `_shared/providers`.
- Os controles de custo de Apify e automação são tratados como regras de domínio.
- Não há ciclo manual de runtime confirmado. Um ciclo é gerado pelo TanStack Router e outro é de tipos/templates.
- O arquivo de tipos Supabase é uma fonte forte para o frontend quando regenerado após migrations.
- As novas rotinas de Instagram foram separadas em bibliotecas puras, serviços e componentes, mesmo que seus entry points ainda estejam grandes.

---

## Código morto

### Arquivos completamente mortos — remover ou justificar

O grafo foi construído para os 334 arquivos. Rotas TanStack, entradas SSR, arquivos `supabase/functions/*/index.ts`, scripts e arquivos gerados foram tratados como entry points. Os 28 arquivos abaixo não são alcançáveis a partir de nenhum deles.

| Arquivo | Linhas não vazias | Exports | Confiança |
| --- | ---: | ---: | --- |
| `src/components/ui/sidebar.tsx` | 691 | 24 | HIGH |
| `src/components/ui/chart.tsx` | 296 | 7 | HIGH |
| `src/components/ui/carousel.tsx` | 211 | 6 | HIGH |
| `src/components/ui/menubar.tsx` | 211 | 16 | HIGH |
| `src/components/ui/dropdown-menu.tsx` | 170 | 15 | HIGH |
| `src/components/ui/context-menu.tsx` | 170 | 15 | HIGH |
| `src/components/ui/calendar.tsx` | 167 | 2 | HIGH |
| `src/components/ui/form.tsx` | 146 | 8 | HIGH |
| `src/components/ui/sheet.tsx` | 107 | 10 | HIGH |
| `src/components/ui/navigation-menu.tsx` | 109 | 9 | HIGH |
| `src/components/ui/breadcrumb.tsx` | 91 | 7 | HIGH |
| `src/components/ui/pagination.tsx` | 88 | 7 | HIGH |
| `src/components/ui/drawer.tsx` | 86 | 10 | HIGH |
| `src/components/ui/table.tsx` | 84 | 8 | HIGH |
| `src/components/ui/input-otp.tsx` | 62 | 4 | HIGH |
| `src/components/ui/accordion.tsx` | 45 | 4 | HIGH |
| `src/components/ui/alert.tsx` | 43 | 3 | HIGH |
| `src/components/ui/scroll-area.tsx` | 40 | 2 | HIGH |
| `src/components/ui/resizable.tsx` | 32 | 3 | HIGH |
| `src/components/ui/radio-group.tsx` | 32 | 2 | HIGH |
| `src/lib/limite-plano.ts` | 30 | 4 | HIGH |
| `src/components/ui/tooltip.tsx` | 25 | 4 | HIGH |
| `src/components/ui/separator.tsx` | 21 | 1 | HIGH |
| `src/hooks/use-mobile.tsx` | 15 | 1 | HIGH |
| `src/components/ui/collapsible.tsx` | 6 | 3 | HIGH |
| `src/components/ui/skeleton.tsx` | 5 | 1 | HIGH |
| `supabase/functions/_shared/aplicar-cofre.ts` | 6 | 0 | HIGH |
| `src/components/ui/aspect-ratio.tsx` | 3 | 1 | HIGH |

**Total removível**: 2.992 linhas não vazias, 3.324 linhas físicas e 177 exports.

### Símbolos completamente sem referência — 17

Além dos arquivos mortos, estes símbolos aparecem somente em sua própria declaração. Foram verificados contra imports, usos internos, rotas e hooks de framework.

| Arquivo | Linha | Símbolo |
| --- | ---: | --- |
| `src/components/leads/leads-shared.tsx` | 96 | `QTD_OPTIONS` |
| `src/components/leads/leads-shared.tsx` | 98 | `NICHE_TAGS` |
| `src/lib/copy-proposta.ts` | 56 | `MOTIVO_LABEL` |
| `src/lib/copy-proposta.ts` | 219 | `assuntoFollowUp` |
| `src/lib/copy-proposta.ts` | 241 | `montarCorpoFollowUp` |
| `src/lib/expiracao.ts` | 17 | `leadProtegido` |
| `src/lib/leads-api.ts` | 279 | `listarContatos` |
| `src/services/campanhas.ts` | 132 | `criarCampanhaWaDaLista` |
| `src/services/campanhas.ts` | 237 | `obterWaConfig` |
| `src/services/campanhas.ts` | 263 | `contarEnviadosWa` |
| `src/services/perfil.ts` | 46 | `lerNomeRemetente` |
| `src/services/propostas.ts` | 67 | `listarPropostasPorLead` |
| `src/services/whatsapp.ts` | 16 | `conectarWhatsapp` |
| `src/services/whatsapp.ts` | 24 | `pairWhatsapp` |
| `src/services/whatsapp.ts` | 440 | `historicoCampanhaWa` |
| `supabase/functions/_shared/providers/apify.ts` | 89 | `setApifyTokenOverride` |
| `supabase/functions/_shared/reviews.ts` | 27 | `setReviewsApifyTokenOverride` |

Os dois setters de override parecem ganchos criados para testes que nunca foram adicionados. Se forem mantidos como API de teste futura, precisam de testes consumidores; hoje são código morto de confiança HIGH.

### Exports usados apenas internamente

Há **212 símbolos exportados que nunca são importados**, mas são usados dentro do próprio arquivo. Eles não são código morto executável; são superfície pública desnecessária. Remover apenas o modificador `export` reduz acoplamento acidental e melhora a precisão de ferramentas como Knip/ts-prune.

As maiores concentrações estão em:

- `src/services/campanhas.ts`: 13
- `src/lib/fontes-prospeccao.ts`: 12
- `src/lib/copy-proposta.ts`: 11
- `supabase/functions/_shared/wa.ts`: 11
- `supabase/functions/_shared/api-usage-summary.ts`: 10
- `src/lib/wa-copy.ts`: 9
- `src/lib/instagram-dashboard.ts`: 9

### Código morto interno

Com `noUnusedLocals` e `noUnusedParameters` ativados temporariamente, o compilador encontra **27 diagnósticos**. Exemplos:

- `src/components/admin/AdminApiUsageDashboard.tsx:16` — `TrendingDown`
- `src/components/admin/AdminApiUsageDashboard.tsx:159` — `saldoCreditosIncluidosApify`
- `src/components/admin/AdminPanel.tsx:10` — `CreditCard`
- `src/components/admin/AdminUsers.tsx:1007` — parâmetro `onMudou`
- `src/components/instagram/competitors/CompetitorIntelligence.tsx:19` — `MessageCircleQuestion`
- `src/components/leads/SearchSection.tsx:74` — `getBreakdown`
- `src/components/redesign/RedesignSection.tsx:18` — grupo de ícones e imports sem uso
- `src/routes/_authenticated/dashboard.tsx:66` — declaração inteira de import sem uso
- `src/routes/index.tsx:72` — variável `conteudo`

### Dependências possivelmente removíveis — verificar lockfile

Dezessete dependências são importadas exclusivamente pelos arquivos mortos:

`@radix-ui/react-accordion`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`, `@radix-ui/react-tooltip`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels` e `vaul`.

Outras cinco não aparecem em import algum: `@cloudflare/vite-plugin`, `@hookform/resolvers`, `@tanstack/router-plugin`, `@types/dompurify` e `date-fns`. As duas dependências de build devem ser confirmadas contra configuração implícita antes de remoção.

Scripts operacionais são entry points e não foram classificados automaticamente como mortos. Pares como `apagar-edge.mjs`/`delete-edge.mjs` e `test-listar.mjs`/`test-listar2.mjs` exigem decisão operacional.

---

## Funcionalidade duplicada

### CRITICAL — validação de e-mail duplicada

**Instâncias**:

- `src/lib/email-validation.ts:75`
- `supabase/functions/_shared/email-validation.ts:71`

As listas de domínios, palavras, TLDs, usernames e o algoritmo são praticamente iguais. O tipo `EmailValidationResult` também aparece nos dois arquivos. Regras podem divergir entre frontend e Edge.

**Recomendação**: mover a regra e o tipo para um módulo puro compartilhado entre browser, SSR e Deno.

### CRITICAL — copy e cálculo de follow-up duplicados

**Instâncias**:

- `src/lib/copy-proposta.ts:227`
- `supabase/functions/follow-up-cron/index.ts:33`

`frasePrazo`, cálculo de dias e montagem da mensagem repetem a mesma regra. A Edge adiciona o opt-out, mas não precisa duplicar a copy central.

### CRITICAL — FNV-1a duplicado

**Instâncias**:

- `src/lib/wa-copy.ts:73`
- `supabase/functions/_shared/site/variantes.ts:22`

As duas funções `hashSemente` implementam FNV-1a 32-bit. Manter vetores de teste e uma única função compartilhada elimina divergência sutil.

### HIGH — autenticação/contexto Supabase repetidos

Dezenove Edge Functions repetem leitura de `Authorization`, criação de client, `auth.getUser()`, 401 e criação de client admin. Vinte e uma repetem preflight `OPTIONS`.

**Recomendação**: criar `createAuthenticatedContext(req)` em `_shared`, retornando `{ user, userClient, admin }` ou uma `Response` de erro.

### HIGH — geocodificação Nominatim duplicada

- `src/lib/geo.ts:16`
- `supabase/functions/_shared/geocode.ts:9`

URL, parsing, bounding box e raio são equivalentes. Extrair parsing/cálculo puro e manter adapters de fetch por runtime.

### CRITICAL — badges de status copiados

`FinanceiroSection.tsx:44`, `ContratosSection.tsx:52` e `PublicarSection.tsx:47` têm `StatusPill` idênticos em estrutura. `PropostasSection.tsx:78` estende o mesmo conceito.

**Recomendação**: componente `StatusBadge` baseado em label/tone, preservando composição específica de Propostas.

### CRITICAL — componente `Campo` copiado

`WaCampanhas.tsx:1109` e `AutomacaoSection.tsx:607` repetem o mesmo componente de sete linhas. Os demais componentes chamados `Campo` têm responsabilidades diferentes.

### CRITICAL — `FlowStep` copiado no módulo Instagram

- `src/components/instagram/comments/CommentsHunter.tsx:603`
- `src/components/instagram/content/ContentDiscoveryHunter.tsx:806`

As duas implementações têm 26 linhas idênticas. Um componente compartilhado manteria os fluxos visuais consistentes.

### HIGH — inicialização/polling repetidos em hunters de Instagram

`CommentsHunter.tsx:123` e `ContentDiscoveryHunter.tsx:164` repetem efeitos de carga e ciclo de vida. A repetição já aparece junto a tipos, cards e estados de execução conceitualmente iguais.

**Recomendação**: extrair um hook de execução/polling e manter somente a transformação de domínio em cada hunter.

### HIGH — helpers operacionais copiados nos scripts

Os helpers de sessão/token e chamada de Edge Function têm blocos idênticos em pelo menos 12 scripts. `loadEnv` também é idêntico em `gen-types.mjs`, `sql.mjs` e `prova-isolamento-wa.mjs`.

**Recomendação**: criar uma biblioteca `scripts/lib/` com carregamento de ambiente, sessão e cliente HTTP. Isso também permite proteger centralmente scripts que tocam produção ou APIs pagas.

### HIGH — tipos de domínio duplicados

Grupos confirmados:

- `EmailValidationResult`: frontend e Edge
- `Lead`: `src/lib/leads-api.ts` e `src/types/index.ts`
- `ScoreBreakdown`: `src/lib/leads-api.ts` e `_shared/score.ts`
- `WaChip`: `src/services/whatsapp.ts` e `_shared/wa.ts`
- `Bloco`: quatro templates de site com a mesma forma
- `FotosOverride`/`FotoSet`: mesma estrutura em `site/dados.ts` e `site/imagens.ts`

`ScoreBreakdown` já diverge em opcionalidade. Essa é a evidência concreta de que a duplicação não é apenas estética.

---

## Antipadrões arquiteturais

### P0 — stores globais de mock em telas de produto

#### `src/services/financeiro.ts:9`

- Cinco cobranças fictícias vivem em `let store`.
- `marcarComoPago` altera apenas memória.
- Todos os usuários veem os mesmos exemplos.
- O estado desaparece ao recarregar.

#### `src/services/contratos.ts:62`

- Contratos e modelos fictícios vivem em `let store` e `seq` globais.
- `gerarContrato` cria contrato de exemplo sem lead/proposta real.
- `marcarComoAssinado` não persiste.

Comentários nas telas dizem que é mock, mas o usuário final ainda recebe botões e estados aparentando operação real. Isso conflita com a regra de honestidade de UI do próprio projeto.

**Recomendação**: desabilitar/rotular estruturalmente como demonstração até existir persistência multi-tenant, ou implementar a camada real antes de expor ações.

### P0 — contrato de banco e tipos gerados fora de sincronia

`supabase/migrations/087_ig_evolution_inbox.sql` cria `ig_instancias`, `ig_conversas` e `ig_mensagens`, mas `src/integrations/supabase/types.ts` não contém essas tabelas. `InstagramInbox.tsx` consulta as três diretamente e produz nove erros TypeScript.

**Causa raiz**: migration e geração de tipos não fazem parte de um único fluxo obrigatório.

**Recomendação**: regenerar tipos e adicionar uma verificação de drift ao processo de migration/CI.

### God modules — 30 arquivos manuscritos acima de 500 linhas

Maiores casos:

| Arquivo | Linhas | Responsabilidades concentradas |
| --- | ---: | --- |
| `supabase/functions/instagram-discovery/index.ts` | 2.451 | discovery, conteúdo, concorrentes, custo, Apify, persistência e dispatcher |
| `src/components/admin/AdminConfiguracoes.tsx` | 2.048 | configurações, pool, chaves, perfil, formulários e persistência |
| `supabase/functions/admin-acoes/index.ts` | 1.784 | usuários, CMS, billing, chaves, tickets, relatórios e Apify |
| `src/components/admin/AdminUsers.tsx` | 1.284 | usuários, assinantes, planos, filtros, edição e tabelas |
| `src/components/whatsapp/WaCampanhas.tsx` | 1.139 | campanha, envio, chips, preview, filtros e estado |
| `src/components/campanhas/CampanhasSection.tsx` | 1.107 | listas, campanhas, redesign, propostas e revisão em lote |
| `src/components/instagram/competitors/CompetitorIntelligence.tsx` | 1.106 | CRUD, coleta, snapshots, dashboards, alertas e navegação |
| `supabase/functions/buscar-redes/index.ts` | 1.105 | estratégias, Apify, custo, cache, score e persistência |
| `src/components/admin/AdminPanel.tsx` | 1.063 | sessão, layout, navegação e composição de todo o admin |
| `src/components/leads/SearchSection.tsx` | 969 | formulário, streaming, mapa, lista, persistência e analytics |
| `src/components/instagram/content/ContentDiscoveryHunter.tsx` | 890 | filtros, execução, polling, resultados, seleção e custos |
| `src/components/propostas/PropostasSection.tsx` | 861 | listagem, revisão, edição, envio e status |

`src/integrations/supabase/types.ts` tem 3.092 linhas, mas foi excluído da classificação por ser gerado.

### Dispatchers monolíticos

- `admin-acoes/index.ts:42`: callback de aproximadamente 1.743 linhas e 43 comparações `acao === ...`.
- `instagram-discovery/index.ts:1837`: handler de aproximadamente 615 linhas sobre um arquivo que já contém múltiplos pipelines grandes.

Separar handlers por domínio mantendo a rota externa compatível reduz conflito, melhora teste isolado e evita que autorização, parsing, banco e integrações externas mudem juntos.

### Ciclos de dependência

Dois componentes fortemente conectados foram detectados:

1. `router.tsx` ↔ `routeTree.gen.ts` — gerado e esperado pelo TanStack Router.
2. `premium.ts` ↔ `heros/sec_*` — ciclo de tipos/templates; os módulos folha importam `NichoCfg` do compositor.

Não há ciclo manual de runtime confirmado. Mover `NichoCfg` para `site/tipos.ts` ou `templates/types.ts` remove o segundo ciclo.

### Violações de camada

#### Componentes acessando Supabase diretamente — 9

`SiteFooter`, `AdminConfiguracoes`, `AdminPanel`, `AdminTickets`, `InstagramInbox`, `SearchSection`, `UserProfileSection`, `WaCampanhas` e `WaScripts` importam o client diretamente, apesar da camada `services/`.

`InstagramInbox` é o novo nono caso. O impacto é política de auth/erro/loading espalhada e dificuldade de teste.

#### Edge Functions importando a camada `src/lib` — 7

`automacao-rodar`, `buscar-redes`, `instagram-discovery`, `redesign-site`, `sdr-sugerir`, `search-leads` e `send-proposal-wa` importam 16 módulos em `src/lib`.

Os módulos são puros e a reutilização é positiva, mas `src` continua sendo semanticamente a raiz do frontend. Uma área `shared/` compatível com browser, Node e Deno tornaria essa fronteira explícita.

### Cobertura de tipos fragmentada

O `tsconfig.json` cobre `src`, `vite.config.ts` e `eslint.config.js`, mas deixa fora 151 arquivos operacionais:

- 85 arquivos TypeScript de Edge Functions;
- 64 scripts `.mjs`;
- `test-keys.ts`;
- `scratch/check-prod-ui.mjs`.

Não há `deno.json`, import map de validação ou workflow de CI no repositório. O backend que usa service role, webhooks e APIs pagas não participa do typecheck principal.

### Migrações com prefixo duplicado

Persistem duas migrations `007_*`: `007_lead_lists_uf_fonte.sql` e `007_sites_publicados.sql`. Não se deve reescrever migration aplicada, mas a convenção futura precisa impedir duplicidade e registrar ordem inequívoca.

---

## Problemas de tipos

### Falha atual de compilação — 11 erros

#### `CompetitorIntelligence.tsx` — 2 erros

`CompetitorDashboard` declara `onNavigate` no tipo das props em `:602`, mas omite a propriedade da desestruturação em `:592–597`. O JSX usa o nome em `:932` e `:936`, onde ele está fora de escopo.

#### `InstagramInbox.tsx` — 9 erros

As consultas em `:52`, `:65` e `:76` usam tabelas ausentes dos tipos gerados. Os erros subsequentes em `.eq`, `setAccount`, `setConversations` e `setMessages` são cascata desse drift.

Esse diagnóstico contradiz o commit mais recente, cuja mensagem afirma corrigir o build da Vercel removendo um import não utilizado. O import saiu, mas o typecheck continua vermelho.

### `any` — 63 ocorrências manuscritas

O AST encontra 79 palavras-chave `any`; 16 estão em `routeTree.gen.ts` e foram excluídas por serem geradas. As 63 restantes se concentram em fronteiras de alto risco:

- `_shared/wa.ts`: payloads Evolution, rows e respostas
- `_shared/apify-pool.ts`: client admin, linhas e payloads
- `_shared/reviews.ts`: Apify e banco
- `MapaBusca.tsx`: objetos Leaflet
- `services/redesign.ts`: RPC e rows Supabase
- oito ou mais aliases `Admin = any`/`Client = any`/`DB = any`

O padrão `type Admin = any` elimina verificação justamente nas operações com service role.

### Double assertions — 27

Concentração principal:

- `src/services/propostas.ts`: 10
- `src/services/publicacao.ts`: 3
- `src/services/campanhas.ts`: 2
- `src/services/notificacoes.ts`: 2
- demais arquivos: 10

Grande parte contorna incompatibilidades entre joins/JSON do Supabase e tipos manuais. A correção é tipar ou validar a fronteira, não perpetuar `as unknown as T`.

### Supressões TypeScript — 2

- `src/lib/posthog.ts:43`
- `src/lib/posthog.ts:54`

Ambas são passthroughs do PostHog. São de menor risco, mas um adapter tipado evitaria depender de `@ts-expect-error` genérico.

### Type assertions julgadas

O AST encontra 350 assertions. Foram classificadas como problemáticas as 27 double assertions e casts para `any`; `as const`, narrowing de literais e adaptações geradas não foram contados automaticamente como defeito.

---

## Code smells

### Funções longas — 201 acima de 50 linhas

Maiores casos:

| Arquivo:linha | Função | Linhas |
| --- | --- | ---: |
| `admin-acoes/index.ts:42` | callback `Deno.serve` | 1.743 |
| `WaCampanhas.tsx:119` | `WaCampanhas` | 974 |
| `AdminUsers.tsx:31` | `AdminAllUsers` | 972 |
| `SearchSection.tsx:77` | `SearchSection` | 735 |
| `AdminApiUsageDashboard.tsx:80` | `AdminApiUsageDashboard` | 734 |
| `instagram-discovery/index.ts:611` | `processarDescobertaConteudo` | 659 |
| `LeadsManager.tsx:71` | `LeadsManager` | 633 |
| `CampanhasSection.tsx:421` | `RevisaoEmLote` | 630 |
| `instagram-discovery/index.ts:1837` | callback `Deno.serve` | 615 |
| `ChipsManager.tsx:56` | `ChipsManager` | 567 |
| `AdminConfiguracoes.tsx:1491` | `AdminConfiguracoes` | 558 |
| `AdminPanel.tsx:507` | `AdminPanel` | 557 |

### Listas longas de parâmetros — 30

Piores casos:

- `_shared/imghost.ts:163` — `resolverImagens`, 8 parâmetros
- `_shared/site/montar.ts:23` — `montarHtml`, 8
- `CompetitorIntelligence.tsx:194` — `updateInterval`, 7
- `_shared/site/dados.ts:125` — `montarSiteData`, 7
- `instagram-discovery/index.ts:328` — `criarStep`, 7
- `src/lib/redes-teto.ts:52` — `planejarColeta`, 5
- `_shared/redes-cache.ts:121` — `salvarCacheRedes`, 5

Objetos nomeados tornariam invariantes, defaults e evolução das assinaturas mais seguros.

### Condicionais complexas — 224 nós em profundidade 3+

Os hotspots continuam em componentes grandes de Admin, Campanhas e Leads, agora acompanhados pelos dashboards/hunters de Instagram. JSX com ternários profundamente aninhados mistura decisão de domínio e apresentação.

**Recomendação**: calcular view models antes do JSX e trocar árvores por guards/componentes nomeados.

### Números e strings mágicos

- Milissegundos por dia (`86400000`/`86_400_000`) aparecem em 9 pontos.
- `proposta_enviada` aparece 20 vezes.
- `acesso_liberado` aparece 40 vezes.

O risco é a regra atravessar frontend e Edge sem uma fonte de contrato compartilhada.

### Código comentado

**None found**: não foram encontrados blocos relevantes de implementação comentada. O match em `src/integrations/supabase/client.ts:34` é uma linha de documentação de uso, não código legado.

### Nomes pobres

- `type Admin = any`, `Client = any` e `DB = any` escondem responsabilidade e tipo.
- `type Rec` aparece em fluxos extensos com significados diferentes.
- Payloads externos usam `b`, `j`, `r`, `sj`, `qj` e `st` dentro de funções longas.

---

## Estado de qualidade e verificação

### TypeScript

Comando: `npx tsc --noEmit --pretty false`
Resultado: **falhou com 11 erros**.

Com `noUnusedLocals` e `noUnusedParameters`: os 11 erros permanecem e surgem mais **27 diagnósticos de símbolos internos sem uso**.

### ESLint

Comando: `npm run lint -- --format stylish`
Resultado: **falhou com 2.885 problemas — 2.868 erros e 17 avisos**.

Dos erros, 2.865 são marcados como automaticamente corrigíveis. A maioria é Prettier nos arquivos novos, mas existem também `no-explicit-any` e avisos de hooks.

### Testes

- Arquivos `*.test.*`/`*.spec.*`: **0**
- Comando `test` no `package.json`: **não existe**
- Scripts `.mjs`: **64**

Scripts de prova ajudam em diagnósticos, mas não oferecem descoberta automática, isolamento, assertions uniformes, cobertura ou um resultado agregado confiável.

---

## Estatísticas

### Código morto

- Arquivos: 28
- Exports em arquivos mortos: 177
- Símbolos adicionais sem referência: 17
- Exports usados apenas internamente: 212
- Código interno não usado detectado pelo compilador: 27 diagnósticos
- Linhas não vazias removíveis: 2.992

### Duplicação

- Grupos relevantes confirmados: 11
- Arquivos afetados: pelo menos 40
- Linhas duplicadas estimadas: 500–1.000

### Questões arquiteturais

- God modules manuscritos: 30
- Ciclos: 1 gerado + 1 de tipos; 0 ciclo manual de runtime confirmado
- Componentes que pulam a camada de serviço: 9
- Edge Functions acopladas a `src/lib`: 7
- Stores globais de mock: 2
- Edge Functions com `auth.getUser()` repetido: 19
- Comparações de ação no dispatcher admin: 43

### Tipos

- Erros atuais de compilação: 11
- `any` manuscrito: 63
- Double assertions: 27
- `@ts-expect-error`: 2
- Arquivos operacionais fora do typecheck principal: 151

### Code smells

- Funções longas: 201
- Funções com 4+ parâmetros: 30
- Condicionais aninhadas: 224
- Literais de dia repetidos: 9

---

## Priorização recomendada

### P0 — restaurar confiabilidade básica

1. Corrigir `CompetitorDashboard` incluindo `onNavigate` na desestruturação.
2. Regenerar os tipos Supabase após a migration 087 e tornar drift de tipos um erro de CI.
3. Fazer `tsc --noEmit` passar antes de qualquer novo merge/deploy.
4. Retirar Contratos/Financeiro do fluxo real ou rotular/desabilitar explicitamente como demonstração até haver persistência multi-tenant.

### P1 — criar gates que revelem regressão

5. Formatar a base e separar o gate `format:check` do lint semântico; então zerar os 3 erros não corrigíveis e 17 avisos.
6. Adicionar `typecheck`, `test` e `check` ao `package.json`.
7. Criar testes unitários para limites de gasto, dedupe, score, validação de e-mail, copy, hashes e planos.
8. Criar testes de contrato para Edge Functions de autenticação, custo, inbox/webhook e envio.
9. Adicionar typecheck Deno separado para os 85 arquivos Edge.

### P2 — proteger backend e reduzir acoplamento

10. Substituir aliases `Admin = any` por um tipo comum do client Supabase.
11. Extrair contexto autenticado dos 19 handlers.
12. Dividir `admin-acoes` e `instagram-discovery` em handlers de domínio, preservando endpoints.
13. Mover os 16 módulos puros consumidos por Edge para uma fronteira `shared/` explícita.
14. Fazer `InstagramInbox` consumir um serviço em vez do client Supabase diretamente.

### P3 — reduzir custo de manutenção

15. Remover os 28 arquivos mortos e revisar as 22 dependências associadas.
16. Remover os 17 símbolos totalmente sem referência e tornar internos os 212 exports que não são API.
17. Consolidar validação de e-mail, follow-up, hash, geocodificação, status badges e componentes/hook de Instagram.
18. Extrair `NichoCfg` para quebrar o ciclo de tipos.
19. Separar componentes gigantes por view models, hooks e subcomponentes coesos.
20. Ativar `noUnusedLocals` e `noUnusedParameters` depois de limpar os 27 diagnósticos.
21. Catalogar scripts operacionais, centralizar helpers e documentar quais podem tocar produção ou gerar custo.

---

## Avaliação de impacto

### Potencial de limpeza

- Remoção de código morto: 2.992 linhas não vazias
- Consolidação de duplicações: aproximadamente 500–1.000 linhas
- Redução total estimada: 3.500–4.000 linhas, cerca de 5–6% da base
- Dependências candidatas à remoção: até 22

### Áreas de maior risco

- **Entrega**: branch principal não passa no TypeScript.
- **Integridade do produto**: Contratos e Financeiro permitem mutações fictícias.
- **Drift de banco**: migrations e tipos gerados não estão sincronizados.
- **Backend privilegiado**: Edge Functions ficam fora do typecheck e usam `any` em clients admin.
- **Custos externos**: regras importantes atravessam runtimes duplicados e handlers gigantes.
- **Manutenção**: Admin e Instagram concentram múltiplas responsabilidades e cresceram sem testes.

### Ordem sugerida para um sprint de estabilização

1. TypeScript verde e UI honesta para mocks.
2. Gates locais/CI: typecheck, format check, lint semântico e testes mínimos.
3. Sincronização automática migration → tipos Supabase.
4. Tipagem/autenticação compartilhada das Edge Functions.
5. Remoção segura de código/dependências mortos.
6. Refatoração incremental de `admin-acoes` e `instagram-discovery` com testes de caracterização.
