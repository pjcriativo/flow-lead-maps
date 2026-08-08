-- Fix: permissão de execução das funções de identidade de lead para o role authenticated.
-- A migration 071_org_lead_deduplication.sql revogou ALL das funções para anon/authenticated,
-- mas a edge search-leads chama lead_business_identity via client do usuário (role authenticated)
-- dentro do loadSeenLeadIdentitiesForOrg (SELECT via RPC). Sem EXECUTE, o upsert de leads
-- falha com "permission denied for function" e 0 leads são inseridos em todas as buscas.
-- O trigger registrar_lead_inedito_da_org usa SECURITY DEFINER e não é afetado, mas
-- chamadas diretas (RPC, índice funcional via query do usuário) precisam de EXECUTE.

grant execute on function public.normalize_lead_identity_part(text) to authenticated, anon;
grant execute on function public.lead_business_identity(text, text) to authenticated, anon;
