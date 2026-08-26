-- Um desafio ainda nao concluido nao pode ser marcado como sessao verificada.
-- O estado de dispositivo permanece cifrado na mesma tabela e e retomado no proximo passo.

alter table public.instagram_connector_sessions
  alter column last_verified_at drop not null;
