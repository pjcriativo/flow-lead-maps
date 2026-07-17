-- Hardening do contato manual (achados do review):
-- (1) RPC ATÔMICA: insere o contato E atualiza o lead na MESMA transação — sem o risco de
--     gravar histórico e não mover o status (ou duplicar em retry). Também LIMPA os campos de
--     perda quando o lead é reengajado (sai de lost/nurture), mantendo o painel de aprendizado
--     verdadeiro; e NÃO regride um lead já adiantado (proposta_enviada+). security invoker → RLS
--     do chamador vale para as duas tabelas.
-- (2) Policy de lead_contatos passa a exigir que o lead_id seja DO PRÓPRIO dono (não só o
--     user_id), fechando a brecha de inserir contato apontando p/ lead de outra org.

create or replace function public.registrar_contato_manual(
  p_lead_id uuid,
  p_canal text,
  p_anotacao text,
  p_contatado_em timestamptz
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
  v_novo text;
  v_quando timestamptz := coalesce(p_contatado_em, now());
begin
  select status into v_status from public.leads where id = p_lead_id;
  if v_status is null then
    raise exception 'lead não encontrado ou sem permissão';
  end if;

  insert into public.lead_contatos (lead_id, canal, anotacao, contatado_em)
  values (p_lead_id, p_canal, nullif(btrim(coalesce(p_anotacao, '')), ''), v_quando);

  -- move p/ "contacted" sem regredir quem já passou disso
  v_novo := case
    when v_status in ('proposta_enviada', 'responded', 'meeting', 'won') then v_status
    else 'contacted'
  end;

  update public.leads set
    status = v_novo,
    last_contacted_at = v_quando,
    -- reengajou (saiu de lost/nurture) → zera o motivo de perda p/ o painel não mentir
    motivo_perda = case when v_novo in ('lost', 'nurture') then motivo_perda else null end,
    motivo_perda_nota = case when v_novo in ('lost', 'nurture') then motivo_perda_nota else null end,
    perda_em = case when v_novo in ('lost', 'nurture') then perda_em else null end,
    updated_at = now()
  where id = p_lead_id;

  return v_novo;
end;
$$;

-- Policy mais estrita: além de user_id = auth.uid(), o lead_id tem que ser do próprio dono.
drop policy if exists "Users manage own lead_contatos" on public.lead_contatos;
create policy "Users manage own lead_contatos" on public.lead_contatos
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.leads l
      where l.id = lead_contatos.lead_id and l.user_id = auth.uid()
    )
  );
