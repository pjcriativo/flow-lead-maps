# Leadora — Frontend

![Live Demo](https://img.shields.io/badge/Live%20Demo-leadoraleads.lovable.app-2563EB?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

> The React + TypeScript frontend for **Leadora** — a Google Maps lead generation SaaS that scrapes 500 verified business leads with emails in under 10 minutes and auto-syncs them to Google Sheets.

🔗 **Live App:** [leadoraleads.lovable.app](https://leadoraleads.lovable.app)  
🔗 **Backend Repo:** [Leadora-SaaS](https://github.com/alihassanmetaexpert-rgb/Leadora-SaaS)

---

## What is Leadora?

Leadora lets you scrape Google Maps for verified business leads — names, emails, phone numbers, ratings, and websites — and export them directly to Google Sheets with one click.

It competes with Apollo.io and Outscraper at a fraction of the price, with a simpler UX and a unique auto Google Sheets sync feature no competitor offers at this price point.

---

## Frontend Features

- 🔐 **Google OAuth 2.0** — one-click sign in with Google
- 📊 **Real-time job polling** — watch leads appear live as they're scraped
- 📋 **Leads table** — sortable table with emails, phones, ratings, websites
- 🔗 **Google Sheets sync** — connect your sheet and export with one click
- 💳 **Subscription plans** — Free / Basic / Pro / Agency tier UI
- 📱 **Fully responsive** — works on desktop and mobile
- ⚡ **Fast builds** — Vite + TanStack Router for instant page loads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Router | TanStack Router |
| Auth & DB | Supabase |
| Build Tool | Vite |
| Deployment | Lovable.dev → Vercel |
| API | Connects to FastAPI backend on Railway |

---

## Architecture

```
Frontend (React + TypeScript)     Backend (Python FastAPI)
leadoraleads.lovable.app    ───►  leadora-saas-production.up.railway.app
        │
        ├── Supabase Auth (Google OAuth)
        ├── Real-time job polling (/scrape/status)
        ├── Leads table display
        └── Google Sheets sync trigger
```

---

## Screenshots

| Dashboard | Leads Table | Google Sheets |
|---|---|---|
| ![Dashboard](https://raw.githubusercontent.com/alihassanmetaexpert-rgb/Leadora-SaaS/main/dashboard.png) | ![Leads](https://raw.githubusercontent.com/alihassanmetaexpert-rgb/Leadora-SaaS/main/leads-table.png) | ![Sheets](https://raw.githubusercontent.com/alihassanmetaexpert-rgb/Leadora-SaaS/main/google-sheets.png) |

---

## Local Development

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm
- Supabase account
- Backend running locally or on Railway

### Setup

```bash
# Clone the repo
git clone https://github.com/alihassanmetaexpert-rgb/mapseeker-spark
cd mapseeker-spark

# Install dependencies
bun install

# Create environment file
cp .env.example .env
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
bun dev
```

App runs at `http://localhost:5173`

---

## Deployment

This frontend is deployed on **Lovable.dev** with automatic Vercel deployment on every push to `main`.

For custom deployment:

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

---

## Related

- 🔗 **Backend:** [Leadora-SaaS](https://github.com/alihassanmetaexpert-rgb/Leadora-SaaS) — Python FastAPI + Selenium + Redis
- 🌐 **Live App:** [leadoraleads.lovable.app](https://leadoraleads.lovable.app)
- 💼 **LinkedIn:** [Ali Hassan](https://www.linkedin.com/in/ali-hassan-a14461278)

---

## Built By

**Ali Hassan** — Solo founder and full-stack engineer  
[LinkedIn](https://www.linkedin.com/in/ali-hassan-a14461278) · [GitHub](https://github.com/alihassanmetaexpert-rgb) · [Live App](https://leadoraleads.lovable.app)
