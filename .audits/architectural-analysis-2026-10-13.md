# Auditoria técnica — Gestão Comercial, Conversas, WhatsApp e Automações

**Data:** 2026-10-13

**Escopo:** auditoria estática e somente de leitura dos módulos comerciais; a única alteração funcional desta entrega está na navegação da Fase A.

**Limite da evidência:** “funcional” significa que há UI, serviço e persistência/integração conectados no código. Credenciais, disponibilidade de provedores e comportamento do ambiente publicado não foram testados. Nenhuma migration, RLS, Edge Function, webhook, provedor ou dado foi modificado.

---

## Resumo executivo

1. A sidebar foi reorganizada na ordem solicitada, com **Gestão** logo após Home e seus oito itens no submenu. Rotas, componentes, permissões e logo foram preservados.
2. **Conversas** e **WhatsApp** não eram dois módulos principais distintos: as duas entradas apontavam para `section="whatsapp"`, que renderiza `WhatsAppSection`. A duplicação era de navegação. O item em Gestão agora se chama “Conversas e WhatsApp”; o item WhatsApp em Canais de Aquisição foi preservado e ambos continuam abrindo a mesma rota atual.
3. Existe uma segunda inbox, efetivamente distinta, dentro do módulo Instagram: `InstagramInbox`. Ela usa `ig_conversas`/`ig_mensagens`, Meta/Unipile/session worker/Evolution legado e possui integração mais rica com CRM.
4. O WhatsApp possui operação real de instâncias, QR/pairing, envio, webhook, campanhas, scripts e inbox. A inbox é parcial como central de atendimento: faltam fila, atribuição, transferência, encerramento, tags e status de entrega detalhado.
5. Há pelo menos três conceitos de automação: receitas de prospecção (`automacao_receitas`), Flow Builder oficial do Instagram (`instagram_flows`) e automação do session worker. Eles são motores diferentes e não devem ser fundidos por troca de backend.
6. As telas atualmente roteadas de **Leads** e **Pipeline** são apresentações premium com dados mockados. Em paralelo, componentes antigos com backend real continuam no repositório, importados mas não renderizados. Isso é a regressão arquitetural mais crítica encontrada.
7. **Minhas Listas** é funcional e usa os mesmos registros de `leads`, via `leads.list_id`. Hoje a relação é um-para-muitos: cada lead pertence a no máximo uma lista; excluir uma lista pode excluir seus leads por cascata. Isso impede tratar lista como simples pasta ou tag sem redesenhar o modelo.

---

## 1. Estrutura final da sidebar

```text
HOME
GESTÃO
  Leads
  Minhas Listas
  Pipeline
  Conversas e WhatsApp
  Automações
  Propostas
  Contratos
  Financeiro
CAMPANHAS
  (submenu existente preservado)
FLOW MARKETING AI
  (submenu existente preservado)
AI INFLUENCERS STUDIO
  (submenu existente preservado)
CANAIS DE AQUISIÇÃO
  Google Maps
  Instagram
  LinkedIn
  YouTube
  TikTok
  WhatsApp
  Business B&B
SISTEMA
  (recursos existentes preservados)
```

`MANAGEMENT_SUBITEMS` concentra os oito destinos em `src/components/home-premium/DashboardSidebar.tsx`. O estado `isManagementExpanded` é reaberto quando `activeSection` pertence a Gestão. O contêiner da navegação usa scroll vertical, bloqueia overflow horizontal e reserva o gutter da scrollbar para evitar deslocamento/truncamento.

## 2. Arquivos alterados na Fase A

| Arquivo | Alteração |
|---|---|
| `src/components/home-premium/DashboardSidebar.tsx` | Grupo Gestão expansível, nova ordem, remoção das entradas principais duplicadas, título “Conversas e WhatsApp” e correção de scroll. |
| `scripts/home-premium.test.mjs` | Contratos de ordem, conteúdo do submenu e preservação do WhatsApp em aquisição. |
| `scripts/campanhas-premium.test.mjs` | Expectativas de ordem e comportamento de scroll atualizadas. |
| `scripts/marketing-ai.test.mjs` | Expectativa de posição ajustada à nova hierarquia. |
| `scripts/influencers-studio.test.mjs` | Expectativa de posição ajustada à nova hierarquia. |

Não foram alterados: rotas, serviços, permissões, banco, migrations, RLS, provedores, webhooks, layouts das telas ou `FlowLeadsLogo`.

## 3. Testes de navegação

Comando dirigido executado:

```text
node --test scripts/home-premium.test.mjs scripts/campanhas-premium.test.mjs
  scripts/marketing-ai.test.mjs scripts/influencers-studio.test.mjs
  scripts/leads-premium.test.mjs scripts/pipeline-premium.test.mjs
```

Resultado dirigido: **77 testes aprovados, 0 falhas**.

Verificação final:

- Suíte completa: **154 testes aprovados, 0 falhas**.
- Build Vite/Nitro: **aprovado**.
- ESLint dos cinco arquivos de código/teste tocados: **0 erros e 2 warnings preexistentes** de Fast Refresh no `DashboardSidebar`.
- `git diff --check`: **aprovado**.
- TypeScript global: falha em cinco erros fora do escopo, nos arquivos `AvatarAdditionalSteps.tsx`, `AvatarCreatorPage.tsx` e `UgcVideoStudioPage.tsx` (`nextLabel` ausente e propriedade `views` incompatível).
- ESLint global: falha em dívida preexistente ampla (**1.189 ocorrências**) distribuída por scripts, Edge Functions, testes e uma `.venv`; os arquivos tocados não adicionam erros.

---

## 4. Arquitetura atual de Conversas

### 4.1 Conversas do WhatsApp

- Rota: `src/routes/_authenticated/dashboard.tsx`, seção `whatsapp`.
- Contêiner: `src/components/whatsapp/WhatsAppSection.tsx`.
- Inbox: `src/components/whatsapp/WaConversas.tsx`.
- Serviço: `src/services/whatsapp.ts` — `listarConversas`, `listarMensagens`, `marcarConversaLida`, `responderConversa`.
- Persistência: `wa_mensagens`, definida em `supabase/migrations/032_wa_scripts_mensagens.sql`.
- Recepção: `supabase/functions/wa-webhook/index.ts`.
- Resposta: `supabase/functions/wa-responder/index.ts`.
- Permissão: RLS por `user_id`; leitura/update pelo dono, insert do webhook por service role.

`listarConversas` agrupa mensagens por número no cliente. A tela lista threads, abre histórico, marca leitura e responde. Há polling a cada 8 segundos. A recepção atual aceita texto 1:1; grupos, mídia e mensagens não textuais são ignorados pelo webhook.

### 4.2 Conversas do Instagram

- Tela: `src/components/instagram/inbox/InstagramInbox.tsx`.
- Serviço agregado: `src/services/flow-business.ts`.
- Persistência: `ig_conversas`, `ig_mensagens`, `instagram_crm_cards`, `instagram_crm_activities`, `instagram_crm_tasks`.
- Schema base: `supabase/migrations/087_ig_evolution_inbox.sql`.
- Enriquecimento CRM/flows: `supabase/migrations/095_flow_business_operating_system.sql`.
- Provedores: Meta oficial (`flow-business-meta`/`flow-business-webhook`), Unipile, session worker e Evolution legado.
- Permissão: RLS por `org_id` e associação à organização.

A inbox do Instagram possui busca, filtro, não lidas, Realtime, envio real, marcação, tags simples, card CRM, atividades, notas e mudança de etapa. Anexos e emoji estão desabilitados; os atalhos de proposta/reunião/material são visuais; o assistente declara que geração de IA não está configurada.

### 4.3 Inventário funcional da inbox

| Capacidade | WhatsApp | Instagram |
|---|---|---|
| Caixa de entrada | Funcional | Funcional |
| Recebidas/enviadas | Funcional para texto | Funcional para texto; metadados mais ricos |
| Conversa por cliente | Funcional, agrupada por número | Funcional, persistida em `ig_conversas` |
| Canal identificado | Implícito: WhatsApp/instância | Explícito: conta/provedor/source |
| Histórico | Funcional | Funcional |
| Anexos | Parcial no schema/scripts; webhook da inbox ignora mídia | Interface desabilitada/ausente no envio atual |
| Tags | Ausente | Parcial (`tags`/marcação) |
| Responsável | Ausente | Parcial (`assigned_to`; pouca operação na inbox) |
| Status de atendimento | Ausente | Parcial no modelo |
| Fila | Ausente | Ausente para agentes; jobs existem para automação |
| Transferência | Ausente | Ausente |
| Respostas rápidas | Scripts em aba separada, não integrados ao composer | Ausente |
| Automação | Sugestão SDR e campanhas; sem gatilho genérico da inbox | Fluxos reais para incoming message/comment; UI expõe comment keyword |
| CRM/Pipeline | `lead_id` opcional, sem painel CRM integrado | Integração funcional com cards, atividades, notas e etapa |

---

## 5. Arquitetura atual de WhatsApp

### Componentes e serviços

- `WhatsAppSection`: abas Painel, WhatsApp, Campanhas, Conversas e Scripts.
- `ChipsManager`: conexão e gestão de N instâncias/chips.
- `WaConversas`: inbox/histórico/resposta.
- `WaCampanhas`: disparos e acompanhamento.
- `WaScripts`: textos e mídia reutilizáveis.
- `src/services/whatsapp.ts`: fachada frontend.
- `supabase/functions/_shared/wa.ts`: autenticação, seleção/rotação e chamadas ao provedor.

### Motor e recursos reais

O motor atual é **Evolution GO**, não deve ser confundido com variantes Node da Evolution API. Endpoints evidenciados incluem `/instance/all`, `/instance/create`, `/instance/delete/{id}`, `/instance/status`, `/instance/qr`, `/instance/pair` e `/send/text`.

| Recurso | Estado | Evidência |
|---|---|---|
| Conexão de instância | Funcional | `wa-connect`, `wa-chips`, `wa_instancias` |
| QR Code/pairing | Funcional | rotas `/instance/qr` e `/instance/pair` em `_shared/wa.ts` |
| Sessões/chips | Funcional | status, função `disparo|conversa`, saúde e rotação |
| Chats/contatos | Parcial | threads derivadas de `wa_mensagens`; não há catálogo próprio completo de contatos |
| Mensagens texto | Funcional | `wa-webhook` e `wa-responder` |
| Arquivos/mídia na inbox | Ausente/parcial | `media_url` existe, mas webhook atual descarta não texto |
| Campanhas/disparos | Funcional | `send-proposal-wa`, `wa_envios`, `WaCampanhas` |
| Templates | Parcial | `wa_scripts`; não são templates oficiais do provedor |
| Webhook | Funcional para texto 1:1 | `wa-webhook` com segredo de query e deduplicação por `externo_id` |
| Fila/retry | Ausente na inbox | envio é síncrono; não há fila persistente de atendimento/retry |
| Status de entrega | Parcial | histórico de envio/campanha; `wa_mensagens` não modela lifecycle completo |
| Erros | Parcial | UI mostra falhas, mas existem catches vazios e insert outbound não validado |
| Limites | Funcional para disparo | limite diário, saúde/rotação e graduação de chip |
| CRM | Parcial | `lead_id` em `wa_mensagens`; sem workspace comercial unificado |
| Automações | Parcial | receitas podem selecionar canal/chip; sem eventos genéricos de conversa |

Risco multi-tenant: módulos antigos de WhatsApp usam predominantemente `user_id`, enquanto o CRM do Instagram e tabelas mais recentes usam `org_id`. Migrations posteriores adicionam organização a tabelas, mas o serviço WhatsApp ainda consulta por usuário em vários pontos. Em equipes, isso pode produzir visibilidade diferente entre membros; é um risco inferido do código e deve ser validado com dados/roles reais antes de qualquer unificação.

---

## 6. Comparação obrigatória — Conversas versus WhatsApp

1. **Usam as mesmas tabelas?** Sim, quando “Conversas” significa a entrada principal antiga: ambas abrem `WhatsAppSection` e usam `wa_mensagens`. Não, quando comparadas à inbox Instagram, que usa `ig_conversas`/`ig_mensagens`.
2. **Apresentam as mesmas conversas?** As duas entradas da sidebar apresentam exatamente a mesma tela WhatsApp. Instagram apresenta conversas próprias.
3. **Existe duplicação de mensagens?** Não há duas gravações causadas pelas duas entradas de menu. O webhook WhatsApp deduplica `externo_id`. Entre canais, os registros são intencionalmente separados; não há evidência de espelhamento automático WA↔IG.
4. **Os dois possuem inbox?** A antiga entrada Conversas e o WhatsApp de aquisição possuem a mesma inbox. Instagram possui outra inbox real.
5. **Existem serviços diferentes?** Não entre as duas entradas WhatsApp; sim entre WhatsApp (`whatsapp.ts`, `wa-*`) e Instagram (`flow-business.ts`, Meta/Unipile/session/Evolution legado).
6. **Exclusivos do WhatsApp:** chips/instâncias, QR/pair, rotação, limites, campanhas de disparo, scripts e conexão Evolution GO.
7. **Exclusivos de Conversas:** na mesma rota WhatsApp, nenhum. Considerando a experiência Instagram, CRM card, atividades, notas, Realtime, tags, assignment e mudança de etapa.
8. **Existe integração real com Instagram Direct?** Sim, condicionada a conta/credenciais configuradas. Meta oficial e Unipile possuem envio/ingestão; session worker e Evolution legado também têm caminhos específicos.
9. **É possível uma interface única sem substituir motores?** Sim. A interface deve consumir adaptadores por canal e uma projeção normalizada, preservando tabelas, credenciais, idempotência e webhooks de cada motor.
10. **Qual arquitetura evita perda/regressão?** Uma camada de leitura/command gateway omnichannel sobre os motores atuais, com IDs canônicos e referências ao registro de origem. Fazer migração incremental, sem mover nem regravar históricos na primeira etapa.

---

## 7. Inventário de Automações

### 7.1 Receitas de prospecção

- UI: `src/components/automacao/AutomacaoSection.tsx`.
- Serviço: `src/services/automacao.ts`.
- Tabelas: `automacao_receitas`, `automacao_rodadas` (`035_automacao.sql`).
- Execução: `supabase/functions/automacao-rodar/index.ts`.
- Agenda: pg_cron em `036_automacao_cron.sql`.
- Comportamento: busca via Apify/cache, deduplicação, enriquecimento, score, criação/atualização de leads, campanha, redesign e rascunho de proposta. Para no portão de aprovação e possui tetos por rodada/mês.

É funcional, mas é automação de **prospecção programada**, não um orquestrador genérico de eventos comerciais.

### 7.2 Flow Builder Instagram/Meta

- UI: `src/components/instagram/flows/FlowBusinessFlowBuilder.tsx`.
- Tabelas: `instagram_flows`, `instagram_flow_nodes`, `instagram_flow_edges`, `instagram_flow_runs`.
- Execução: `supabase/functions/flow-business-webhook/index.ts`, função `executeFlows`.
- Gatilhos executados pelo webhook: `incoming_message` e `comment_keyword`.
- Ações executadas: `send_message`, tags, mudança CRM e criação de tarefa, conforme subtipo.

O schema admite mais gatilhos (`crm_stage`, `tag_added`, `manual`, story/referral), mas a existência no constraint não prova execução. A UI atual restringe o draft a `comment_keyword`; por isso, mensagem recebida é suportada pelo motor/backend, mas não configurável pela UI atual.

### 7.3 Session worker Instagram

- Schema: `supabase/migrations/098_instagram_session_connector.sql` e `099_instagram_session_automation.sql`.
- Função: `supabase/functions/flow-business-session/index.ts`.
- Recursos: eventos/jobs idempotentes, estados queued/processing/completed/failed/skipped/review, locks, tentativas, limites diários/mensais, intervalos de warm-up e bloqueio em erros de risco.
- Caso operacional claro: comentário com palavra-chave cria/atualiza lead, card, conversa, mensagem e job; finalização registra outbound e ações comerciais.

### 7.4 Matriz de eventos comerciais

| Evento desejado | Estado real | Observação |
|---|---|---|
| Novo lead | Parcial | receitas e comentários criam leads, mas não há barramento/gatilho genérico para todo novo lead |
| Mudança de status | Parcial/legado | pipeline antigo gradua chip ao marcar respondido; não há automação genérica |
| Nova oportunidade | Ausente | sem dispatcher comprovado |
| Mudança de etapa | Apenas schema/parcial | `crm_stage` é aceito no schema, mas não há configuração/executor genérico evidenciado |
| Nova mensagem recebida | Funcional no Meta | `flow-business-webhook` executa `incoming_message`; WhatsApp não dispara fluxos genéricos |
| Nova proposta | Ausente | follow-up de proposta é processo específico, não trigger genérico |
| Tarefa vencida | Ausente | tarefas existem, trigger não evidenciado |
| Campanha concluída | Ausente | sem evento de automação comprovado |
| Conversa encerrada | Ausente | WhatsApp não possui lifecycle; Instagram tem campos, mas não trigger operacional comprovado |
| Comentário com palavra-chave | Funcional | Meta/session worker, com controles e registros de execução |

Logs e erros são heterogêneos: `automacao_rodadas`, `instagram_flow_runs` e jobs session armazenam resultados; não existe observabilidade unificada. O session worker tem o modelo mais completo de retry/lock/limites. Receitas têm tetos de custo, mas o segredo usado pelo cron deve ser validado operacionalmente entre Vault e `CRON_SECRET`.

---

## 8. Leads versus Minhas Listas

| Aspecto | Leads | Minhas Listas |
|---|---|---|
| Tela roteada hoje | `LeadsPremiumView`, mock/local | `MinhasListasSection`, backend real |
| Registro principal | `leads` | `lead_lists` + `leads.list_id` |
| CRUD funcional | Existe em `src/lib/leads-api.ts`, mas não está ligado à tela premium atual | Listar, renomear, excluir e abrir leads são funcionais |
| Duplicação | A tela premium replica visualmente um gestor sem usar o serviço real | Estatísticas derivadas dos mesmos leads, não cópia de lead |
| Relação CRM | Leads são entidade comercial base | Lista segmenta leads; não é entidade CRM independente |
| Campanhas | Leads são associados a campanhas por estruturas específicas | Lista serve como agrupamento/origem, sem substituir campanha |
| Permissões | `pode_ver_lead(org_id, assigned_to)` pode restringir vendedor/SDR | metadados de lista são mais amplos por organização |

Conclusão: incorporar Minhas Listas como subvisão/filtro salvo dentro de Leads é desejável na UX, mas não deve ocorrer antes de corrigir a tela de Leads e decidir a semântica de ownership. A FK direta significa uma lista por lead; a cascata de delete pode apagar leads. Para listas reutilizáveis/múltiplas, seria necessário um junction model e uma migração futura — fora deste escopo.

---

## 9. Problemas identificados no Pipeline

O dashboard renderiza `src/components/pipeline-premium/PipelinePremiumView.tsx`, alimentado por `MOCK_OPPORTUNITIES`.

| Recurso | Estado na tela atual |
|---|---|
| Clique no card | Funcional apenas localmente; abre seleção/drawer |
| Drawer | Abre, mas não persiste mudanças |
| Edição | Botão/toast; sem backend |
| Histórico | Aba visual; conteúdo não muda por aba |
| Próximas ações/tarefas | Visual/ausente |
| Contatos | Visual; `tel:`/`mailto:` podem usar fallbacks fictícios |
| Propostas | Aba visual; sem relação carregada |
| Conversas | Ausente |
| Alteração de etapa | Ausente |
| Persistência | Ausente |
| Drag and drop | Ausente; board/column não têm handlers drag/drop |
| Loading/erro | Ausente para dados, pois tudo é mock |
| Filtros | Busca/canal/etapa/tag locais; responsável é armazenado mas não filtra |

Em paralelo, `src/components/leads/PipelineSection.tsx` possui carregamento real, drag and drop HTML5, update otimista com rollback, diálogo de perda, detalhes e integração com graduação de chip. Ele é importado em `dashboard.tsx`, mas não renderizado. `LeadsManager` tem situação análoga. Esses imports sem uso e as duas implementações concorrentes são evidência de substituição visual sem migração funcional concluída.

---

## 10–13. Duplicações, exclusividades, integrações e interfaces sem backend

### Duplicações relevantes

1. Duas entradas de sidebar para a mesma seção WhatsApp (corrigida na hierarquia, preservando o atalho de aquisição exigido).
2. Pipeline premium mock versus `PipelineSection` funcional.
3. Leads premium mock versus `LeadsManager`/`leads-api` funcionais.
4. Conceitos de conversa separados entre `wa_mensagens` e `ig_conversas`/`ig_mensagens`; não são duplicação de dados, mas duplicam apresentação e contratos.
5. Três motores de automação com modelos de execução/log diferentes.

### Recursos exclusivos

- WhatsApp: instâncias/chips, QR, rotação, limites de disparo, campanhas e scripts.
- Instagram: provider/account, Realtime, CRM card, atividades, notas, tags, responsável, etapa e Flow Builder.
- Receitas: prospecção/qualificação/redesign/proposta com tetos financeiros e aprovação.
- Session worker: jobs idempotentes, locks, retries, warm-up e revisão de risco.

### Integrações reais disponíveis

- Evolution GO para WhatsApp.
- Meta oficial, Unipile, session worker e caminho Evolution legado para Instagram.
- Supabase Auth/RLS/Realtime/RPC/Edge Functions.
- Apify para prospecção; AISA e Google Maps permanecem independentes e não foram alterados.
- CRM Instagram, leads, campanhas, propostas e chips possuem integrações reais, embora fragmentadas.

### Recursos sem backend funcional na interface atual

- Leads Premium: importação, exportação, novo lead, filtros avançados e dados exibidos.
- Pipeline Premium: criação/edição, mover etapa, drag/drop, responsável, abas de atividades/propostas/histórico, vínculos com conversas.
- Instagram Inbox: anexos, emoji, enviar proposta, agendar reunião, compartilhar material e assistente IA.
- WhatsApp Inbox: fila, transferência, atribuição, encerramento, tags e lifecycle completo de entrega.

---

## 14. Riscos de unificação

1. **Tenant incompatível:** `user_id` em WhatsApp versus `org_id` no CRM Instagram.
2. **Semântica divergente:** thread por número no WhatsApp versus conversa persistida/conta/provider no Instagram.
3. **Idempotência:** cada webhook possui chave e regra próprias; copiar mensagens para uma tabela nova pode duplicar eventos.
4. **Capacidades de canal:** janela Meta, private reply, QR/session e limites WhatsApp não são intercambiáveis.
5. **Permissões:** visibilidade de leads por responsável pode divergir da inbox/lista da organização.
6. **Histórico:** backfill destrutivo ou troca simultânea de writers cria lacunas/duplicatas.
7. **Mocks em rotas comerciais:** uma central nova baseada nas telas premium herdaria entidades não persistidas.
8. **Ações não idempotentes:** reenvio, movimentação de etapa e criação de tarefa exigem command IDs e audit log.

---

## 15. Arquitetura recomendada — Central Omnichannel

Priorizar unificação da experiência, não dos motores:

```text
Central Omnichannel (UI)
  ├─ consulta normalizada de threads/mensagens/contatos
  ├─ contexto comercial: lead, oportunidade, tarefas, propostas
  └─ comandos por capacidade
       ├─ WhatsAppAdapter → serviços/tabelas/webhooks WA existentes
       └─ InstagramAdapter → Meta/Unipile/session/Evolution existentes
```

### Contrato normalizado sugerido

- `ConversationRef`: `channel`, `provider`, `sourceConversationId`, `orgId`, `contactRef`, `assignedTo`, `status`, `unreadCount`.
- `MessageRef`: `sourceMessageId`, `direction`, `kind`, `text/media`, `deliveryStatus`, `occurredAt`.
- `ChannelCapabilities`: enviar texto/mídia, template/private reply, marcar lida, atribuir, encerrar.
- `CommercialContext`: lead, oportunidade, etapa, tarefas, propostas e atividades por referências, sem duplicar conteúdo.

Inicialmente, uma read model/view ou BFF consulta as fontes atuais e os commands delegam ao adapter correto. Não mover dados nem trocar writers. Depois de observar idempotência e tenant scope, considerar uma projeção assíncrona para busca global, sempre mantendo `source_*` e audit trail.

---

## 16. Melhorias prioritárias

### P0 — corrigir verdade funcional

1. Reconectar as telas premium Leads e Pipeline aos serviços reais ou voltar temporariamente aos componentes funcionais, preservando o visual aprovado.
2. Eliminar imports mortos somente depois de escolher a implementação canônica.
3. Definir e testar ownership `org_id`/`user_id` do WhatsApp para times.
4. Adicionar testes de contrato que falhem quando telas comerciais usarem mocks em produção.

### P1 — atendimento confiável

5. Criar o contrato omnichannel e adapters sem alterar os motores.
6. Adicionar assignment, status, encerramento, tags e fila à read model/UI.
7. Modelar mídia e status de entrega por capacidade do canal.
8. Integrar scripts WhatsApp ao composer e substituir catches silenciosos por feedback/telemetria.

### P2 — automação e produtividade

9. Criar catálogo único de eventos comerciais com outbox/idempotência.
10. Expor no builder somente triggers realmente executáveis; mostrar disponibilidade por canal/plano.
11. Unificar visualização de runs/jobs/logs, sem unificar os executores.
12. Incorporar Listas em Leads apenas após decidir lista única versus múltiplos segmentos.

---

## 17. Telas, modais e drawers complementares

1. **Central de Conversas:** filtros canal, não lidas, responsável, status e SLA; lista, thread e painel comercial em três colunas.
2. **Drawer de contato/lead:** dados, oportunidades, estágio, últimas atividades, tarefas e propostas.
3. **Modal de atribuição/transferência:** responsável, equipe, motivo e audit trail.
4. **Modal de encerramento:** motivo, resultado e próxima ação.
5. **Composer por capacidades:** scripts/respostas rápidas, mídia quando suportada, avisos de janela/template.
6. **Drawer de oportunidade:** edição persistida, timeline, tarefas, propostas e conversas relacionadas.
7. **Modal Nova oportunidade:** parte do lead existente para evitar redigitação.
8. **Central de Automações:** receitas, flows e session jobs apresentados por tipo, com status/logs e sem fingir compatibilidade entre motores.
9. **Leads > Listas:** subvisão com contagem/ownership e aviso explícito sobre exclusão enquanto o modelo atual persistir.

Fluxo alvo: busca global do lead → histórico → criar/abrir oportunidade → mover etapa → abrir conversa já vinculada → registrar atividade/tarefa → selecionar automação compatível → gerar e autorizar proposta → acompanhar negociação. O contexto viaja por IDs, não por cópia de formulário.

---

## 18. Sequência recomendada de implementação

1. Congelar contrato de entidades e ownership; documentar `org_id`, `user_id`, `assigned_to` e permissões.
2. Recuperar persistência real em Leads/Pipeline e cobrir ações críticas com testes.
3. Introduzir IDs/referências canônicas e `ChannelCapabilities`, sem mudança de dados.
4. Construir endpoint/read model agregado somente de leitura para WA + IG.
5. Entregar Central Omnichannel em modo leitura e comparar contagens/históricos com telas atuais.
6. Habilitar envio por adapters, um canal por vez, com idempotency key e audit log.
7. Adicionar assignment/status/fila/encerramento e integrar contexto CRM.
8. Integrar tarefas/propostas autorizadas; manter portões de aprovação.
9. Criar catálogo/outbox de eventos comerciais e ligar automações incrementalmente.
10. Incorporar Minhas Listas à UX de Leads após decisão de domínio/migração.
11. Desativar interfaces legadas somente após paridade observada, reconciliação e plano de rollback.

---

## Matriz obrigatória consolidada

| Recurso | Módulo atual | Estado real | Evidência técnica | Duplicação | Recomendação | Prioridade |
|---|---|---|---|---|---|---|
| Gestão na sidebar | Home Premium | Funcional | `DashboardSidebar.tsx`, `MANAGEMENT_SUBITEMS` | Entradas principais antigas removidas | Manter contrato de ordem em teste | Concluído |
| Inbox WhatsApp | WhatsApp/Conversas | Funcional parcial | `WaConversas.tsx`; `listarConversas`; `wa_mensagens` | Duas entradas abriam a mesma seção | Uma entrada comercial + atalho de canal preservado | P1 |
| Receber WhatsApp | WhatsApp | Funcional para texto 1:1 | `wa-webhook/index.ts`; unique `(user_id, externo_id)` | Não | Expandir mídia/status com compatibilidade | P1 |
| Enviar WhatsApp | WhatsApp | Funcional parcial | `wa-responder/index.ts`; `/send/text` | Não | Validar persistência outbound e idempotência | P1 |
| Instâncias/QR | WhatsApp | Funcional | `wa-chips`, `_shared/wa.ts`, `wa_instancias` | Não | Preservar Evolution GO via adapter | P0 |
| Campanhas WA | WhatsApp | Funcional | `WaCampanhas.tsx`; `send-proposal-wa`; `wa_envios` | Parcial com Campanhas geral | Manter motor, expor contexto na central | P2 |
| Scripts WA | WhatsApp | Funcional isolado | `WaScripts.tsx`; `wa_scripts` | Não | Integrar ao composer | P1 |
| Inbox Instagram | Instagram | Funcional | `InstagramInbox.tsx`; `ig_conversas`; `ig_mensagens` | Segunda UI de conversa | Consumir por adapter | P1 |
| Instagram Direct | Instagram | Funcional condicionado a conexão | `sendInstagramConversationMessage`; funções Meta/Unipile/ig-send | Vários providers intencionais | Capability routing por provider | P0 |
| CRM na conversa | Instagram | Funcional parcial | cards, activities, notes, move stage em `flow-business.ts` | Ausente no WA | Painel comercial comum por referência | P1 |
| Anexos | WA/IG | Parcial/ausente | `media_url` no schema; controles IG desabilitados; webhook WA ignora mídia | Não | Implementar por capability | P2 |
| Fila/transferência | Atendimento | Ausente | sem tabela/command de agent queue nas inboxes | Não | Modelo de assignment e audit trail | P1 |
| Receitas de automação | Automações | Funcional | `AutomacaoSection.tsx`; `automacao-rodar`; `automacao_receitas/rodadas` | Conceito sobreposto a flows | Preservar como tipo “prospecção” | P1 |
| Flow incoming message | Instagram/Meta | Backend funcional, UI não expõe | `flow-business-webhook:executeFlows`; `instagram_flow_runs` | Não | Expor após teste de produto/permissão | P2 |
| Flow comment keyword | Instagram | Funcional | Flow Builder; `executeFlows`; session jobs | Dois motores por provider | Mesmo conceito UX, adapters separados | P1 |
| Outros triggers do schema | Instagram | Apenas schema | constraint em migration 095, sem dispatcher comprovado | Não | Não anunciar até executor/testes | P2 |
| Novo lead genérico | Automações | Parcial | criação em receitas/comentários, sem event bus | Não | Outbox de domínio | P2 |
| Leads Premium | Gestão > Leads | Apenas interface | `LeadsPremiumView.tsx`; `MOCK_LEADS` | `LeadsManager` real existe | Ligar visual premium ao backend real | P0 |
| Minhas Listas | Gestão > Listas | Funcional | `MinhasListasSection`; `lists-api.ts`; `lead_lists` | Usa os mesmos leads | Incorporar como subvisão após revisar domínio | P1 |
| Relação lead/lista | Leads/Listas | Funcional, restritiva | `leads.list_id`; FK cascade | Não | Não tratar como tag/muitos-para-muitos | P0 |
| Pipeline Premium | Gestão > Pipeline | Apenas interface | `PipelinePremiumView.tsx`; mocks; sem handlers DnD | `PipelineSection` real existe | Reconectar backend preservando layout | P0 |
| Pipeline antigo | Código não roteado | Funcional, possivelmente morto na rota | `PipelineSection.tsx`; único import sem render | Duplica premium | Usar como fonte de comportamento e consolidar | P0 |
| Drawer do Pipeline | Pipeline Premium | Parcial visual | estado local; tabs sem conteúdo condicional | Não | Persistência + timeline integrada | P0 |
| Propostas na jornada | Propostas/Pipeline | Fragmentada | services de propostas e abas visuais premium | Não | Command autorizado a partir da oportunidade | P1 |
| Observabilidade de automações | Três motores | Parcial | `automacao_rodadas`, `instagram_flow_runs`, session jobs | Três formatos | Visão unificada, storage preservado | P2 |
| Multi-tenant WA | WhatsApp | Risco arquitetural | queries por `user_id` versus CRM `org_id` | Não | Auditoria de permissão com matriz de papéis | P0 |

---

## Achados arquiteturais adicionais

### Código morto ou possivelmente morto

- Alta confiança na rota atual: imports de `PipelineSection` e `LeadsManager` em `dashboard.tsx` não são usados no JSX; busca no `src` encontrou apenas o import e a declaração de cada componente.
- Não se recomenda deletar agora: ambos contêm comportamento real que deve orientar a reconexão das telas premium.

### Acoplamento e smells

- `InstagramInbox.tsx`, `DashboardSidebar.tsx`, componentes WhatsApp e funções de automação concentram UI, orquestração e regras em arquivos grandes.
- Há acesso direto ao Supabase em componentes, em paralelo a services, produzindo fronteiras inconsistentes.
- O mesmo domínio comercial alterna `user_id`, `org_id`, `assigned_to` e joins implícitos, aumentando risco de confusão de identidade/tenant.
- Foram encontrados usos de `any` sobretudo em fronteiras externas/Edge Functions e diversas coerções `as unknown as` em services. Não há `@ts-ignore`; há dois `@ts-expect-error` no wrapper do PostHog.
- Há catches vazios na inbox WhatsApp, intervalos fixos de polling e falhas de persistência que não são sempre promovidas ao usuário/telemetria.

### Estimativa de consolidação

Não é seguro estimar linhas removíveis antes de escolher qual implementação de Leads/Pipeline será canônica. A redução principal virá depois da paridade funcional: retirar mocks, imports/componentes abandonados e adapters duplicados de apresentação — sem apagar motores de canal.

## Decisão recomendada

Não fundir tabelas, webhooks ou provedores agora. Primeiro restaurar a verdade funcional de Leads/Pipeline e corrigir ownership multi-tenant; depois construir uma Central Omnichannel por adapters e projeção de leitura. Essa ordem reduz o risco de a nova central nascer conectada a dados mockados ou permissões incompatíveis.
