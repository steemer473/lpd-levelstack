# Plunk nurture workflow — operations runbook

**Status:** App-side Plunk integration is **shipped**. Workflows deploy via script; verify transitions in Plunk dashboard after first run.

**Copy source of truth:** [`lpd-planning/COPY_BANK.md`](../../../lpd-planning/COPY_BANK.md) §4  
**Architecture:** [`lpd-planning/FUNNELS_AND_MARKETING.md`](../../../lpd-planning/FUNNELS_AND_MARKETING.md) §4  
**Domain setup:** [`plunk-domain-setup.md`](./plunk-domain-setup.md)

---

## Stack summary

| Layer | Tool | Role |
|-------|------|------|
| Email 1 (report delivery) | **Resend** (`lpd-levelstack`) | Transactional — sent by the product app |
| Emails 2–5 + W1–W4 + A1–A4 | **Plunk** (hosted SaaS) | Nurture workflows A, B & C — **Plunk renders and sends** |
| Business CRM | **Supabase** (shared project) | Orders, waitlist, report data |
| Email audience + sequences | **Plunk** | Contact records + workflow engine |
| Chat, SMS, inbox | **GHL** (downgraded) | Communications only — no nurture workflows |

---

## Where campaigns run (read this first)

**Nurture campaigns do not send from `lpd-levelstack` or `lpd-redesign`.** Both repos only fire **events** to Plunk via `POST /v1/track`. Plunk (cloud) owns template storage, scheduling, rendering, and delivery from `notify@notify.levelplaydigital.com`.

```
lpd-levelstack (report ready)
  └─ Resend → Email 1 (transactional, immediate)
  └─ Plunk track → levelstack_report_ready → Workflow A → Emails 2–5

lpd-redesign (hub)
  └─ Stripe webhook → levelstack_purchased → exits Workflow A
  └─ POST /api/sap-waitlist → sap_waitlist_joined → Workflow B/C → W1–W4 or A1–A4
```

### Repo responsibilities

| Concern | Repo | What it does | What it does **not** do |
|---------|------|--------------|------------------------|
| **Workflow A trigger** | `lpd-levelstack` | `trackReportReadyForNurture()` in `run-report-pipeline.ts` | Send Emails 2–5 |
| **Workflow A exit** | `lpd-redesign` + `lpd-levelstack` | `levelstack_purchased` from Stripe webhook + `/api/upgrade/notify` | Cancel sends directly |
| **Workflow B trigger** | `lpd-redesign` | `POST /api/sap-waitlist` → Supabase + Plunk track | Send W1–W4 |
| **Workflow C trigger** | `lpd-redesign` | `POST /api/sap-waitlist` → Supabase + Plunk track | Send A1–A4 |
| **Email 1** | `lpd-levelstack` | `sendReportReadyEmail` via Resend | Part of Plunk nurture |
| **Template HTML (source)** | `lpd-levelstack` | `lib/email/nurture-email-layout.ts` → sync to Plunk | Host live templates |
| **Live templates + workflows** | **Plunk dashboard** | Stores templates, runs delays/branches | Trigger on its own |
| **Analytics webhook** | `lpd-levelstack` | `POST /api/webhooks/plunk` → `email_events` | Required for sends |

### Active workflow IDs (production)

Recorded in [`docs/plunk/workflow-ids.json`](../plunk/workflow-ids.json):

| Workflow | Plunk ID | Trigger event |
|----------|----------|---------------|
| A — Nurture Emails 2–5 | `de45a2a4-344c-4afe-9ffd-69b199b8ee2a` | `levelstack_report_ready` |
| B — SAP waitlist W1–W4 | `3a49aa59-4ea9-4350-b423-715010c72837` | `sap_waitlist_joined` |
| C — Agency waitlist A1–A4 | `9f963ee6-b9fc-43e7-be81-5c0ce17c5bb2` | `sap_waitlist_joined` |

Both apps must use the **same** `PLUNK_SECRET_KEY` (same Plunk project). Duplicate workflows with the same trigger and overlapping conditions will double-send — keep only one enabled set.

### Troubleshooting “wrong” emails

| Symptom | Check here |
|---------|------------|
| Email 1 missing/wrong | `lpd-levelstack` Resend path (`sendReportReadyEmail`) |
| Nurture never started | `lpd-levelstack` logs for `[plunk] nurture track failed`; Plunk contact timeline for `levelstack_report_ready` |
| Nurture started but wrong copy | Plunk template (re-sync from `lpd-levelstack`: `pnpm sync:plunk-templates`) |
| Waitlist sequence wrong | `lpd-redesign` `POST /api/sap-waitlist`; Plunk Workflow B/C branch conditions |
| Duplicate nurture emails | Multiple enabled workflows on same trigger in Plunk — delete extras |
| Purchase didn't stop nurture | `lpd-redesign` Stripe webhook + `LEVELSTACK_UPGRADE_NOTIFY_SECRET` on both repos |

---

## What the app does (code)

When a report reaches `status = ready`, the pipeline:

1. Sends **Email 1** via Resend (`sendReportReadyEmail`).
2. Optionally syncs lightweight GHL contact fields (`syncReportCompleteEnrichment` — tag `levelstack` only).
3. Fires Plunk event `levelstack_report_ready` → **Workflow A**.

| Piece | Location | Status |
|-------|----------|--------|
| Nurture HTML templates | `lib/email/nurture-email-layout.ts` | Shipped |
| Plunk track helpers | `lib/plunk/track-event.ts` | Shipped |
| Pipeline hook | `lib/pipeline/run-report-pipeline.ts` | Shipped |
| Template sync script | `scripts/sync-plunk-templates.mjs` | Shipped |
| Workflow deploy script | `scripts/setup-plunk-workflows.mjs` | Shipped |
| Purchase exit event | Hub Stripe webhook + `app/api/upgrade/notify` | Shipped |
| Waitlist trigger | Hub `POST /api/sap-waitlist` | Shipped |
| Analytics webhook | `app/api/webhooks/plunk/route.ts` | Shipped |

---

## Step 1 — Domain & sender (required before go-live)

Complete [`plunk-domain-setup.md`](./plunk-domain-setup.md) first. Do not deploy workflows until `notify.levelplaydigital.com` is verified in Plunk.

Env vars (lpd-levelstack):

```bash
PLUNK_SECRET_KEY=sk_...          # same project key as hub
PLUNK_FROM_EMAIL=notify@notify.levelplaydigital.com
PLUNK_FROM_NAME=LevelStack
PLUNK_API_URL=https://next-api.useplunk.com
PLUNK_WORKFLOW_API_URL=https://next-api.useplunk.com
PLUNK_WEBHOOK_SECRET=...         # optional until webhook step is wired
GHL_SYNC_ENABLED=true            # optional GHL mirror; set false to skip
RESEND_API_KEY=re_...            # Email 1 only — not Plunk
```

Hub (`lpd-redesign` — triggers only; does not send nurture mail):

```bash
PLUNK_SECRET_KEY=sk_...          # must match lpd-levelstack
PLUNK_API_URL=https://next-api.useplunk.com
LEVELSTACK_UPGRADE_NOTIFY_SECRET=...  # must match lpd-levelstack
```

Do **not** set `PLUNK_FROM_EMAIL` on the hub unless you add a separate send path there. Nurture sends from Plunk using the from-address on each template (synced from levelstack).

---

## Step 2 — Generate and sync templates

From `lpd-levelstack`:

```bash
pnpm generate:nurture-emails          # writes docs/plunk/email-templates/*.html
pnpm sync:plunk-templates             # uploads MARKETING templates to Plunk API
pnpm sync:plunk-templates -- --dry-run
```

Templates use Plunk merge variables: `{{firstName}}`, `{{reportUrl}}`, `{{topCompetitor}}`, `{{topFinding}}`, `{{unsubscribeUrl}}`.

---

## Step 3 — Deploy workflows

```bash
pnpm setup:plunk-workflows
```

This creates:

### Workflow A — LevelStack nurture (Emails 2–5)

- **Trigger:** `levelstack_report_ready`
- **Exit:** `levelstack_purchased`
- **Delays:** +4h → Email 2 → +2d → Email 3 (competitor branch) → +2d → Email 4 → +3d → Email 5

### Workflow B — SAP waitlist (W1–W4)

- **Trigger:** `sap_waitlist_joined` when `sapCreditEligible: true`
- **Delays:** +1h W1 → +3d W2 → +5d W3 → +9d W4

### Workflow C — Agency waitlist (A1–A4)

- **Trigger:** `sap_waitlist_joined` when `audience: agency` and `sapCreditEligible: false`
- **Delays:** +1h A1 → +3d A2 → +5d A3 → +9d A4
- **CTA attribution:** `/platform/seo/for-agencies?source=sap_agency_email`

After first deploy, open Plunk dashboard and verify step wiring (API may not connect all transitions).

---

## Step 4 — Analytics webhooks (separate workflows)

Plunk has **no global Webhook URL setting**. Analytics uses **additional workflows** — one per system event — each with a single **Webhook** step.

Deploy via script (recommended):

```bash
pnpm setup:plunk-analytics-webhooks
```

This creates workflows named `LevelStack Analytics — email.open`, etc., each posting to:

```
https://levelstack.levelplaydigital.com/api/webhooks/plunk
```

Set in `.env.local` / Vercel:

```bash
PLUNK_WEBHOOK_URL=https://levelstack.levelplaydigital.com/api/webhooks/plunk
PLUNK_WEBHOOK_SECRET=...   # Bearer token sent in webhook step headers
```

**Manual (Plunk dashboard):** Workflows → **Create workflow** → trigger e.g. `email.open` → **Add step** → **Webhook** → paste URL → add header `Authorization: Bearer <PLUNK_WEBHOOK_SECRET>`. Your nurture workflows (A & B) are separate — do not add webhook steps there.

Events stored in Supabase `email_events` (migration `20250630100000_email_events.sql`).

---

## Step 5 — GHL (communications only)

**Do not** build GHL Workflow A/B. GHL keeps:

- Chat widget (`NEXT_PUBLIC_GHL_CHAT_WIDGET_ID`)
- SMS / A2P inbox
- Optional contact mirror via `GHL_SYNC_ENABLED`

See [`ghl-downgrade-checklist.md`](./ghl-downgrade-checklist.md) for plan downgrade steps.

---

## Verification checklist

Full step-by-step manual test plan: [plunk-manual-test-plan.md](./plunk-manual-test-plan.md)

- [ ] Domain verified in Plunk (`notify.levelplaydigital.com`)
- [ ] Templates synced (13 files: 5 nurture + 4 waitlist + 4 agency waitlist)
- [ ] Workflows deployed and transitions verified in dashboard
- [ ] Test report completes → `levelstack_report_ready` in Plunk contact timeline
- [ ] Test $97 checkout → Workflow A exits on `levelstack_purchased`
- [ ] Test SAP waitlist form on `/platform/seo` → `sap_waitlist_signups` row + Plunk event
- [ ] Webhook receives delivery/open events in `email_events`

---

## Deprecated

The GHL nurture runbook [`ghl-nurture-workflow.md`](./ghl-nurture-workflow.md) is **obsolete** — do not build GHL email workflows.
