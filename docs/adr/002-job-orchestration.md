# ADR 002 — Report job orchestration

## Status

Accepted (Phase 2.1; updated June 2026)

## Context

Reports must generate asynchronously after intake without blocking the HTTP response or hitting serverless timeouts (~60s on Vercel).

## Decision

- **Trigger:** `after()` from `POST /api/intake`, `POST /api/free-intake`, and `POST /api/reports/[id]/run` when a user opens a stuck report.
- **Runner:** `lib/pipeline/run-report-pipeline.ts` in the same Node process; claims job with `pending | failed → running`.
- **Progress:** `levelstack_research_jobs.metadata` stores `current_step`, `completed_steps`, `progress`, `report_tier`.
- **Later:** Vercel Workflow or queue worker if we need retries, long-running SERP batches, or isolation from web traffic.

## Re-run behavior

| Report status | User action | Result |
|---------------|-------------|--------|
| `pending` / `generating` | Open report URL | `POST .../run` starts pipeline if not already running |
| `failed` | Open report URL (production) | **No auto-retry** — shows error only |
| `failed` | Dev **Regenerate** or `?regenerate=1` | Resets to `pending`, clears `report_json`, reruns full pipeline |
| `failed` | SQL reset + open URL | Job reclaimed (`failed → running`), fresh research |
| `ready` | Dev `?regenerate=1` only | Rebuild from intake |

Failed jobs **can** be claimed again by the runner. Ready reports are **not** regenerated in production without dev flag or SQL reset.

## Consequences

- Simple to develop locally; one deploy unit.
- Long reports may approach function timeout on Vercel — mitigate with step timeouts and lean SERP query sets (free tier ~7 queries).
- Failed reports leave `report_json` null; user sees `error_message` until a manual retry path is used.
