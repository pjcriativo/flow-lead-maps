# Relatório de Análise Arquitetural — Flow Leads

**Data**: 2026-08-19 06:13:27 (America/Sao_Paulo)  
**Arquivos analisados**: 293 arquivos de código (158 em `src`, 78 Edge Functions, 54 scripts e 3 arquivos-raiz)  
**Linhas analisadas**: 55.915 linhas não vazias  
**Arquivos completamente mortos**: 28  
**Grupos de duplicação confirmados**: 8

---

## Resumo executivo

O Flow Leads tem uma base de produto ampla e uma separação arquitetural reconhecível — rotas e componentes React, serviços de frontend, Supabase/RLS e Edge Functions com módulos `_shared`. Há bons controles explícitos de custo, autenticação e CORS no backend. Porém, o estado atual não está pronto para uma entrega confiável:

1. **O TypeScript não compila**: há 5 erros `TS2304` em `FonteProspeccao.tsx`.
2. **Contratos e Financeiro exibem e alteram dados fictícios em memória**, compartilhados por módulo e perdidos ao recarregar.
3. **Não existe suíte formal de testes nem comando `test`**; 54 scripts avulsos fazem verificações sem um runner comum.
4. **132 arquivos operacionais ficam fora do `tsconfig`**: todas as 78 Edge Functions e os 54 scripts.
5. **O lint falha com 215 erros e 17 avisos**.
6. **Há 28 arquivos sem entrada no grafo de imports**, equivalentes a 3.142 linhas não vazias, além de 17 exports mortos em arquivos utilizados.
7. **Os maiores fluxos estão concentrados em módulos e funções gigantes**: 26 arquivos manuscritos passam de 500 linhas e 157 funções passam de 50 linhas.

### Contagem consolidada

- **Código morto**: 28 arquivos; 205 exports sem uso (188 dentro dos módulos mortos + 17 em módulos vivos)
- **Funcionalidade duplicada**: 8 grupos confirmados
- **Anti-padrões arquiteturais**: 26 módulos gigantes, 1 ciclo de tipos, 14 violações de camada, 2 stores globais de mock e 1 dispatcher com 39 ações
- **Problemas de tipos**: 58 usos de `any`, 27 double assertions, 2 `@ts-expect-error` e 5 nomes não resolvidos
- **Code smells**: 157 funções longas, 19 listas longas de parâmetros, 159 condicionais aninhadas e pelo menos 62 literais de domínio repetidos

**Redução estimada**: remover código morto e consolidar as duplicações pode eliminar aproximadamente 3.500–3.900 linhas, cerca de 6–7% da base analisada.

---

## Mapa da arquitetura

```text
TanStack Start / Router
  └─ rotas (17)
      ├─ componentes de produto e admin (92)
      │   ├─ serviços de frontend (17) ──> Supabase client / RLS
      │   └─ 8 componentes ─────────────> Supabase client diretamente
      └─ SSR / middleware ──────────────> Supabase server client

Supabase Edge Functions (21 entradas)
  ├─ _shared (57 módulos)
  │   ├─ autenticação, CORS, limites e cofre
  │   ├─ providers de busca/IA/WhatsApp
  │   └─ geração de sites/templates
  ├─ Supabase service role / anon client
  └─ 6 funções importam módulos de src/lib

Persistência
  ├─ Supabase + 77 migrations
  └─ 2 stores de mock em memória (Contratos e Financeiro)
```

### Pontos fortes observados

- `strict: true` está habilitado para o frontend.
- CORS e controle de acesso têm módulos compartilhados (`_shared/cors.ts` e `_shared/acesso.ts`).
- `supabase/config.toml` declara `verify_jwt` explicitamente para as funções.
- Limites de gasto e livro-caixa estão representados em módulos de domínio, não apenas na UI.
- A camada `_shared/providers` separa os provedores de busca.
- Não foram encontrados ciclos de runtime entre os módulos manuais; o ciclo de templates é somente de tipos.
- O arquivo gerado do Supabase oferece uma fonte de tipos forte para o frontend.

---

## Código morto

### Arquivos completamente mortos — remover ou justificar

O grafo de imports foi construído para os 293 arquivos. Rotas TanStack, arquivos `index.ts` das Edge Functions, scripts, entradas SSR e arquivos gerados foram tratados como entry points. Os 28 itens abaixo não têm nenhum import de entrada.

#### Catálogo shadcn/ui não utilizado — 26 arquivos, 3.106 linhas não vazias

| Arquivo | Linhas | Confiança |
| --- | ---: | --- |
| `src/components/ui/sidebar.tsx` | 691 | HIGH |
| `src/components/ui/chart.tsx` | 296 | HIGH |
| `src/components/ui/carousel.tsx` | 211 | HIGH |
| `src/components/ui/menubar.tsx` | 211 | HIGH |
| `src/components/ui/context-menu.tsx` | 170 | HIGH |
| `src/components/ui/dropdown-menu.tsx` | 170 | HIGH |
| `src/components/ui/calendar.tsx` | 167 | HIGH |
| `src/components/ui/form.tsx` | 146 | HIGH |
| `src/components/ui/command.tsx` | 126 | HIGH |
| `src/components/ui/navigation-menu.tsx` | 109 | HIGH |
| `src/components/ui/alert-dialog.tsx` | 102 | HIGH |
| `src/components/ui/breadcrumb.tsx` | 91 | HIGH |
| `src/components/ui/pagination.tsx` | 88 | HIGH |
| `src/components/ui/drawer.tsx` | 86 | HIGH |
| `src/components/ui/table.tsx` | 84 | HIGH |
| `src/components/ui/input-otp.tsx` | 62 | HIGH |
| `src/components/ui/tabs.tsx` | 47 | HIGH |
| `src/components/ui/accordion.tsx` | 45 | HIGH |
| `src/components/ui/alert.tsx` | 43 | HIGH |
| `src/components/ui/scroll-area.tsx` | 40 | HIGH |
| `src/components/ui/radio-group.tsx` | 32 | HIGH |
| `src/components/ui/resizable.tsx` | 32 | HIGH |
| `src/components/ui/badge.tsx` | 27 | HIGH |
| `src/components/ui/progress.tsx` | 21 | HIGH |
| `src/components/ui/collapsible.tsx` | 6 | HIGH |
| `src/components/ui/aspect-ratio.tsx` | 3 | HIGH |

Esses módulos mantêm 188 exports sem consumidores. Dezenove dependências do `package.json` são importadas exclusivamente por esses arquivos e podem sair junto após validação do lockfile: 12 pacotes Radix, `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels` e `vaul`.

#### Outros arquivos mortos

| Arquivo | Linhas | Motivo | Confiança |
| --- | ---: | --- | --- |
| `src/lib/limite-plano.ts` | 30 | Nenhum import; os 4 exports não têm uso | HIGH |
| `supabase/functions/_shared/aplicar-cofre.ts` | 6 | Arquivo explicitamente depreciado; export vazio | HIGH |

**Total removível imediatamente**: 3.142 linhas não vazias em 28 arquivos.

### Exports mortos em arquivos vivos — 17

| Arquivo | Linha | Export | Motivo |
| --- | ---: | --- | --- |
| `src/components/leads/leads-shared.tsx` | 96 | `QTD_OPTIONS` | Só aparece na declaração |
| `src/components/leads/leads-shared.tsx` | 98 | `NICHE_TAGS` | Só aparece na declaração |
| `src/lib/copy-proposta.ts` | 56 | `MOTIVO_LABEL` | Só aparece na declaração |
| `src/lib/copy-proposta.ts` | 219 | `assuntoFollowUp` | Só aparece na declaração |
| `src/lib/copy-proposta.ts` | 241 | `montarCorpoFollowUp` | Só aparece na declaração |
| `src/lib/expiracao.ts` | 17 | `leadProtegido` | Só aparece na declaração |
| `src/lib/leads-api.ts` | 279 | `listarContatos` | Só aparece na declaração |
| `src/services/campanhas.ts` | 132 | `criarCampanhaWaDaLista` | Só aparece na declaração |
| `src/services/campanhas.ts` | 237 | `obterWaConfig` | Só aparece na declaração |
| `src/services/campanhas.ts` | 263 | `contarEnviadosWa` | Só aparece na declaração |
| `src/services/perfil.ts` | 46 | `lerNomeRemetente` | Só aparece na declaração |
| `src/services/propostas.ts` | 67 | `listarPropostasPorLead` | Só aparece na declaração |
| `src/services/whatsapp.ts` | 16 | `conectarWhatsapp` | Só aparece na declaração |
| `src/services/whatsapp.ts` | 24 | `pairWhatsapp` | Só aparece na declaração |
| `src/services/whatsapp.ts` | 440 | `historicoCampanhaWa` | Só aparece na declaração |
| `supabase/functions/_shared/providers/apify.ts` | 89 | `setApifyTokenOverride` | Só aparece na declaração |
| `supabase/functions/_shared/reviews.ts` | 27 | `setReviewsApifyTokenOverride` | Só aparece na declaração |

Os exports `TablesInsert`, `TablesUpdate` e `Constants` de `src/integrations/supabase/types.ts` foram excluídos desta classificação: pertencem a um arquivo gerado e funcionam como API de tipos, mesmo sem consumidor local atual.

### Código morto interno

Com `noUnusedLocals` e `noUnusedParameters` ativados temporariamente, o compilador encontra **27 diagnósticos de símbolos internos não usados**. Exemplos:

- `src/components/admin/AdminApiUsageDashboard.tsx:16` — `TrendingDown`
- `src/components/admin/AdminApiUsageDashboard.tsx:159` — `saldoCreditosIncluidosApify`
- `src/components/admin/AdminPanel.tsx:10` — `CreditCard`
- `src/components/admin/AdminUsers.tsx:1007` — parâmetro `onMudou`
- `src/components/redesign/RedesignSection.tsx:18` — seis ícones e um bloco de imports sem uso
- `src/routes/_authenticated/dashboard.tsx:64` — declaração inteira de import sem uso
- `src/routes/index.tsx:72` — variável `conteudo`

Recomendação: tornar `noUnusedLocals` e `noUnusedParameters` verdadeiros depois de limpar a fila inicial.

### Possivelmente morto — verificar

- `@cloudflare/vite-plugin`, `@hookform/resolvers`, `@tanstack/router-plugin`, `@types/dompurify` e `date-fns` não aparecem em imports ou CSS. `@cloudflare/vite-plugin` e `@tanstack/router-plugin` podem ser resíduos da configuração anterior; confirmar antes de remover.
- Scripts antigos de deploy/prova são entry points e, por isso, não foram classificados automaticamente como mortos. A pasta contém pares com intenção sobreposta (`apagar-edge.mjs`/`delete-edge.mjs`, `test-listar.mjs`/`test-listar2.mjs`) que precisam de uma decisão operacional.

---

## Funcionalidade duplicada

### CRITICAL — validador de e-mail duplicado

**Instâncias**:

- `src/lib/email-validation.ts:75`
- `supabase/functions/_shared/email-validation.ts:71`

As listas de domínios, palavras, TLDs, usernames e todo o algoritmo são praticamente idênticos; apenas uma mensagem difere. O tipo `EmailValidationResult` também está duplicado. Uma alteração nas regras pode passar no cadastro do frontend e falhar no admin/Edge, ou vice-versa.

**Recomendação**: mover regra e tipo para um módulo puro em uma área compartilhada pelos dois runtimes.

### CRITICAL — copy e cálculo de follow-up duplicados

**Instâncias**:

- `src/lib/copy-proposta.ts:227` — `frasePrazo`, `diasAte`, corpo do follow-up
- `supabase/functions/follow-up-cron/index.ts:33` — cópia manual da mesma lógica

O próprio comentário da Edge Function exige “se mudar lá, mude aqui”. O corpo da Edge acrescenta opt-out, mas copy e cálculo de dias são os mesmos.

**Recomendação**: compartilhar a função pura e deixar a Edge apenas anexar o rodapé de opt-out.

### CRITICAL — FNV-1a duplicado

**Instâncias**:

- `src/lib/wa-copy.ts:73`
- `supabase/functions/_shared/site/variantes.ts:22`

As duas funções `hashSemente` implementam FNV-1a 32-bit. Uma usa `>>> 0` também dentro do loop, mas o resultado pretendido é o mesmo.

**Recomendação**: manter uma utilidade pura compartilhada e testar vetores fixos.

### HIGH — autenticação/contexto Supabase repetidos em 12 Edge Functions

Doze handlers repetem criação do client de usuário, leitura de `Authorization`, `auth.getUser()`, resposta 401, verificação de acesso e criação do client admin. Dezoito repetem o preflight CORS.

**Recomendação**: extrair `createAuthenticatedContext(req)` para devolver `{ user, userClient, admin }` ou uma `Response` de erro. Isso centraliza políticas e reduz o risco de uma função esquecer uma etapa.

### HIGH — geocodificação Nominatim duplicada

**Instâncias**:

- `src/lib/geo.ts:16`
- `supabase/functions/_shared/geocode.ts:9`

URL, parsing, bounding box e cálculo de raio são equivalentes. Diferem apenas em headers, tratamento de erro e nome do campo de raio.

**Recomendação**: extrair o cálculo/parsing puro; manter adapters de fetch por runtime.

### HIGH — badges de status repetidos

`FinanceiroSection.tsx:44`, `ContratosSection.tsx:52` e `PublicarSection.tsx:47` repetem a mesma estrutura JSX, mudando somente maps de label/estilo. `PropostasSection.tsx:78` estende a mesma ideia com indicadores adicionais.

**Recomendação**: componente genérico `StatusBadge` que receba label e tone; manter a composição específica de Propostas.

### MEDIUM — campo de formulário duplicado

`WaCampanhas.tsx:1109` e `AutomacaoSection.tsx:607` têm o mesmo componente `Campo` de sete linhas. Outras quatro funções com o mesmo nome têm responsabilidades diferentes e não são duplicação real.

### HIGH — tipos de domínio duplicados

- `Lead`: `src/lib/leads-api.ts:6` e `src/types/index.ts:8`
- `ScoreBreakdown`: `src/lib/leads-api.ts:10` e `supabase/functions/_shared/score.ts:21`; `site_fora_do_ar` já diverge entre opcional e obrigatório
- `WaChip`: `src/services/whatsapp.ts:31` e `supabase/functions/_shared/wa.ts:56`
- `EmailValidationResult`: duplicado junto ao validador
- `Receita`: tipo completo no frontend, mas `any` no backend

O comentário de `src/types/index.ts` diz que toda tela deve consumir tipos centrais, mas `Lead` já foi redefinido fora dele.

---

## Anti-padrões arquiteturais

### P0 — stores globais de mock em telas de produto

#### `src/services/financeiro.ts`

- Mantém cinco cobranças fictícias em `let store`.
- `marcarComoPago` altera apenas memória.
- Todos os usuários recebem os mesmos dados de exemplo.
- O estado some ao recarregar.

#### `src/services/contratos.ts`

- Mantém contratos e modelos fictícios em `let store` e contador global `seq`.
- `gerarContrato` cria um contrato de exemplo sem lead/proposta real.
- `marcarComoAssinado` não persiste nada.

As telas não sinalizam de forma estrutural que são demonstrações. Isso é singleton abuse e cria risco de integridade do produto. A correção segura é desabilitar/rotular claramente essas ações até haver persistência real, ou implementar a camada real antes de expô-las.

### God modules — 26 arquivos manuscritos acima de 500 linhas

Os casos mais críticos:

| Arquivo | Linhas | Responsabilidades concentradas |
| --- | ---: | --- |
| `src/components/admin/AdminConfiguracoes.tsx` | 1.950 | configurações, pool Apify, chaves, perfil, formulários e persistência |
| `supabase/functions/admin-acoes/index.ts` | 1.699 | 39 ações administrativas, usuários, CMS, chaves, billing, sync Apify e relatórios |
| `src/components/admin/AdminUsers.tsx` | 1.225 | usuários, assinantes, planos, filtros, edição e tabelas |
| `src/components/whatsapp/WaCampanhas.tsx` | 1.094 | campanha, preparação, envio, chips, preview, filtros e estados |
| `src/components/campanhas/CampanhasSection.tsx` | 1.066 | listas, campanhas, redesign, propostas e revisão em lote |
| `src/components/admin/AdminPanel.tsx` | 1.029 | navegação, layout, sessão, configuração e composição de todo o admin |
| `src/components/leads/SearchSection.tsx` | 888 | formulário, streaming, mapa, lista, persistência e analytics |
| `src/components/propostas/PropostasSection.tsx` | 825 | listagem, revisão, edição, envio e status de e-mail |
| `src/components/admin/AdminApiUsageDashboard.tsx` | 779 | agregação e múltiplas visualizações de consumo |
| `src/components/leads/LeadsManager.tsx` | 765 | seleção, filtros, edição, massa, exclusão, listas e enriquecimento |
| `supabase/functions/_shared/wa.ts` | 732 | instâncias, chips, envio, health-check, alertas e histórico |
| `src/services/campanhas.ts` | 651 | CRUD, preparação, aprovação, envio e métricas |

Há ainda 14 módulos de produção e 2 scripts operacionais acima do limite de 500 linhas. `src/integrations/supabase/types.ts` tem 2.483 linhas, mas foi excluído desta classificação por ser gerado.

### Dispatcher administrativo monolítico

`supabase/functions/admin-acoes/index.ts:42` é um único callback de aproximadamente 1.741 linhas com 39 branches `acao === ...`. Autorização, parsing, acesso a banco e integrações externas ficam presos ao mesmo ponto de mudança.

**Impacto**: alta chance de conflito, difícil teste isolado e shotgun surgery. Separar handlers por ação/domínio mantendo uma única Edge Function roteadora é um primeiro passo de baixo risco.

### Ciclo de dependência de tipos nos templates de site

`premium.ts` importa sete templates, enquanto esses templates importam `NichoCfg` de `premium.ts`:

```text
premium.ts -> heros/sec_* -> premium.ts (type-only)
```

Não é um ciclo de runtime porque os imports de volta usam `import type`, mas acopla componentes folha ao compositor. Mover `NichoCfg` para `site/tipos.ts` ou `templates/types.ts` remove o ciclo.

O ciclo `router.tsx` ↔ `routeTree.gen.ts` também apareceu no grafo, mas é gerado pelo TanStack Router e foi classificado como esperado.

### Violações de camada

#### Componentes acessando Supabase diretamente — 8 arquivos

`SiteFooter`, `WaScripts`, `UserProfileSection`, `AdminTickets`, `WaCampanhas`, `AdminConfiguracoes`, `AdminPanel` e `SearchSection` importam o client e executam auth, storage ou queries diretamente, embora exista uma camada `services/` usada por outros 34 componentes.

**Impacto**: política de erro/loading/auth espalhada, consultas difíceis de testar e fronteira de dados inconsistente.

#### Edge Functions importando a camada `src/lib` — 6 funções

`automacao-rodar`, `buscar-redes`, `redesign-site`, `sdr-sugerir`, `search-leads` e `send-proposal-wa` importam módulos por caminhos como `../../../src/lib/...`.

Os módulos são puros e a reutilização evita duplicação, mas `src` é também a raiz do frontend/SSR. A fronteira correta seria um diretório explicitamente compartilhado (`shared/`), com contrato compatível com browser, Node e Deno.

### Cobertura de tipos fragmentada

O `tsconfig.json` cobre `src` e arquivos de configuração, mas não cobre:

- 78 arquivos TypeScript de Edge Functions;
- 54 scripts `.mjs`;
- `test-keys.ts` na raiz.

Não há `deno.json`, import map ou workflow de CI no repositório. Assim, o código que concentra autenticação, service role, gastos de API e webhooks é justamente o que não participa do typecheck principal.

### Migrações com prefixo duplicado

Existem duas migrations `007_*`: `007_lead_lists_uf_fonte.sql` e `007_sites_publicados.sql`. Os nomes completos evitam colisão de arquivo, mas o prefixo deixa a ordem semântica ambígua e aumenta risco em auditorias e ferramentas internas.

---

## Problemas de tipos

### Falha atual de compilação — 5 erros

`npx tsc --noEmit` falha em `src/components/leads/FonteProspeccao.tsx`:

| Linha | Erro | Causa observada |
| ---: | --- | --- |
| 269 | `PedidoBusca` não encontrado | O tipo é usado nas props, mas não foi importado |
| 285–286 | `onBuscar` não encontrado | A prop existe no tipo, mas foi omitida da desestruturação |
| 487, 491 | `isBuscaRunning` não encontrado | A prop existe no tipo, mas foi omitida da desestruturação |

Este é o primeiro item a corrigir antes de qualquer refatoração.

### `any` — 58 ocorrências

Distribuição principal:

| Arquivo | Ocorrências | Contexto |
| --- | ---: | --- |
| `supabase/functions/_shared/wa.ts` | 12 | respostas Evolution, rows e payloads |
| `supabase/functions/_shared/reviews.ts` | 5 | Apify e banco |
| `src/components/leads/MapaBusca.tsx` | 4 | Leaflet inteiro sem tipos |
| `src/services/redesign.ts` | 4 | RPC e rows Supabase |
| `supabase/functions/_shared/apify-pool.ts` | 4 | client admin, rows e corpo |
| `supabase/functions/wa-webhook/index.ts` | 3 | payload público e helper `pick` |
| Demais 23 arquivos | 26 | aliases `Admin`, JSON externo e casts de rows |

O padrão mais problemático é `type Admin = any`, repetido em 8 módulos Edge. Ele elimina verificação justamente em operações com service role.

### Double assertions — 27 ocorrências

Há 27 usos `as unknown as T`. A concentração maior está em:

- `src/services/propostas.ts` — 10
- `src/services/publicacao.ts` — 3
- `src/services/campanhas.ts` — 2
- `src/services/notificacoes.ts` — 2

Grande parte contorna incompatibilidades entre joins/JSON do Supabase e os tipos manuais. A correção é tipar os resultados de query ou validá-los na fronteira, não continuar empilhando casts.

### `@ts-expect-error` — 2 ocorrências

- `src/lib/posthog.ts:43`
- `src/lib/posthog.ts:54`

Ambas são passthroughs do PostHog. São de menor risco, mas devem ter erro esperado específico ou um adapter tipado.

### Assertions julgadas

O AST contém 292 type assertions no total. Foram classificadas como problemáticas as 27 double assertions e os casts para `any`; o restante é predominantemente `as const`, narrowing de literais ou adaptação de tipos gerados e não foi contado como defeito automaticamente.

---

## Code smells

### Funções longas — 157 acima de 50 linhas

Maiores casos:

| Arquivo:linha | Função | Linhas |
| --- | --- | ---: |
| `supabase/functions/admin-acoes/index.ts:42` | callback do `Deno.serve` | 1.741 |
| `src/components/whatsapp/WaCampanhas.tsx:119` | `WaCampanhas` | 974 |
| `src/components/admin/AdminUsers.tsx:31` | `AdminAllUsers` | 972 |
| `src/components/admin/AdminApiUsageDashboard.tsx:80` | `AdminApiUsageDashboard` | 734 |
| `src/components/leads/SearchSection.tsx:75` | `SearchSection` | 704 |
| `src/components/leads/LeadsManager.tsx:71` | `LeadsManager` | 633 |
| `src/components/campanhas/CampanhasSection.tsx:421` | `RevisaoEmLote` | 630 |
| `src/components/whatsapp/ChipsManager.tsx:56` | `ChipsManager` | 567 |
| `src/components/admin/AdminPanel.tsx:507` | `AdminPanel` | 557 |
| `src/components/admin/AdminConfiguracoes.tsx:1487` | `AdminConfiguracoes` | 542 |

### Listas longas de parâmetros — 19

Os piores casos:

- `supabase/functions/_shared/imghost.ts:163` — `resolverImagens`, 8 parâmetros
- `supabase/functions/_shared/site/montar.ts:23` — `montarHtml`, 8
- `supabase/functions/_shared/site/dados.ts:125` — `montarSiteData`, 7
- `src/lib/redes-teto.ts:23` — `planejarColeta`, 5
- `supabase/functions/automacao-rodar/index.ts:104` — `finalizar`, 5
- `supabase/functions/follow-up-cron/index.ts:47` — `followUpCorpo`, 5

Usar objetos nomeados torna invariantes e evolução das assinaturas mais seguros.

### Condicionais complexas — 159 nós aninhados em profundidade 3+

O maior caso está em `CampanhasSection.tsx:899–925`, com ternários JSX chegando a profundidade 8. Outros hotspots são `AdminUsers.tsx:458–539`, `LeadDetalhe.tsx:373–511`, `LeadsManager.tsx:465–644` e `services/campanhas.ts:683–685`.

Recomendação: calcular view models antes do JSX e trocar árvores de ternários por componentes/guards nomeados.

### Números e strings mágicos

- Milissegundos por dia (`86400000`/`86_400_000`) aparecem em 5 lugares.
- Strings de status e acesso (`proposta_enviada`, `aguardando_aprovacao`, `acesso_liberado`) aparecem 57 vezes entre frontend e Edge.

O problema não é o literal isolado, mas a regra de domínio atravessar runtimes sem uma fonte compartilhada. Extrair constantes/tipos compartilhados reduz shotgun surgery.

### Código comentado/depreciado

Não foram encontrados blocos relevantes de implementação comentada. O único arquivo explicitamente legado é `supabase/functions/_shared/aplicar-cofre.ts`, já sem consumidores e pronto para remoção.

### Nomes pobres

- `type Admin = any` aparece em 8 módulos.
- `type Rec` aparece em 4 módulos com significados diferentes.
- Payloads externos usam repetidamente `b`, `j`, `r`, `sj`, `qj` e `st` em fluxos longos.

Em handlers curtos isso seria tolerável; dentro de funções de centenas de linhas aumenta bastante a carga cognitiva.

---

## Estado de qualidade e verificação

### TypeScript

Comando: `npx tsc --noEmit`  
Resultado: **falhou com 5 erros `TS2304`**.

Com `noUnusedLocals`/`noUnusedParameters`: mais **27 diagnósticos** de código interno não usado.

### ESLint

Comando: `npm run lint`  
Resultado: **falhou com 232 problemas — 215 erros e 17 avisos**.

A maioria é Prettier, mas há também `no-explicit-any`, dependências de hooks e Fast Refresh. O volume atual faz o lint deixar de funcionar como portão de qualidade.

### Testes

- Arquivos `*.test.*`/`*.spec.*`: **0**
- Comando `test` no `package.json`: **não existe**
- Scripts `.mjs`: **54**; destes, 32 começam com `prova` e 13 com `test`

Esses scripts têm valor de diagnóstico, mas não substituem uma suíte repetível com assertions, isolamento e resultado agregado.

---

## Estatísticas

### Código morto

- Arquivos: 28
- Exports: 205
- Código interno não usado detectado pelo compilador: 27 diagnósticos
- Linhas removíveis: 3.142 não vazias

### Duplicação

- Grupos: 8
- Arquivos afetados: pelo menos 28
- Linhas duplicadas estimadas: 350–750

### Questões arquiteturais

- God modules manuscritos: 26
- Ciclos manuais: 1 ciclo somente de tipos
- Componentes que pulam a camada de serviço: 8
- Edge Functions acopladas a `src/lib`: 6
- Stores globais de mock: 2
- Edge Functions com boilerplate de auth repetido: 12

### Tipos

- `any`: 58
- Double assertions: 27
- `@ts-expect-error`: 2
- Erros atuais de compilação: 5
- Arquivos operacionais fora do typecheck principal: 132

### Code smells

- Funções longas: 157
- Funções com 4+ parâmetros: 19
- Condicionais aninhadas: 159
- Literais de domínio repetidos confirmados: pelo menos 62

---

## Priorização recomendada

### P0 — restaurar confiabilidade básica

1. Corrigir os 5 erros em `FonteProspeccao.tsx` e tornar `tsc --noEmit` obrigatório.
2. Retirar do fluxo real ou rotular claramente Contratos/Financeiro como demonstração; depois implementar persistência multi-tenant real.
3. Criar um comando `check` que execute typecheck e lint; zerar a fila atual antes de usá-lo como gate.

### P1 — proteger backend e regras de negócio

4. Incluir as 78 Edge Functions em um typecheck Deno/CI separado.
5. Substituir `type Admin = any` por um tipo comum do client Supabase.
6. Extrair autenticação/contexto dos 12 handlers Edge.
7. Dividir `admin-acoes` por handlers de domínio mantendo a rota externa compatível.
8. Criar testes unitários para tetos de gasto, dedupe, score, email, copy, hashes e planos; testes de contrato para Edge Functions críticas.

### P2 — reduzir custo de manutenção

9. Remover os 28 arquivos mortos e as 19 dependências que só os sustentam.
10. Consolidar email validation, follow-up, hash e geocodificação.
11. Extrair `NichoCfg` para quebrar o ciclo de tipos.
12. Mover módulos puros hoje em `src/lib` para uma área `shared/` explícita.
13. Separar componentes gigantes por view model, hooks e subcomponentes coesos.

### P3 — higiene contínua

14. Ativar `noUnusedLocals` e `noUnusedParameters`.
15. Renomear migrations com prefixo duplicado no processo/documentação futura, sem reescrever histórico já aplicado.
16. Catalogar scripts operacionais, arquivar duplicados e documentar quais são seguros contra produção/custos.

---

## Avaliação de impacto

### Potencial de limpeza

- Remoção de código morto: ~3.142 linhas não vazias
- Consolidação de duplicações: ~350–750 linhas
- Redução total estimada: ~3.500–3.900 linhas, ou ~6–7% da base

### Áreas de maior risco

- Integridade do produto: Contratos/Financeiro em memória
- Entrega: branch não compila e lint não serve como gate
- Backend privilegiado: Edge Functions fora do typecheck e uso recorrente de `any`
- Custos externos: regras importantes atravessam módulos e runtimes duplicados
- Manutenção: `admin-acoes`, Admin e campanhas concentram responsabilidades demais

### Ordem sugerida para um sprint de estabilização

1. Build verde e features mock honestas/desabilitadas.
2. Gate automatizado (`typecheck`, lint e testes mínimos).
3. Tipagem/autenticação compartilhada das Edge Functions.
4. Remoção de código morto.
5. Refatoração incremental dos monólitos, começando por `admin-acoes`.
