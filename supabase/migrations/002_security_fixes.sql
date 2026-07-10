-- Correções de segurança — MESTRE DO MVP
-- 1) Policy de invoices apontava para `id` em vez de `user_id`
-- 2) sequences / sequence_steps estavam sem RLS nem policies

-- 1) invoices: usuário só vê as próprias faturas
drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices"
  on public.invoices for select using (auth.uid() = user_id);

-- 2) sequences: habilita RLS e restringe ao dono
alter table public.sequences enable row level security;
drop policy if exists "Users can CRUD own sequences" on public.sequences;
create policy "Users can CRUD own sequences"
  on public.sequences for all using (auth.uid() = user_id);

-- sequence_steps: habilita RLS; dono é determinado pela sequence pai
alter table public.sequence_steps enable row level security;
drop policy if exists "Users can CRUD own sequence steps" on public.sequence_steps;
create policy "Users can CRUD own sequence steps"
  on public.sequence_steps for all using (
    exists (
      select 1 from public.sequences s
      where s.id = sequence_steps.sequence_id
        and s.user_id = auth.uid()
    )
  );
