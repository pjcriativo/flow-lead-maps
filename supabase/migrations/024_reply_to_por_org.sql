-- E-MAIL DE RESPOSTAS POR ORG (Reply-To).
--
-- O problema: o From é contato@flowgenius.com.br (domínio verificado) e não havia Reply-To —
-- a resposta do lead caía numa caixa que o dono não lê. Ou seja, a proposta pede "responde
-- este e-mail" e a resposta se perdia.
--
-- NÃO confundir:
--   From      → fica NO DOMÍNIO VERIFICADO. Trocar pelo e-mail pessoal do usuário, sem
--               verificar o domínio dele, é spoofing: cai em spam e queima a reputação.
--   Reply-To  → qualquer e-mail, sem verificação. É onde a resposta chega. É ISTO aqui.
--   full_name → só a assinatura no corpo (já existe).
--
-- Mora em `profiles` (e não em email_config) por três motivos: a linha já existe pra toda org
-- (trigger on_auth_user_created), a RLS já é own-read/own-update, e a tela de Configurações já
-- escreve aqui. email_config só tem policy de SELECT — o cliente não conseguiria salvar.
alter table public.profiles add column if not exists reply_to_email text;

comment on column public.profiles.reply_to_email is
  'Reply-To dos e-mails da org (proposta e follow-up). Onde a resposta do lead chega. NÃO é o From — o From fica no domínio verificado.';
