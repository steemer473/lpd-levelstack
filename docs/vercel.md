# Vercel deployment

Separate Vercel project from `lpd-redesign` — **lpd-levelstack** on team `steemer473s-projects`.

- **Production:** https://lpd-levelstack.vercel.app (custom domain TBD: `levelstack.levelplaydigital.com`)
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

| Variable | Example / notes |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://lpd-levelstack.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_HUB_URL` | `https://levelplaydigital.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project as hub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as hub |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; same project |
| `SERPAPI_KEY` | Live report research |
| `OPENAI_API_KEY` | Report synthesis |

### Optional (recommended)

| Variable | Notes |
|----------|--------|
| `FIRECRAWL_API_KEY` | Website scrape in pipeline |
| `GOOGLE_PAGESPEED_API_KEY` | Higher PageSpeed API quota |
| `RESEND_API_KEY` | Phase 3+ email delivery |
| `FROM_EMAIL` / `FROM_NAME` | With Resend |
| `ANTHROPIC_API_KEY` | Alternate LLM (optional) |

### Never set on Vercel

| Variable | Why |
|----------|-----|
| `LEVELSTACK_DEV_BYPASS_ENTITLEMENT` | Skips purchase check — **local only** |
| `LEVELSTACK_DEV_SKIP_WEBSITE_CHECK` | Skips URL validation — **local only** |
| `STRIPE_*` | Commerce stays on hub |

## Hub integration

In **lpd-redesign** (hub), set:

```bash
NEXT_PUBLIC_LEVELSTACK_APP_URL=https://lpd-levelstack.vercel.app
```

See [hub-env.md](./hub-env.md).

## Pre-deploy verification

```bash
# Local keys + API smoke test
node scripts/verify-research-keys.mjs

# Production env checklist (no secrets printed)
node scripts/verify-vercel-env.mjs
```

## Report pipeline timeout

`/api/intake` and `/api/reports/[id]/run` export `maxDuration = 300` (5 min) for Fluid Compute so `after()` synthesis can finish.

## Custom domain (when ready)

1. Vercel project → **Settings → Domains** → add `levelstack.levelplaydigital.com`
2. Update `NEXT_PUBLIC_APP_URL` to the custom domain
3. Update hub `NEXT_PUBLIC_LEVELSTACK_APP_URL`

## CI vs Vercel

GitHub **Check** workflow runs lint, type-check, tests, and build **without** production secrets (`VERCEL_ENV` unset). Strict env validation applies only when `VERCEL_ENV=production`.
