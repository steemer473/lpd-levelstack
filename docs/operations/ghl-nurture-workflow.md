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

## Step 4 — Email templates (HTML)

**Email 1 is Resend only** — do not duplicate in GHL.

**Design source:** [Figma — GHL Email Templates](https://www.figma.com/design/9cDNeop0FbhNQl5XMVOrQ7/LevelStack-%E2%80%94-Funnel-Audit---Optimized-Layouts?node-id=110-128) (page in LevelStack Funnel Audit file)

**HTML source of truth:** [`docs/ghl/email-templates/`](../ghl/email-templates/) — paste-ready files generated from [`lib/email/ghl-email-layout.ts`](../../lib/email/ghl-email-layout.ts)

Regenerate after copy changes:

```bash
pnpm generate:ghl-emails
```

### Step 4b — Import HTML into GHL

1. **Marketing → Templates → Create Template** (or paste into workflow email step → Custom HTML)
2. Open the matching file from [`docs/ghl/email-templates/`](../ghl/email-templates/)
3. Copy the **full HTML document** and paste into GHL
4. Set the subject line from the table below
5. Confirm merge tokens via GHL picker (syntax may vary by location):
   - `{{ contact.first_name }}`
   - `{{ contact.levelstack_report_url }}`
   - `{{ contact.top_competitor }}`
   - `{{ contact.top_finding }}`
   - `{{ unsubscribe_link }}`
6. Configure CTA click actions in the workflow (see Step 5)

### Hosted assets (hub — deploy `lpd-redesign` first)

| Asset | Production URL |
|-------|----------------|
| Logo | `https://levelplaydigital.com/images/logo.png` |
| Gradient accent bar | `https://levelplaydigital.com/images/email/gradient-accent-bar.png` |
| Unlock $97 CTA button | `https://levelplaydigital.com/images/email/cta-unlock-97.png` |
| SAP waitlist CTA button | `https://levelplaydigital.com/images/email/cta-sap-waitlist.png` |

Source files live in `lpd-redesign/public/images/email/`.

### CTA link pattern

| CTA | href in template | Workflow action on click |
|-----|------------------|--------------------------|
| Unlock Full Report — $97 | `https://levelplaydigital.com/platform/levelstack?source=levelstack_email#pricing` | Tag `paid_levelstack`; remove from nurture |
| Join SAP Waitlist | `https://levelplaydigital.com/platform/seo` | Tag `seo_automator_pro_waitlist` |
| Report links in body | `{{ contact.levelstack_report_url }}` | Opens signed report access URL |

Upgrade links should include `reportId` when a dedicated merge field exists. Until then, the hub upgrade URL with `source=levelstack_email` is the primary $97 CTA; report body links use `levelstack_report_url`.

### Template map

| # | Timing | Subject | HTML file |
|---|--------|---------|-----------|
| 2 | +4h | What your next prospect already found | `email-02-prospect.html` |
| 3 | +2d | Who's ranking above you right now | `email-03-competitor.html` or `email-03-competitor-fallback.html` |
| 4 | +4d | I didn't know it was there | `email-04-finding.html` |
| 5 | +7d | The part your report can't fix for you | `email-05-sap-bridge.html` |

### Email 3 — conditional template

**When `top_competitor` is populated:** use `email-03-competitor.html` (named competitor in highlight callout).

**When `top_competitor` is blank:** use `email-03-competitor-fallback.html` (generic competitor paragraph).

**GHL workflow options:**

- **Branch A:** If custom field `top_competitor` is not empty → send competitor template; else → send fallback template
- **Branch B:** Single template + manual fallback testing only (not recommended for production)

Test with a contact that has no `top_competitor` before going live.

---

### Email 2 — +4 hours (reference copy)

**Subject:** What your next prospect already found

**On CTA click:** Add tag `paid_levelstack`, remove from workflow, move pipeline stage → Purchased (configure in GHL).

---

### Email 3 — +2 days (reference copy)

**Subject:** Who's ranking above you right now

**On CTA click:** Same as Email 2.

---

### Email 4 — +4 days (reference copy)

**Subject:** I didn't know it was there

**On CTA click:** Same as Email 2.

---

### Email 5 — +7 days (reference copy)

**Subject:** The part your report can't fix for you

**On SAP CTA click:** Add tag `seo_automator_pro_waitlist`, enroll SAP waitlist sequence (TBD), remove from this workflow.

---

### Plain-text fallback (archived)

Previous plain-text drafts are superseded by HTML templates above. If a plain-text version is required for a specific client, extract copy from the HTML files or [`COPY_BANK.md`](../../../lpd-planning/COPY_BANK.md) §4.

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
- [ ] Email 3 renders correctly with and without `top_competitor` (use both HTML templates)
- [ ] HTML templates pasted from [`docs/ghl/email-templates/`](../ghl/email-templates/); hosted assets load from hub
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
| [GHL email templates](../ghl/email-templates/README.md) | HTML paste-ready files + asset URLs |
| [FUNNELS_AND_MARKETING.md §4](../../../lpd-planning/FUNNELS_AND_MARKETING.md) | Funnel + CRM architecture |
| [STRATEGY.md](../../../lpd-planning/STRATEGY.md) | Cross-product data flow |
| Hub GHL setup | `lpd-redesign/docs/operations/ghl/ghl-integration.md` |
