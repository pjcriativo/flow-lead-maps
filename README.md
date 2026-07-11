# Flow Leads

Plataforma de geração de leads a partir do Google Maps. Busque, qualifique e
exporte contatos de empresas locais.

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Framework:** TanStack Start (SSR) + TanStack Router/Query
- **Estilo:** Tailwind CSS v4
- **Auth & DB:** Supabase
- **Deploy:** Cloudflare (Nitro)

## Desenvolvimento

Pré-requisitos: Node.js 18+ e uma conta Supabase.

```bash
# Instalar dependências
npm install

# Criar o arquivo de ambiente e preencher as variáveis
cp .env.example .env

# Rodar em desenvolvimento (http://localhost:8080)
npm run dev
```

### Variáveis de ambiente

Veja `.env.example`. As principais:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_API_BASE=http://localhost:8000
```

## Build

```bash
npm run build     # gera a saída de produção
npm run preview   # pré-visualiza o build
```

## Licença

MIT © MESTRE DO MVP
