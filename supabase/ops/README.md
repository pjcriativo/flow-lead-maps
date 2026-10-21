# Operações manuais do WhatsApp Premium

Arquivos desta pasta **não são migrations**: nunca rodam com `supabase db push`. Cada um é
aplicado à mão no SQL Editor da Supabase, por decisão do dono, e todos são idempotentes.

| Arquivo | Estado em 2026-10-21 | Quando aplicar |
|---|---|---|
| `wa_health_monitor_cron.sql` | **Aplicado** (job `wa-health-monitor`, a cada 2 min) | Já ativo. Só lê o provedor e reaplica webhook perdido. |
| `wa_send_worker_cron.sql` | Não aplicado | Depois da homologação do envio de campanhas. |
| `wa_automation_runner_cron.sql` | Não aplicado | Depois da homologação das automações. |

Conferir os jobs: `select jobname, schedule, active from cron.job where jobname like 'wa-%';`
Desligar um job: `select cron.unschedule('<jobname>');`

## Ligar a execução de automações (homologação)

A chave da plataforma está travada por CHECK
(`wa_automation_platform_controls.automation_execution_enabled = false`). Para homologar será
preciso, nesta ordem: uma migration que remova esse CHECK, ligar a chave da plataforma, ligar
`wa_automation_org_settings.engine_enabled` só na organização de teste e aplicar
`wa_automation_runner_cron.sql`. Nenhuma ação de automação envia WhatsApp.

## Instância órfã na Evolution GO

`org-f8cdb11b-5dfd` existe no servidor da Evolution (desconectada) e a linha local foi
arquivada em 2026-10-20. Pertence a **outra organização** (prefixo `f8cdb11b`), então não foi
excluída automaticamente. Antes de remover, confirme com o dono dessa organização que o número
não é mais usado. A remoção é pelo Manager da Evolution ou por
`DELETE /instance/delete/{id}` com a chave global; nenhum dado do Supabase precisa mudar.

## Credenciais a trocar

Expostas em conversa em 2026-10-21. Trocar nesta ordem, sem gravar valores em código:

1. **Chave global da Evolution GO** (`EVOLUTION_API_KEY`): gerar nova no servidor (Coolify →
   variável de ambiente da Evolution → reiniciar) e atualizar no cofre do Flow Leads
   (Super Admin → Configurações → chaves, `config_chaves`) e no secret das Edges
   (`supabase secrets set EVOLUTION_API_KEY=...`). Os tokens por instância não mudam.
2. **Senha do Coolify**: trocar no painel e, de preferência, publicar o painel atrás de HTTPS.

## Migrations fora do histórico

O histórico foi conciliado em 2026-10-21 (`supabase migration repair --status applied`) só para
as 109 versões com objetos comprovados no banco. Continuam **fora do histórico** e por isso
`supabase db push` ainda **não** é seguro:

- `110_google_maps_p0_security` — **não está aplicada** (funções `google_maps_plan_usage` e
  `google_maps_search_history` não existem; o módulo Google Maps as consome).
- `002, 022, 029, 040, 064, 065, 066, 072, 088, 090, 101, 106` — só alteram dados, constraints
  ou grants; não há objeto nomeado para comprovar a aplicação. Precisam de conferência manual.
