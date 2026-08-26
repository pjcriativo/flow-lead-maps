# Instagram Session Connector

Worker isolado do piloto de conexão do Instagram. Recebe credenciais apenas durante a tentativa de
login, persiste somente o estado de sessão cifrado e aceita chamadas assinadas pelo Edge Function.

Variáveis obrigatórias:

- `CONNECTOR_SHARED_SECRET`
- `CONNECTOR_ENCRYPTION_KEY` (Fernet)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

O piloto deve usar somente contas de teste. Login por sessão privada pode sofrer desafios ou
bloqueios da plataforma; ações automáticas permanecem desligadas até a validação operacional.
