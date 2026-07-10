# LeadSift

**LeadSift** is a local lead generation SaaS platform that replaces info-product courses with real software. Users pay a monthly subscription to find, score, and connect with local business leads sourced from Google Maps.

## Live Demo

[https://qjqzh2y6xmqqi.kimi.page](https://qjqzh2y6xmqqi.kimi.page)

## Features

- **Lead Finder** — Search Google Maps by city + niche with advanced filters
- **Lead Scoring** — AI-powered 0-100 scoring based on 7 weighted criteria
- **Lead Enrichment** — Automatically fill in missing contact data
- **Integrations** — Connect GoHighLevel, HubSpot, Mailchimp, ActiveCampaign, Zapier, and more
- **Outreach** — Built-in email sequences and templates
- **Pipeline** — Kanban board to track leads from New to Closed Won
- **Billing** — Subscription management with Stripe (Starter $29, Growth $79, Agency $197)

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Charts:** Recharts
- **Animations:** Framer Motion

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing site with pricing, features, FAQ |
| `/dashboard` | Dashboard | KPIs, charts, recent leads |
| `/finder` | Lead Finder | Search & filter leads |
| `/scoring` | Lead Scoring | Scoring engine & criteria |
| `/enrichment` | Enrichment | Data enrichment dashboard |
| `/integrations` | Integrations | Connect apps |
| `/outreach` | Outreach | Email campaigns |
| `/pipeline` | Pipeline | Kanban board |
| `/billing` | Billing | Subscription management |
| `/settings` | Settings | Profile, team, security |

## Getting Started

```bash
npm install
npm run dev
```

## License

MIT © MESTRE DO MVP
