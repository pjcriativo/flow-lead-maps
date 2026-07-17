-- ETAPA 1 (correção): remove o UNIQUE(user_id) de wa_instancias — ele forçava 1 instância por
-- org e contradizia N chips. Cada chip continua com nome ÚNICO (wa_instancias_nome_key) e
-- escopado por user_id via RLS. Sem isto, criar um 2º chip da org falha com 23505.
alter table public.wa_instancias drop constraint if exists wa_instancias_user_id_key;
