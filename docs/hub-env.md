# Hub env for LevelStack handoff

Add to `lpd-redesign` (Vercel + `.env.local`):

```bash
# Hub stays on :3000; product app runs on :3001 (see lpd-levelstack package.json dev script)
NEXT_PUBLIC_LEVELSTACK_APP_URL=http://localhost:3001
```

Production (must match product `NEXT_PUBLIC_APP_URL`):

```bash
NEXT_PUBLIC_LEVELSTACK_APP_URL=https://levelstack.levelplaydigital.com
```

Without this variable, hub account sidebar, checkout success, and `/free` redirects will not link to the product app.

## Product app (lpd-levelstack)

| Environment | `NEXT_PUBLIC_APP_URL` |
|-------------|------------------------|
| Local | `http://localhost:3001` |
| Production | `https://levelstack.levelplaydigital.com` |

See [vercel.md](./vercel.md) for full Vercel + Supabase auth redirect checklist.

## GoHighLevel lead sync

LevelStack syncs intake leads to GHL via server-side API (same location as the hub). Copy these from the **lpd-redesign** Vercel project (or hub `.env.local`):

```bash
GHL_API_KEY=       # same value as hub
GHL_LOCATION_ID=   # same value as hub
```

Set in **lpd-levelstack** Vercel → Production and Preview. Without them, intake still succeeds but leads are not synced (logged as `[ghl]` warnings).

### Sync phases

1. **Intake submit** — `syncFreeSnapshotLead` / `syncPaidIntakeLead` creates or updates the contact with intake tags and baseline fields.
2. **Report complete** — `syncReportCompleteEnrichment` runs after the report-ready email with `top_competitor`, `top_finding`, `report_tier`, signed report URL, and tag `levelstack` only (no nurture tags — Plunk handles sequences).

Create custom fields: `pnpm setup:ghl-fields` (from repo root with `.env.local`).

**Nurture (Emails 2–5, W1–W4):** [operations/plunk-nurture-workflow.md](./operations/plunk-nurture-workflow.md) — runs in **Plunk**, not GHL.

## Plunk events (hub — `lpd-redesign`)

The hub does **not** send nurture emails. It fires Plunk events that start or stop workflows in the shared Plunk project:

| Event | Source | Workflow effect |
|-------|--------|-----------------|
| `levelstack_purchased` | `app/api/webhook/route.ts` (Stripe checkout) | Exits Workflow A |
| `sap_waitlist_joined` | `app/api/sap-waitlist/route.ts` (`/platform/seo` form) | Starts Workflow B |

```bash
PLUNK_SECRET_KEY=sk_...                    # same value as lpd-levelstack
PLUNK_API_URL=https://next-api.useplunk.com
LEVELSTACK_UPGRADE_NOTIFY_SECRET=...       # same value as lpd-levelstack
```

Supabase (`sap_waitlist_signups` table) is the business source of truth for waitlist signups; Plunk is the email audience.

## Upgrade checkout handoff (lpd-redesign — required for paid unlock loop)

Product upgrade links use `getHubUpgradeUrl` with query params:

| Param | Example | Purpose |
|-------|---------|---------|
| `reportId` | UUID | Free snapshot to upgrade — persist in Stripe metadata |
| `planId` | `levelstack-full-report` or `levelstack-strategy-call` | Checkout SKU |
| `source` | `levelstack_report`, `levelstack_email`, `levelstack_print` | Attribution |

**Hub must:**

1. Read `reportId`, `planId`, `source` from product upgrade URLs (`/platform/levelstack?...#pricing`).
2. Persist `reportId` on Stripe Checkout Session / PaymentIntent `metadata`.
3. On `checkout.session.completed`, write `orders` with correct `plan_id`.
4. Success redirect: `{NEXT_PUBLIC_LEVELSTACK_APP_URL}/intake?from=upgrade&reportId={id}` (not only `/account`).
5. POST to product `POST /api/upgrade/notify` with shared secret `LEVELSTACK_UPGRADE_NOTIFY_SECRET` (same value on hub + product Vercel) so payment-received email with magic link fires from webhook.

Product interim fallback: entitlement poll on `/intake?from=upgrade` until `orders` row exists.

## SAP waitlist handoff (lpd-redesign — `/platform/seo`)

LevelStack and nurture emails link to the hub waitlist with query params:

| Param | Example | Purpose |
|-------|---------|---------|
| `reportId` | UUID | Tie signup to LevelStack report; credit requires email + order match |
| `source` | `levelstack_report_credit` | Cohort attribution stored in `sap_waitlist_signups.source` |

**URL pattern:** `/platform/seo?reportId={uuid}&source=levelstack_report_credit#waitlist`

**Hub stores on signup** (`POST /api/sap-waitlist` → Supabase `sap_waitlist_signups`):

| Column | Purpose |
|--------|---------|
| `email` | Waitlist contact |
| `report_id` | From URL when present |
| `sap_credit_eligible` | Server-resolved; email must match completed `levelstack-standard` order |
| `source` | Attribution (`platform_seo`, `levelstack_report_credit`, etc.) |
| `intended_tier` | Solo / Agency / Scale at signup |
| `billing_preference` | monthly / annual |
| `founding_member` | True if signup before 200-member cap |

**Credit security:** Clients cannot set `sapCreditEligible` via API. Eligibility is resolved server-side in `lib/sap-waitlist.ts`.

**Plunk:** Fires `sap_waitlist_joined` with tier, credit flag, founding status → Workflow B.
