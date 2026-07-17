-- Higiene da base: MARCAR (não apagar) os leads sem NENHUM canal de contato — nem e-mail válido,
-- nem WhatsApp, nem telefone. Reversível (é só um flag). O dono decide apagar depois, sabendo o nº.
-- "sem contato" ≠ "só telefone": quem tem telefone FIXO é discável (o app registra contato por
-- telefone) e NÃO é marcado. A UI esconde sem_contato por padrão, com filtro pra exibir.
alter table public.leads add column if not exists sem_contato boolean not null default false;
create index if not exists leads_sem_contato_idx on public.leads (user_id, sem_contato);
