# Flow Leads — regras do projeto

App de prospecção (TanStack Start + Supabase + Vercel). Este arquivo é lido pelo
agente em toda sessão. As regras abaixo NÃO são sugestões.

## 🔴 REGRA 1 — Dinheiro e APIs externas: só com autorização EXPLÍCITA

**NUNCA ligar API externa, iniciar coleta real ou incorrer em gasto ($) sem
autorização explícita do dono PARA AQUELA AÇÃO ESPECÍFICA.**

- "Achei boa ideia", "veio de tarefa anterior", "não quis reverter" **não são
  autorização**. Ir além do escopo quando envolve dinheiro/API é **risco não
  autorizado**, não iniciativa bem-vinda.
- Se o agente concluir que vale ligar algo: **PARAR, propor e esperar o "sim".**
- Vale mesmo quando o resultado provável é bom. **A decisão de gastar é do dono.**
- Retroativo: o commit `9c6a33c` ligou coleta real em 5 estratégias sem
  autorização. O dono optou por **manter** (tem teto de gasto), mas isso foi
  **exceção, não precedente** — não valida o padrão.

Estado autorizado hoje (mantido pelo dono):
- Coleta em redes LIGADA só nas estratégias **IG-5, IG-7, IG-8, IG-9 e LI-4**
  (Edge `buscar-redes`), sempre sob o teto de **US$ 5/busca e US$ 50/mês**
  (`src/lib/redes-teto.ts` + livro-caixa `redes_buscas`). As outras 15
  estratégias ficam "Em breve" até ordem do dono.
- Fontes gratuitas do Maps (OSM/Geoapify) não geram gasto; o provider
  `apify` do Maps é PAGO — mesma regra: só rodar quando o dono mandar.

## Outras normas já estabelecidas

- **Honestidade de UI**: nada pode parecer que funciona sem funcionar. O que
  depende de API não ligada fica "Em breve", desabilitado e se explicando.
- **Prova é em PRODUÇÃO** (flow-leads-dusky.vercel.app), não em localhost.
  O alias dusky não segue deploys sozinho: `vercel alias set` após deploy.
- **Banco de produção limpo**: não criar usuários de teste; dados de teste
  temporários sempre com cleanup verificado; não apagar dados reais do dono
  sem perguntar.
- **Execução**: seguir a skill `flow-loop` (critério de pronto objetivo,
  teto de 5 iterações, proibido fraudar verde, commit por etapa + push).
