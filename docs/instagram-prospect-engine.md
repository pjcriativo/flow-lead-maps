# Instagram Prospect Engine — arquitetura e plano de execução

## Visão do produto

O módulo Instagram não deve ser uma cópia da busca do Maps. Ele opera sobre sinais sociais públicos e transforma descoberta em uma sequência rastreável:

```text
origem → conteúdo → interação → perfil → evidência → score → lead → campanha
```

O lead só entra no CRM quando existe uma razão explícita. A interface deve sempre responder: onde foi encontrado, o que demonstrou, por que foi aprovado e quanto custou.

## Princípios

1. Coletar barato e enriquecer seletivamente.
2. Nunca tratar todo resultado da fonte como lead.
3. Manter a evidência original ligada ao perfil.
4. Separar intenção, aderência, atividade e autenticidade no score.
5. Usar cache com validade compatível com cada dado.
6. Impor teto antes de cada Actor e registrar custo real depois.
7. Não depender de um único Actor para todas as tarefas.
8. Direct automatizado fica por último e depende das regras/API oficial da Meta.

## Camadas de dados

- `instagram_sources`: perfis, posts, hashtags, locais, menções e concorrentes monitorados.
- `instagram_discovery_jobs`: uma execução auditável, com pedido, status, custo e resultado.
- `instagram_job_steps`: cada Actor executado dentro do trabalho.
- `instagram_contents`: posts, Reels e carrosséis que originaram os sinais.
- `instagram_engagement_events`: comentários, respostas e menções.
- `instagram_profile_evidence`: prova que explica a decisão de cada candidato.
- `instagram_profiles`: snapshot enriquecido apenas dos perfis ligados ao CRM.
- `leads`: entidade comercial final, compartilhada pelo restante do Flow Leads.

## Motor multifuente

Cada fonte implementa o mesmo contrato:

```ts
type DiscoveryAdapter = {
  discover(input): Promise<ContentOrProfile[]>;
  normalize(raw): NormalizedSignal[];
  estimate(input): CostEstimate;
  cacheTtlHours: number;
};
```

O orquestrador escolhe o adapter, registra o job e executa etapas pequenas. Isso permite trocar um Actor sem alterar CRM, score ou interface.

## Fase 1 — Comments Hunter (implementada)

Fontes:

- perfil concorrente/referência → últimos posts;
- URLs específicas de posts ou Reels.

Pipeline:

1. `instagram-post-scraper` descobre posts quando a origem é um perfil.
2. `instagram-comment-scraper` coleta comentários públicos.
3. Classificador local remove spam e pontua compra, dúvida, interesse, elogio e comentário genérico.
4. Autores são deduplicados pela melhor evidência.
5. `instagram-profile-scraper` enriquece somente os autores acima da intenção mínima.
6. Score combina intenção, conta profissional, nicho, cidade, atividade, contato e audiência.
7. O CRM recebe apenas perfis aprovados; candidatos e rejeitados continuam auditáveis.

Controles:

- 1–8 posts;
- 5–100 comentários por post;
- meta de 1–50 leads;
- intenção e score mínimos;
- somente profissionais;
- exigir nicho e cidade;
- cache de 6 horas para comentários, 12 horas para posts e 7 dias para perfis;
- teto de custo por trabalho e mês.

## Fase 2 — Hashtags, locais e conteúdo

### Hashtag Hunter

- descobrir posts/Reels por hashtag de nicho e cidade;
- extrair autores e métricas do conteúdo;
- eliminar agregadores, reposts e perfis sem aderência;
- combinar hashtags do nicho, intenção e localização.

### Places Hunter

- pesquisar locais comerciais e páginas de localização;
- coletar conteúdo publicado no local;
- distinguir negócio, criador e consumidor;
- confirmar cidade por evidência do post ou do perfil.

### Content Signals

- frequência de postagem;
- média e mediana de curtidas/comentários;
- taxa de engajamento robusta, sem depender só da média;
- recência, consistência e formatos usados;
- menções, coautores, hashtags e chamadas comerciais na legenda.

## Fase 3 — Inteligência de concorrentes

- lista de concorrentes monitorados;
- novos posts e Reels;
- comentaristas recorrentes;
- dúvidas e objeções mais frequentes;
- perfis relacionados;
- hashtags e locais usados;
- comparação de frequência e engajamento;
- alertas de oportunidade por palavras de compra.

O sistema deve mostrar tendência ao longo do tempo. Snapshot sem histórico não mede crescimento.

## Fase 4 — Score Instagram v2

Quatro scores independentes:

- `intent_score`: força do sinal de compra/interesse;
- `fit_score`: nicho, região, porte e tipo de conta;
- `activity_score`: recência e consistência de conteúdo;
- `authenticity_score`: sinais básicos de perfil real e audiência plausível.

O score final é configurável por estratégia. Comments Hunter dá mais peso à intenção; descoberta por perfil dá mais peso ao fit.

## Fase 5 — Dashboard profissional

- funil por fonte: coletado → único → enriquecido → qualificado → novo;
- custo por lead novo e por lead qualificado;
- conversão por fonte, nicho, cidade e concorrente;
- distribuição de seguidores e engajamento;
- sinais de intenção mais frequentes;
- ranking de origens;
- evolução semanal da base;
- qualidade dos dados e causas de rejeição;
- lista paginada e visão completa do perfil.

## Fase 6 — Sinais avançados

- menções e posts marcados;
- perfis relacionados e expansão de um nível;
- Reels com visualizações, compartilhamentos e temas;
- anunciantes públicos via Biblioteca de Anúncios;
- monitoramento agendado com orçamento diário;
- listas de usernames/URLs importadas;
- webhooks e exportações.

Seguidores/seguindo completos devem ficar atrás de feature flag: volume, estabilidade e risco operacional variam muito por Actor.

## Fase 7 — Prospecção e Direct

Ordem recomendada:

1. fila assistida com mensagem personalizada e abertura do perfil;
2. registro manual de enviado, resposta e interesse;
3. inbox oficial para conversas iniciadas pelo lead;
4. automações somente dentro das permissões e janelas oficiais da Meta.

Cold DM automatizado por sessão não oficial não deve ser o fundamento do produto.

## Métricas de sucesso

- precisão dos 20 primeiros resultados;
- leads novos por 100 comentários;
- custo por lead qualificado;
- percentual de resultados com evidência;
- taxa de duplicidade;
- rejeições por motivo;
- taxa de abertura manual do perfil;
- resposta e conversão por sinal de origem.

## Próximo incremento recomendado

Implementar Hashtag Hunter e Places Hunter usando as mesmas tabelas e o mesmo score, depois consolidar o dashboard multifuente. Isso aumenta cobertura sem duplicar a infraestrutura já entregue pelo Comments Hunter.
