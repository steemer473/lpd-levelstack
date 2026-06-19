# LevelStack (product app)

Delivery app for [LevelStack](https://levelplaydigital.com/platform/levelstack) — intake, research pipeline, report UI, and PDF. **Commerce stays on `lpd-redesign`** (hub); this repo reads hub `orders` for entitlement.

## Docs

- [Project brief & PRD](docs/project-brief.md)
- [Free snapshot workflow](docs/free-snapshot-workflow.md) — form → progress → report, emails, GHL, dev re-run
- Report UI visual reference (Figma): [audit-report frame 4:4](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4) — **not** `assets/levelstack-report-header-v2.png` or `levelstack-executive-summary-v2.png` (deprecated)
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
- **Phase 3** — Report UI, PDF, email (free snapshot magic link live; nurture D3/D7/D14 TBD)

No `STRIPE_*` in this app (v1).

## Vercel

Project: **lpd-levelstack** on Vercel — production: [levelstack.levelplaydigital.com](https://levelstack.levelplaydigital.com). Full checklist: [docs/vercel.md](docs/vercel.md).

```bash
pnpm dlx vercel link --yes --project lpd-levelstack --scope steemer473s-projects
pnpm verify:env          # checklist from .env.local
pnpm verify:research     # SERP providers (≥1) + OpenAI smoke test
```

Set Production env vars in Vercel (`NEXT_PUBLIC_APP_URL=https://levelstack.levelplaydigital.com`, Supabase, **≥1 SERP provider**, `OPENAI_API_KEY`, Resend). Hub (`lpd-redesign`) needs matching `NEXT_PUBLIC_LEVELSTACK_APP_URL`. See [docs/vercel.md](docs/vercel.md) for Supabase auth redirect URLs and SERP failover setup.
