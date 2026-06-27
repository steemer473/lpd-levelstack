# GHL LevelStack Nurture Email Templates

Branded HTML templates for **Emails 2–5** of the LevelStack nurture workflow. Email 1 stays on Resend (transactional).

**Figma source:** [LevelStack — Funnel Audit → GHL Email Templates](https://www.figma.com/design/9cDNeop0FbhNQl5XMVOrQ7/LevelStack-%E2%80%94-Funnel-Audit---Optimized-Layouts?node-id=110-128)

**Runbook:** [`docs/operations/ghl-nurture-workflow.md`](../operations/ghl-nurture-workflow.md)

---

## Files

| File | Timing | Subject | When to use |
|------|--------|---------|-------------|
| [`email-02-prospect.html`](email-02-prospect.html) | +4h | What your next prospect already found | All free snapshot contacts |
| [`email-03-competitor.html`](email-03-competitor.html) | +2d | Who's ranking above you right now | When `top_competitor` is populated |
| [`email-03-competitor-fallback.html`](email-03-competitor-fallback.html) | +2d | Who's ranking above you right now | When `top_competitor` is blank |
| [`email-04-finding.html`](email-04-finding.html) | +4d | I didn't know it was there | All contacts |
| [`email-05-sap-bridge.html`](email-05-sap-bridge.html) | +7d | The part your report can't fix for you | All contacts (SAP bridge) |

---

## Hosted assets (hub)

After deploying `lpd-redesign`, assets load from:

| Asset | URL |
|-------|-----|
| White logo | `https://levelplaydigital.com/images/email/level-play-digital-logo-white-400.png` |
| Gradient accent bar | `https://levelplaydigital.com/images/email/gradient-accent-bar.png` |
| Unlock $97 CTA | `https://levelplaydigital.com/images/email/cta-unlock-97.png` |
| SAP waitlist CTA | `https://levelplaydigital.com/images/email/cta-sap-waitlist.png` |

Source files: `lpd-redesign/public/images/email/`

---

## Import into GHL

1. Go to **Marketing → Templates → Create Template**
2. Choose **Custom HTML** (or paste into workflow email step → Custom HTML)
3. Open the matching `.html` file from this folder
4. Copy the full document and paste into GHL
5. Replace merge tokens via GHL picker if syntax differs in your location:
   - `{{ contact.levelstack_report_url }}`
   - `{{ contact.top_competitor }}`
   - `{{ contact.top_finding }}`
   - `{{ unsubscribe_link }}`
6. Set the **subject line** from the table above
7. Configure CTA click actions in the workflow (tags, exit conditions)

### Email 3 conditional

Use one of:

- **Option A:** Two workflow branches — if `top_competitor` is not empty → competitor template; else → fallback template
- **Option B:** Manual QA — send competitor template only when field is populated; use fallback for test contacts without competitor data

---

## Regenerate from code

Templates are generated from [`lib/email/ghl-email-layout.ts`](../../lib/email/ghl-email-layout.ts):

```bash
npx tsx scripts/generate-ghl-email-templates.mjs
```

---

## QA checklist (before go-live)

- [ ] Hub deployed with `/public/images/email/` assets
- [ ] Images load in Gmail, Apple Mail, Outlook (web)
- [ ] Merge fields render in GHL preview with a test contact
- [ ] Email 3 competitor + fallback both tested
- [ ] $97 CTA opens hub upgrade URL with `source=levelstack_email`
- [ ] SAP CTA opens `https://levelplaydigital.com/platform/seo`
- [ ] Unsubscribe link present (GHL replaces `{{ unsubscribe_link }}`)
- [ ] Mobile width ≤ 600px; no horizontal scroll
