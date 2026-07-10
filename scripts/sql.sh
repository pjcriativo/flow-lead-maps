#!/usr/bin/env bash
# Roda SQL no Supabase via Management API.
# Uso:
#   ./scripts/sql.sh "select * from pg_tables;"
#   ./scripts/sql.sh -f caminho/arquivo.sql
set -euo pipefail

# Carrega variáveis do .env (na raiz do projeto)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
set -a; source "$ROOT/.env"; set +a

if [[ "${1:-}" == "-f" ]]; then
  QUERY="$(cat "$2")"
else
  QUERY="${1:?Passe uma query SQL ou -f arquivo.sql}"
fi

# Monta o corpo JSON com Node (escapa a query com segurança, inclusive multiline)
BODY="$(QUERY="$QUERY" node -e 'process.stdout.write(JSON.stringify({query:process.env.QUERY}))')"

curl -s -X POST \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$BODY"
echo
