# Creative Media Analyser

Upload ad creatives and performance data. Extract structured creative variables using AI. Discover which visual patterns correlate with better performance for your brand.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** Supabase Postgres + Storage
- **AI:** Anthropic Claude Haiku 4.5 (structured extraction via forced tool use)

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic keys
npm install
npm run dev
```

## Legacy

The original Streamlit prototype is preserved in `legacy/` for reference.
