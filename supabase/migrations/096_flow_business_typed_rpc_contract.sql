-- Contrato RPC amigavel ao gerador TypeScript: IDs opcionais chegam como texto vazio.
create or replace function public.flow_business_save_flow_draft(
  p_flow_id text,
  p_name text,
  p_description text,
  p_account_id text,
  p_trigger_type text,
  p_trigger_config jsonb,
  p_nodes jsonb
) returns uuid
language sql
security invoker
set search_path = public
as $$
  select public.flow_business_save_flow(
    nullif(trim(p_flow_id), '')::uuid,
    p_name,
    p_description,
    nullif(trim(p_account_id), '')::uuid,
    p_trigger_type,
    p_trigger_config,
    p_nodes
  )
$$;

grant execute on function public.flow_business_save_flow_draft(
  text, text, text, text, text, jsonb, jsonb
) to authenticated, service_role;
