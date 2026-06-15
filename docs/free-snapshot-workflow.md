# Free snapshot workflow

End-to-end flow for the LevelStack free snapshot on `levelstack.levelplaydigital.com`.

## User journey

1. **Hub bridge** — `levelplaydigital.com/free` redirects to product `/free`
2. **Form** — business name, domain, email, optional city → submit **Run my snapshot**
3. **Auth** — magic-link redirect to `/reports/{id}` progress screen
4. **Pipeline** — live SerpAPI research + website fetch → report JSON saved
5. **Report** — progress UI refreshes to full report (~1.5s ready state)
6. **Email** — magic-link backup on submit; report-ready when generation completes

## One snapshot per email (production)

Each email gets **one** free snapshot. A second submit returns **409** and opens the existing report.

The form shows: *"You already have a snapshot for {business} — opening your existing report."*

To test a **different business** in production, use a **new email address**.

## Dev re-run (local only)

In `NODE_ENV=development`, the form automatically calls `/api/free-intake?replace=1`, which deletes the prior intake/report/job for that email and creates a fresh snapshot.

Optional env (instead of query param):

```bash
LEVELSTACK_DEV_REPLACE_SNAPSHOT=true
```

Never set this on Vercel.

## Real analysis requirements

Reports only mark `ready` when:

- **SERP data** exists (brand/reputation searches returned results)
- **Website fetch** succeeded (title, H1, meta, or body content)

If research fails, the report status is **failed** with: *"We couldn't complete live research. Try again or contact support."*

### Required env vars (Production)

| Variable | Purpose |
|---|---|
| `SERPAPI_KEY` | Google search research |
| `OPENAI_API_KEY` | Search footprint synthesis (free tier) |
| `SUPABASE_*` | Auth + report storage |
| `NEXT_PUBLIC_APP_URL` | Magic-link redirects |

Recommended: `RESEND_API_KEY`, `FROM_EMAIL`, `GHL_API_KEY`, `GHL_LOCATION_ID`

Verify locally:

```bash
pnpm verify:env
pnpm verify:research
vercel env ls production
```

## Transactional email

| When | Email |
|---|---|
| Form submit | Magic-link sign-in (backup) |
| Pipeline complete | Report ready |

Nurture / upgrade sequences (D1, D3, D7, D14) are **not** sent from the app — wire in GHL using tag `levelstack_free_snapshot`.

## GHL sync

On submit, `syncFreeSnapshotLead` pushes contact with tags `levelstack`, `levelstack_free_snapshot`, plus report URL custom field.

## Key files

| Area | File |
|---|---|
| Form | `components/free/free-snapshot-form.tsx` |
| API | `app/api/free-intake/route.ts` |
| Pipeline | `lib/pipeline/run-report-pipeline.ts` |
| Research gate | `lib/pipeline/research-quality.ts` |
| Report UI | `components/report/levelstack-report-view.tsx` |
| Dev replace | `lib/intake/replace-free-snapshot.ts` |

## Manual QA

See [phase-1-e2e-test.md](./phase-1-e2e-test.md) — Free snapshot flow section.
