# CEO de IA — implantação controlada (Prompt 29)

Estado em 2026-10-27: **tudo preparado, nada aplicado em produção**. Este documento é o checklist para
pedir a autorização de implantação. Nenhum passo abaixo foi executado.

## O que existe no repositório

| Camada | Arquivos |
|---|---|
| Banco (não aplicado) | `supabase/migrations/202610270001_agent_foundation.sql`, `202610270002_agent_ceo_config.sql` |
| Verificação de leitura | `supabase/ops/verificar_fundacao_agentes.sql` |
| Edge (não publicada) | `supabase/functions/agent-ceo/` (+ entrada em `config.toml`, `verify_jwt = true`) |
| Runtime | `supabase/functions/_shared/agent-runtime.ts`, `agent-tools.ts`, `agent-ceo-turn.ts` |
| Tela 02 | `CeoRealStatusCard` + `CeoConfigWizard` (botão "Montar minha equipe com CEO de IA") |
| Tela 03 | `CeoRealConfigPanel` (só no perfil do CEO) |
| Tela 10 | `CeoCopilotoBanner` + entrada bloqueada se o CEO não estiver ativo |

## Pré-requisitos (nenhum feito ainda)

1. Rodar `supabase/ops/verificar_fundacao_agentes.sql` no SQL Editor e conferir: dependências "ok", objetos
   `agent_*` "livres", e o bloco 5 sem as versões 202610270001/2.
2. Backup/snapshot do projeto `lyitsavnqwtsoouhcjie` (ou confirmar o PITR).
3. `ANTHROPIC_API_KEY` disponível (cofre `config_chaves` ou secret da Edge). Nenhum teste pago foi feito.

## Ordem de implantação (cada passo exige autorização explícita)

1. **Banco**: aplicar as duas migrations, nesta ordem, pelo SQL Editor (arquivo por arquivo). Nunca `db push`.
   Conferir depois: `select count(*) from public.agent_tools;` (1 linha) e as policies com
   `select tablename, policyname from pg_policies where tablename like 'agent%';`.
2. **Tipos**: regenerar `src/integrations/supabase/types.ts` (`scripts/gen-types.mjs`) em commit separado.
3. **Edge**: `agent-ceo` com `scripts/deploy-edge.mjs` (só esta função).
4. **Prova com ambiente desligado**: na Tela 02 o estado deve sair de "Serviço indisponível" para "Não configurado".
5. **Configurar** o CEO pela Tela 02 (assistente) e **salvar sem ativar**. Estado esperado: "Configurado".
6. **Front**: definir `VITE_CEO_IA_REAL=true` no ambiente de produção e fazer o deploy + `vercel alias set`.
7. **Ativar** o CEO (botão Ativar do assistente ou da faixa de estado). Estado esperado: "Ativo".
8. **Teste manual único** no Copiloto: "Faça um resumo comercial da nossa operação." Conferir resposta com os
   números reais, uma linha em `agent_runs` e passos em `agent_run_steps`, custo < US$ 0,01.
9. **Teste de kill-switch**: ligar na faixa de estado → Copiloto bloqueia; retomar → volta.

## Reversão

- Desligar rápido: botão Kill-switch (Tela 02/03) ou `select public.agent_kill_switch('<org>', true);` com sessão de admin.
- Tirar o Copiloto real do ar: remover `VITE_CEO_IA_REAL` e redeployar (a tela volta à demonstração).
- Remover a Edge: `scripts/delete-edge.mjs agent-ceo`.
- Não há dado de negócio para desfazer: as migrations só criam objetos `agent_*`.

## O que NÃO foi feito

Nenhuma migration aplicada, Edge publicada, flag ligada, cron criado, chamada paga ou verificação no banco de
produção (sem credenciais de leitura nesta sessão e `.env` fora de escopo).
