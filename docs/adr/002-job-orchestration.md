# ADR 002 — Report job orchestration

## Status

Accepted (Phase 2.1)

## Context

Reports must generate asynchronously after intake without blocking the HTTP response or hitting serverless timeouts (~60s on Vercel).

## Decision

- **Trigger:** `after()` from `POST /api/intake` and `POST /api/reports/[id]/run` when a user opens a stuck report.
- **Runner:** `lib/pipeline/run-report-pipeline.ts` in the same Node process; claims job with `pending | failed → running`.
- **Progress:** `levelstack_research_jobs.metadata` stores `current_step`, `completed_steps`, `progress`.
- **Later:** Vercel Workflow or queue worker if we need retries, long-running SerpAPI batches, or isolation from web traffic.

## Consequences

- Simple to develop locally; one deploy unit.
- Long reports may approach function timeout on Vercel — mitigate with step timeouts and lean SerpAPI query sets in v1.
- Re-run: failed jobs can be claimed again; ready reports are not regenerated.
