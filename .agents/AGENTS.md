# Directivas e Regras do Projeto Flow Leads

## 1. Regra de Ouro do Multi-Tenant (Orgs & Memberships)
- **Sempre que alterar ou criar o trigger de novos usuários (`handle_new_user`)**, GARANTA que o novo usuário receba:
  1. Linha em `public.profiles`
  2. Linha em `public.orgs` (`dono_user_id = new.id`)
  3. Linha em `public.memberships` (`org_id`, `user_id = new.id`, `papel = 'admin'`)
- **Motivo**: As regras de RLS (`pode_ver_lead`, etc.) utilizam `pertence_a_org(org_id)`. Se um usuário não tiver Org/Membership, os dados criados (leads, buscas) ficam com `org_id NULL` e são filtrados pela RLS, resultando em 0 itens na interface.

## 2. Execuções do Supabase 100% via CLI
- **NUNCA peça ao usuário para rodar comandos ou SQLs manualmente no painel do Supabase.**
- Use sempre os utilitários de CLI do repositório:
  - Para rodar migrações/SQL: `node scripts/sql.mjs -f supabase/migrations/<arquivo.sql>` ou `node scripts/sql.mjs "<SQL>"`
  - Para fazer deploy de Edge Functions: `node scripts/deploy-edge.mjs <slug>`

## 3. Verificação Rigorosa Sem Falso Positivo
- Antes de declarar que um bug no banco/RLS foi corrigido, execute consultas empíricas diretamente no PostgreSQL com `node scripts/sql.mjs` e rode a suíte de testes (`node scripts/prova-papeis.mjs`, `node scripts/test-approval-flow.mjs`).
- Verifique que os contadores de registros orfãos (`org_id IS NULL`, `profiles_without_org`) são estritamente 0.
