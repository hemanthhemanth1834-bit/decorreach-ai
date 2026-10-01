# DecorReach AI — Discover. Qualify. Reach.

API-powered U.S. buyer discovery and outreach for home-decor sellers. No CSV uploads — the app discovers buyers live through open geo/business APIs, then helps you qualify, email, and track them.

## Problem
Home-decor sellers waste hours manually hunting for U.S. retail/design buyers. DecorReach AI automates discovery (live APIs), qualification (filters), outreach (AI-assisted email), and follow-through (campaign tracking) in one SaaS dashboard.

## Features
- **Find Buyers**: product/category + U.S. city/state/ZIP + keyword + radius → `POST /api/buyers/search`
- **Live/Demo truthfulness**: every result labeled LIVE or DEMO; demo data has no emails/websites and is never mixed silently
- **Results UI**: counts, source links, selection, filters (search/city/email/website/source/mode), sorting, select-all
- **Lead drawer**: contact info, map (OSM), source URL, timestamps, save/email/website actions
- **Saved leads** (`/api/leads`), **dashboard stats** (`/api/dashboard`), search history
- **Email Studio**: generate → edit → preview → explicit send; AI label vs Template label
- **Campaigns** with per-lead status (pending/sent/failed), provider IDs, timestamps
- **Settings**: seller profile, provider health, env guidance
- **Safety**: rate limits, opt-out footer, compliance notice, server-side secrets only

## Architecture
```
src/app/            App Router pages + API routes
  api/buyers/search | api/leads | api/ai/generate-email | api/email/send
  api/campaigns     | api/provider-health | api/dashboard
src/providers/
  buyers/  types.ts (BuyerProvider, dedupe) · overpass.ts (live) · demo.ts · index.ts (orchestrator)
  geo/     nominatim.ts (free geocoder)
  ai/      openai.ts (OpenAI-compatible, optional) · types.ts (template fallback)
  email/   resend.ts (Resend-compatible, optional)
src/lib/   types.ts · validation.ts (Zod) · store.ts (in-memory, Supabase-optional) · supabase.ts · rate-limit.ts
src/components/ shell · ui · lead-drawer
supabase/schema.sql
```

All external responses are normalized to `NormalizedLead` (email is `null` when unavailable — never invented).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React Hook Form + Zod · Supabase/Postgres (optional) · Vitest · ESLint + Prettier · Vercel-ready.

## Providers & free-tier strategy

| Provider | Purpose | Free/Open | Key required | Limits / notes | Fallback | Attribution |
|---|---|---|---|---|---|---|
| Overpass API (OSM data) | Buyer/business discovery | Yes, free, no key | No | Fair-use; 429/504 possible under load; per-tag queries ≤15s with 1 retry; scan radius capped at ~10 km to protect shared endpoints | Demo dataset (labeled) | © OpenStreetMap contributors |
| Nominatim | Geocoding (city/ZIP → lat/lon) | Yes, free, no key | No | Usage policy: ≤1 req/s, User-Agent required; may 403 under load | U.S. Census → gazetteer | © OpenStreetMap |
| U.S. Census Geocoder | Geocoding fallback (US-only) | Yes, free, no key | No | US addresses only; benchmark Public_AR_Current | Built-in gazetteer | U.S. Census Bureau |
| Built-in gazetteer | Last-resort geocoding (20 major metros) | Yes | No | City-centroid coordinates only; buyer data still live | Demo mode | Labeled in code |
| OpenStreetMap staticmap | Map thumbnails | Yes, free | No | Tile-usage policy | Link to osm.org | © OSM |
| Demo provider (built-in) | Clearly-labeled placeholders | Yes | No | 8 illustrative rows, no emails | n/a | Labeled DEMO |
| AI (OpenAI-compatible) | Email generation | Vendor-dependent free tiers | Optional (`AI_API_KEY`) | Each vendor has quotas; never required | Deterministic template | — |
| Email (Resend-compatible) | Transactional send | Vendor free quota (limited) | Optional (`EMAIL_API_KEY`, `EMAIL_FROM`) | Quotas + domain verification per vendor | Truthful `not_configured` status | — |
| Supabase Postgres | Persistence | Free tier with limits | Optional | Row/storage caps on free tier | In-memory store | — |
| Vercel | Hosting | Free hobby tier | No | Build/execution limits | — | — |

> Nothing paid is mandatory. Without AI/email/Supabase keys the app runs end-to-end in Demo + template mode with truthful statuses.

## Env vars
See `.env.example`. Server-only (never exposed): `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_API_KEY`, `AI_API_KEY`.

## Supabase setup (optional)
1. Create a free project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only).
4. Without these, the app uses the in-memory store automatically.

## AI setup (optional)
Set `AI_API_KEY` (+ optional `AI_MODEL`, `AI_BASE_URL`). Compatible with OpenAI, Groq, Together, OpenRouter, Ollama (OpenAI-compatible endpoint). Unset → deterministic template labeled **Template Generated**.

## Email setup (optional)
Set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` (verified sender), `EMAIL_FROM_NAME`. Unset → send returns `not_configured` with setup guidance; UI never claims delivery.

## Local dev
```bash
npm install
cp .env.example .env.local
npm run dev      # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy (Vercel)
1. Push to GitHub repo `decorreach-ai`.
2. Import in Vercel, add env vars from `.env.example`.
3. Deploy — no build config needed (`next build`).

## Demo mode
When Overpass/Nominatim are unreachable or return nothing, the API returns `mode: "demo"` with a banner: *"DEMO MODE — External buyer provider is not configured…"*. Demo rows carry `sourceType: "demo"`, `email: null`, `website: null`. Set `DEMO_FALLBACK=off` to surface live errors instead.

## Testing
```bash
npm test          # vitest: validation, dedupe, normalization, fallback, email/campaign rules
npm run lint
npm run typecheck
npm run build
```

## Security
Server-side secrets only · Zod on every route · safe error messages (no stack traces) · in-memory rate limits (20 searches/min, 15 sends/min, 30 AI/min) · no sensitive logs · RLS-enabled schema · `.env*` git-ignored.

## Compliance
Outreach requires explicit seller action per email. An opt-out footer is appended automatically. UI notice: *"Use only legitimate publicly available business contact information and comply with applicable email, privacy, anti-spam, and provider requirements."* Only publicly listed business data (OSM tags) is shown; personal/private data is never displayed.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| DEMO MODE banner | Overpass rate-limited or no results → retry, widen radius, or try another city |
| Geocode fails | Use `City, ST` or ZIP (`10001`); Nominatim ≤1 req/s |
| Email `not_configured` | Set `EMAIL_API_KEY` + `EMAIL_FROM` |
| AI always template | Set `AI_API_KEY` (+ `AI_BASE_URL` for non-OpenAI) |
| Overpass 429 | Wait 60s (rate limited upstream) |

## Internship demo script (2–3 min screen record)
1. Open **Dashboard** → click **Find Buyers**.
2. Enter `Category: Home Decor`, `Location: New York, NY` → **FIND BUYERS**.
3. Show LIVE/DEMO badge + sources; filter (Has Website / city), sort.
4. Select leads → Save → open one (View) → **Generate Email**.
5. In **Email Studio**: review/edit subject + body, Preview.
6. **Send Email** → show truthful status (sent vs not_configured).
7. Open **Campaigns** → create campaign from saved leads → detail page shows per-lead status/provider IDs.
