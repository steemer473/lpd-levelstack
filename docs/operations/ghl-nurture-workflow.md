# GHL nurture workflow — finish-later runbook

**Status:** App-side report-complete enrichment is **shipped**. Custom fields can be created via API. **Emails 2–5 and workflow logic must be built in the GHL UI** (workflows cannot be created via API).

**Copy source of truth:** [`lpd-planning/COPY_BANK.md`](../../../lpd-planning/COPY_BANK.md) §4  
**Architecture:** [`lpd-planning/FUNNELS_AND_MARKETING.md`](../../../lpd-planning/FUNNELS_AND_MARKETING.md) §4

---

## What is already done (code)

When a report reaches `status = ready`, the pipeline:

1. Sends **Email 1** via Resend (transactional report delivery + signed access link).
2. Calls `syncReportCompleteEnrichment()` — GHL upsert with report-ready fields and tags.

| Piece | Repo | Status |
|-------|------|--------|
| Report-complete GHL upsert | `lib/ghl/sync-levelstack-lead.ts` | Shipped |
| Field key mapping | `lib/ghl/field-mapping.ts` | Shipped |
| Pipeline hook | `lib/pipeline/run-report-pipeline.ts` | Shipped |
| Custom field setup script | `scripts/setup-ghl-levelstack-fields.mjs` | Shipped |
| Unit tests | `lib/ghl/sync-levelstack-lead.test.ts` | Shipped |

### Two-phase GHL sync

| Phase | When | Function | Tags |
|-------|------|----------|------|
| **Intake** | Form submit (free or paid) | `syncFreeSnapshotLead` / `syncPaidIntakeLead` | `levelstack`, `levelstack_free_snapshot` or `levelstack_paid_intake` |
| **Report complete** | Pipeline finishes | `syncReportCompleteEnrichment` | `levelstack`, `levelstack_report_ready`, `levelstack_report_ready_{tier}` |

**Do not** enroll nurture on intake alone — competitor-dependent copy needs report-complete data.

---

## Step 1 — Custom fields (API or manual)

### Option A — Run the setup script (recommended)

From `lpd-levelstack`:

```bash
pnpm setup:ghl-fields
# or: node scripts/setup-ghl-levelstack-fields.mjs --from-local
# dry run: add --dry-run
```

Requires `GHL_API_KEY` and `GHL_LOCATION_ID` in `.env.local` (same location as hub).

### Option B — Create manually in GHL

Settings → Custom Fields → Contact. Field **names** must match (GHL derives keys from names):

| Display name | API key | Populated when |
|--------------|---------|----------------|
| Website URL | `website_url` | Intake |
| Intake Source | `intake_source` | Intake |
| Geo Focus | `geo_focus` | Paid intake |
| LevelStack Report URL | `levelstack_report_url` | Intake + report complete (signed access URL when available) |
| Primary Service | `primary_service` | Paid intake |
| Purchase Motivation | `purchase_motivation` | Paid intake |
| Market City | `market_city` | Intake (optional) |
| Top Competitor | `top_competitor` | Report complete — `meta.upgradeTeasers.previewCompetitor.domain` |
| Top Finding | `top_finding` | Report complete — pipeline audit signal or `executiveSummary.criticalIssue` |
| Report Tier | `report_tier` | Report complete — `free_snapshot`, `full_report`, or `strategy_call` |

### Merge fields in GHL emails

After fields exist, use GHL’s contact custom-field merge picker. Keys above map to merge tokens (typically `{{ contact.top_competitor }}`, `{{ contact.levelstack_report_url }}`, etc. — confirm in GHL email builder for your location).

---

## Step 2 — Create tags (if missing)

Create these contact tags in GHL before building the workflow:

| Tag | Purpose |
|-----|---------|
| `levelstack` | Product identifier (applied by app) |
| `levelstack_free_snapshot` | Intake — free tier |
| `levelstack_paid_intake` | Intake — paid tier |
| `levelstack_report_ready` | **Workflow entry trigger** (applied by app on report complete) |
| `levelstack_report_ready_free_snapshot` | Tier-specific (optional segmentation) |
| `levelstack_report_ready_full_report` | Paid tier at report ready |
| `levelstack_report_ready_strategy_call` | Strategy-call tier at report ready |
| `paid_levelstack` | Exit nurture — converted to $97+ |
| `seo_automator_pro_waitlist` | Exit nurture — SAP waitlist interest |

Tags `levelstack_report_ready*` are written by the app; create `paid_levelstack` and `seo_automator_pro_waitlist` for workflow exits.

---

## Step 3 — Build the nurture workflow (GHL UI)

Workflows **must** be built in GoHighLevel. There is no supported API for creating email templates + multi-step nurture in one call.

### Workflow settings

| Setting | Value |
|---------|-------|
| **Name** | LevelStack Nurture — Emails 2–5 |
| **Trigger** | Contact Tag Added → `levelstack_report_ready` |
| **Re-entry** | Off (one sequence per contact) |

### Global exit conditions (add at workflow level)

Remove contact from workflow when **any** of:

- Tag `paid_levelstack` is added
- Tag `seo_automator_pro_waitlist` is added (after Email 5 SAP CTA — see Step 4)

Optional: skip enrollment when `report_tier` = `full_report` or `strategy_call` if you do not want to upsell paid buyers (product decision — default: still send SAP bridge on Email 5 only, skip Emails 2–4 upgrade pitch).

### Step sequence

```
Trigger: tag levelstack_report_ready
  → Wait 4 hours
  → Send Email 2
  → Wait 2 days
  → Send Email 3
  → Wait 2 days   (cumulative +4 days from Email 2)
  → Send Email 4
  → Wait 3 days   (cumulative +7 days from Email 2)
  → Send Email 5
  → End
```

Timing aligns with [COPY_BANK §4](../../../lpd-planning/COPY_BANK.md): +4h, +2d, +4d, +7d from report ready.

---

## Step 4 — Email templates (paste-ready)

**Email 1 is Resend only** — do not duplicate in GHL.

Replace merge tokens with GHL picker values. Upgrade links must include `reportId` — use `levelstack_report_url` (app sends signed access URL) or build hub upgrade URL: `https://levelplaydigital.com/platform/levelstack?reportId={id}&source=levelstack_email#pricing` if you add a separate merge field later.

### Email 2 — +4 hours

**Subject:** What your next prospect already found

**Body (draft):**

```
Before someone calls you, they search your name.

They check reviews, compare options, and decide whether you look credible — often in under a minute.

Your LevelStack snapshot shows what they see. The gaps are not always obvious from inside the business.

Open your snapshot:
{{ contact.levelstack_report_url }}

If you want the full diagnostic — competitive rankings, reputation depth, and a prioritized action plan — unlock the Full Report for $97.

[Unlock Full Report — $97]
→ Link: hub upgrade URL with reportId + source=levelstack_email

— LevelStack Team
```

**On CTA click:** Add tag `paid_levelstack`, remove from workflow, move pipeline stage → Purchased (configure in GHL).

---

### Email 3 — +2 days

**Subject:** Who's ranking above you right now

**Body (draft):**

```
Hi,

One name keeps showing up when prospects compare options in your market:

{{ contact.top_competitor }}

That gap is traffic going somewhere else. Every day it stays that way, someone who could have found you found them instead.

Your snapshot surfaces this pattern. The Full Report breaks down exactly where you stand and what to fix first.

Open your snapshot:
{{ contact.levelstack_report_url }}

[Unlock Full Report — $97]

— LevelStack Team
```

**Fallback when `top_competitor` is blank:** Use this paragraph instead of the named block:

```
A competitor in your market is capturing search visibility you could be earning.

That gap is traffic going somewhere else. Every day it stays that way, someone who could have found you found them instead.
```

Test with a contact that has no `top_competitor` before going live.

**On CTA click:** Same as Email 2.

---

### Email 4 — +4 days

**Subject:** I didn't know it was there

**Body (draft):**

```
Hi,

A business owner ran a LevelStack report and found something they had not thought about in years — an old partnership page, a former co-listing, or outdated credentials still ranking on page one.

It was not malicious. It was just still indexed — and prospects do not know the backstory.

"I'll deal with it later" is how small issues become expensive ones.

Your snapshot already flagged what matters:
{{ contact.top_finding }}

See the full picture in your report:
{{ contact.levelstack_report_url }}

[Unlock Full Report — $97]

— LevelStack Team
```

**On CTA click:** Same as Email 2.

---

### Email 5 — +7 days

**Subject:** The part your report can't fix for you

**Body (draft):**

```
Hi,

LevelStack gives you a snapshot — what the internet shows about your business today.

Search results change. Technical issues stack up quietly. The work in your action plan takes time; the technical layer does not have to stay manual.

SEO Automator Pro monitors the technical foundation continuously so visibility does not slip between audits.

Join the SEO Automator Pro waitlist at founding member pricing:
→ https://levelplaydigital.com/platform/seo

Your report (reference):
{{ contact.levelstack_report_url }}

— LevelStack Team
```

**On SAP CTA click:** Add tag `seo_automator_pro_waitlist`, enroll SAP waitlist sequence (TBD), remove from this workflow.

---

## Step 5 — Conditional logic summary

| Event | Action |
|-------|--------|
| Clicks any $97 CTA (Emails 2–4) | Tag `paid_levelstack`; remove from nurture; pipeline → Purchased; post-purchase sequence TBD |
| Clicks SAP CTA (Email 5) | Tag `seo_automator_pro_waitlist`; SAP waitlist sequence |
| Contact already has `paid_levelstack` at trigger | Do not enroll (add workflow filter) |

---

## Step 6 — QA checklist

Before turning the workflow live:

- [ ] Custom fields exist; `pnpm setup:ghl-fields` reports no missing keys
- [ ] Run one free snapshot end-to-end in production (or staging location)
- [ ] Confirm contact receives tag `levelstack_report_ready` after report completes
- [ ] Confirm `top_competitor`, `top_finding`, `report_tier`, `levelstack_report_url` populated on contact record
- [ ] Email 3 renders correctly with and without `top_competitor`
- [ ] Upgrade CTAs resolve to hub with `reportId` and open checkout
- [ ] `$97` click adds `paid_levelstack` and stops workflow
- [ ] SAP CTA adds `seo_automator_pro_waitlist`
- [ ] Intake contact name was not unintentionally overwritten (see Known quirks)

### Test contact inspection (GHL)

After a test report completes, open the contact and verify:

```
Tags: levelstack, levelstack_free_snapshot, levelstack_report_ready, levelstack_report_ready_free_snapshot
top_competitor: (domain, e.g. modomodoagency.com)
top_finding: (non-empty string)
report_tier: free_snapshot
levelstack_report_url: https://levelstack.levelplaydigital.com/reports/{id}/access?token=...
```

---

## Known quirks (verify in GHL)

1. **Contact name on report-complete upsert** — `syncReportCompleteEnrichment` currently sends placeholder name `"LevelStack Report Ready"`. This may overwrite the business name set at intake. Fix in app if GHL PATCH replaces name fields; until then, confirm behavior in your location.
2. **Tag merge on PATCH** — GHL contact updates may **replace** the full tag list rather than merge. Verify intake tags (`levelstack_free_snapshot`) persist after report-complete sync; adjust app to send combined tags if GHL clears them.
3. **Paid tier nurture** — Contacts who purchase before report completes may already be `full_report`. Decide whether Emails 2–4 should be suppressed via `report_tier` workflow filter.

---

## Environment

Same as intake sync — set on **lpd-levelstack** Vercel (Production + Preview):

```bash
GHL_API_KEY=
GHL_LOCATION_ID=
```

See [hub-env.md](../hub-env.md).

---

## Related docs

| Doc | Role |
|-----|------|
| [free-snapshot-workflow.md](../free-snapshot-workflow.md) | End-to-end snapshot flow + GHL summary |
| [COPY_BANK.md §4](../../../lpd-planning/COPY_BANK.md) | Approved subjects and messaging |
| [FUNNELS_AND_MARKETING.md §4](../../../lpd-planning/FUNNELS_AND_MARKETING.md) | Funnel + CRM architecture |
| [STRATEGY.md](../../../lpd-planning/STRATEGY.md) | Cross-product data flow |
| Hub GHL setup | `lpd-redesign/docs/operations/ghl/ghl-integration.md` |
