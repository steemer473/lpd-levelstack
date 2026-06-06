# LevelStack (product app)

Delivery app for [LevelStack](https://levelplaydigital.com/platform/levelstack) — intake, research pipeline, report UI, and PDF. **Commerce stays on `lpd-redesign`** (hub); this repo reads hub `orders` for entitlement.

## Docs

- [Project brief & PRD](docs/project-brief.md)
- Report UI visual reference (v2): [assets/levelstack-executive-summary-v2.png](assets/levelstack-executive-summary-v2.png) · header crop: [assets/levelstack-report-header-v2.png](assets/levelstack-report-header-v2.png)
- **v0 rules (attach this in v0):** [docs/v0/V0-RULES.md](docs/v0/V0-RULES.md) — overrides sample HTML / project-brief for layout
- Legacy copy-tone reference only: [assets/levelstack-sample-report.html](assets/levelstack-sample-report.html) (v1 layout — not for design generation)

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui (`radix-vega`), Supabase (shared project with hub).

## Setup

```bash
pnpm install   # runs build:tokens via prepare
cp .env.example .env.local
# Fill Supabase URL/keys from the same project as lpd-redesign
pnpm dev
```

Apply product migrations to the **shared** Supabase project (same as `lpd-redesign`):

**Detailed guide:** [docs/supabase-migration.md](docs/supabase-migration.md)

Quick path (Dashboard): copy `supabase/migrations/20250603000000_levelstack_product_tables.sql` → [SQL Editor](https://supabase.com/dashboard/project/lppmbgqsovtfbpbvjvxi/sql/new) → Run → verify with `supabase/verify_levelstack_migration.sql`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build |
| `pnpm type-check` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test:unit` | Vitest |

## Phase status

- **Phase 0** — Scaffold (done)
- **Phase 1** — Handoff + intake (done) — see [docs/phase-1-e2e-test.md](docs/phase-1-e2e-test.md)
- **Phase 2** — Research + synthesis + **on-screen progress** — plan: [docs/plans/phase-2-instant-generation.md](docs/plans/phase-2-instant-generation.md)
- **Phase 3** — Report UI, PDF, email

No `STRIPE_*` in this app (v1).

## Vercel

Project: **lpd-levelstack** on Vercel (`https://lpd-levelstack.vercel.app`). Full checklist: [docs/vercel.md](docs/vercel.md).

```bash
pnpm dlx vercel link --yes --project lpd-levelstack --scope steemer473s-projects
pnpm verify:env          # checklist from .env.local
pnpm verify:research     # SerpAPI + OpenAI smoke test
```

Set Production env vars in Vercel (Supabase, `SERPAPI_KEY`, `OPENAI_API_KEY`, public URLs). Hub (`lpd-redesign`) needs `NEXT_PUBLIC_LEVELSTACK_APP_URL` pointing to this deployment.
