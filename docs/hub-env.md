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
2. **Report complete** — `syncReportCompleteEnrichment` runs after the report-ready email with `top_competitor`, `top_finding`, `report_tier`, signed report URL, and tag `levelstack_report_ready` (workflow trigger for nurture).

Create custom fields: `pnpm setup:ghl-fields` (from repo root with `.env.local`).

**Finish nurture workflow (Emails 2–5) in GHL UI:** [operations/ghl-nurture-workflow.md](./operations/ghl-nurture-workflow.md)

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
