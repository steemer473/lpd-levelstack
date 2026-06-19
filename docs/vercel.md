# Vercel deployment

Separate Vercel project from `lpd-redesign` — **lpd-levelstack** on team `steemer473s-projects`.

- **Production (primary):** https://levelstack.levelplaydigital.com
- **Production (Vercel alias):** https://lpd-levelstack.vercel.app — still works; prefer custom domain in env vars and links
- **Framework:** Next.js 16 · Build: `pnpm build` · Install: `pnpm install`
- **Node:** 24.x (Vercel default) · **pnpm:** 9.x (pinned via `packageManager` in `package.json`)

## Local link

```bash
pnpm dlx vercel link --yes --project lpd-levelstack --scope steemer473s-projects
vercel env pull .env.local   # optional — refresh local from Vercel
```

`.vercel/` is gitignored; each developer links locally.

## Environment variables

Set in **Production** (required) and **Preview** (recommended — use dashboard “All Previews”). `env.mjs` **requires** the core set below on Vercel Production (`VERCEL_ENV=production`) or the build fails.

```bash
node scripts/sync-vercel-production-env.mjs   # Production only (from .env.local)
```

### Required (Production)

| Variable | Value / notes |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://levelstack.levelplaydigital.com` |
| `NEXT_PUBLIC_HUB_URL` | `https://levelplaydigital.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project as hub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as hub |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; same project |
| `OPENAI_API_KEY` | Report synthesis |
| **≥1 SERP provider** | See optional SERP vars below — at least one required |

### Optional (recommended)

| Variable | Notes |
|----------|--------|
| `SERPAPI_KEY` | SerpAPI — default first in provider chain |
| `SEARCHAPI_KEY` | SearchAPI.io — failover provider |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | DataForSEO — failover provider |
| `SERP_PROVIDER_CHAIN` | Default `serpapi,searchapi,dataforseo` |
| `SERP_CACHE_TTL_HOURS` | Default `24` — Supabase SERP cache TTL |
| `FIRECRAWL_API_KEY` | Website scrape in pipeline |
| `GOOGLE_PAGESPEED_API_KEY` | Higher PageSpeed API quota |
| `RESEND_API_KEY` | Transactional email (report ready, admin notify) |
| `FROM_EMAIL` / `FROM_NAME` | With Resend; domain must be verified |
| `LEVELSTACK_ADMIN_NOTIFY_EMAIL` | Admin alert on free snapshot submit (defaults to `admin@levelplaydigital.com`) |
| `GHL_API_KEY` / `GHL_LOCATION_ID` | GoHighLevel lead sync — copy from hub Vercel project |
| `ANTHROPIC_API_KEY` | Alternate LLM (optional) |

### Never set on Vercel

| Variable | Why |
|----------|-----|
| `LEVELSTACK_DEV_BYPASS_ENTITLEMENT` | Skips purchase check — **local only** |
| `LEVELSTACK_DEV_SKIP_WEBSITE_CHECK` | Skips URL validation — **local only** |
| `LEVELSTACK_DEV_MOCK_SERP` | Returns fixture SERP data — **local only** |
| `STRIPE_*` | Commerce stays on hub |

## Hub integration

In **lpd-redesign** (hub), set the same product URL:

```bash
NEXT_PUBLIC_LEVELSTACK_APP_URL=https://levelstack.levelplaydigital.com
```

See [hub-env.md](./hub-env.md).

## Supabase auth redirect URLs

Free snapshot magic links redirect through `/auth/callback` on the product origin. Add these in Supabase → **Authentication → URL Configuration → Redirect URLs**:

```
https://levelstack.levelplaydigital.com/**
http://localhost:3001/**
```

Optional (Vercel default hostname still works as an alias):

```
https://lpd-levelstack.vercel.app/**
```

`NEXT_PUBLIC_APP_URL` must match the primary redirect entry or magic-link and email URLs will point at the wrong host.

### Magic-link OTP expiry (24 hours — Supabase max)

Free snapshot report-ready emails state links are valid for **24 hours**. In Supabase (hosted project `lppmbgqsovtfbpbvjvxi`):

**Authentication → Providers → Email → Email OTP expiration** → set **`86400`** (seconds)

The dashboard enforces a **maximum of 86400** (24 hours); longer values are rejected.

## Pre-deploy verification

```bash
# Local keys + API smoke test
node scripts/verify-research-keys.mjs

# Production env checklist (no secrets printed)
node scripts/verify-vercel-env.mjs
```

## Report pipeline timeout

`/api/intake`, `/api/free-intake`, and `/api/reports/[id]/run` export `maxDuration = 300` (5 min) for Fluid Compute so `after()` synthesis can finish.

## CI vs Vercel

GitHub **Check** workflow runs lint, type-check, tests, and build **without** production secrets (`VERCEL_ENV` unset). Strict env validation applies only when `VERCEL_ENV=production`.
