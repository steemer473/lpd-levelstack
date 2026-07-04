# Plunk integration — manual test plan

**Scope:** LevelStack nurture (Workflow A), SAP waitlist (Workflow B), purchase exit, analytics webhooks, and deliverability.  
**Runbook:** [plunk-nurture-workflow.md](./plunk-nurture-workflow.md) · **Domain:** [plunk-domain-setup.md](./plunk-domain-setup.md)

**Tester:** _______________ · **Date:** _______________ · **Environment:** Production / Staging

---

## Prerequisites

### Test accounts

| Item | Notes |
|------|-------|
| Test email inbox | Personal Gmail/Apple — not `admin@levelplaydigital.com` |
| Stripe test card | `4242 4242 4242 4242` if testing checkout in test mode |
| Plunk dashboard access | [app.useplunk.com](https://app.useplunk.com) |
| Supabase dashboard | Shared project `lppmbgqsovtfbpbvjvxi` |

### Vercel env (Plunk only)

**lpd-levelstack**

- [ ] `PLUNK_SECRET_KEY`
- [ ] `PLUNK_API_URL` = `https://next-api.useplunk.com`
- [ ] `PLUNK_WEBHOOK_SECRET`

**lpd-redesign (hub)**

- [ ] `PLUNK_SECRET_KEY` (same as levelstack)
- [ ] `PLUNK_API_URL` = `https://next-api.useplunk.com`

**Both** (if not already set)

- [ ] `LEVELSTACK_UPGRADE_NOTIFY_SECRET` (matching value)

### Plunk dashboard state

| Check | Expected |
|-------|----------|
| Domain `notify.levelplaydigital.com` | **Verified** |
| Nurture Workflow A | Enabled — ID `8ff31129-a57b-4d61-b2e8-16dcd10c40d7` |
| Waitlist Workflow B | Enabled — ID `4a5e6a98-4df7-42d2-af24-aae9e1f8d0ec` |
| Analytics workflows (5) | Enabled — see [analytics-workflow-ids.json](../plunk/analytics-workflow-ids.json) |
| No duplicate workflows | Only **one** enabled workflow per trigger event |
| Templates synced | 9 MARKETING templates (5 nurture + 4 waitlist) |

### Deployments

- [ ] Latest `lpd-levelstack` deployed (webhook handler with `Authorization: Bearer` support)
- [ ] Latest `lpd-redesign` deployed (waitlist + Stripe Plunk track)

---

## Section 1 — Deliverability (Phase 0 gate)

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 1.1 | Plunk → Settings → Domains → `notify.levelplaydigital.com` | Status **Verified** (DKIM green) | |
| 1.2 | Send test MARKETING email from Plunk dashboard to test inbox | Received; From = `notify@notify.levelplaydigital.com` | |
| 1.3 | Check raw headers (Gmail → Show original) | SPF **pass**, DKIM **pass** | |
| 1.4 | Optional: [mail-tester.com](https://www.mail-tester.com) | Score **9+/10** | |
| 1.5 | Trigger Resend Email 1 (free snapshot report ready) | Received from Resend domain; **not** from Plunk notify domain | |

**Fail action:** Fix DNS per [plunk-domain-setup.md](./plunk-domain-setup.md) before testing workflows.

---

## Section 2 — Webhook endpoint smoke test

Verify production endpoint before relying on analytics workflows.

```bash
# Should return 401 (secret required)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://levelstack.levelplaydigital.com/api/webhooks/plunk \
  -H "Content-Type: application/json" \
  -d '{"type":"email.open","email":"test@example.com","data":{}}'
```

Expected: `401`

```bash
# Replace YOUR_SECRET with PLUNK_WEBHOOK_SECRET from Vercel
curl -s -X POST https://levelstack.levelplaydigital.com/api/webhooks/plunk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{"type":"email.open","email":"manual-test@example.com","data":{"emailId":"test-manual-001"}}'
```

Expected: `{"received":true}`

**Supabase check** (Table Editor → `email_events` or SQL):

```sql
SELECT contact_email, event_type, plunk_event_id, occurred_at
FROM email_events
WHERE contact_email = 'manual-test@example.com'
ORDER BY occurred_at DESC
LIMIT 5;
```

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 2.1 | Unauthenticated POST | HTTP `401` | |
| 2.2 | Authenticated POST | HTTP `200`, `received: true` | |
| 2.3 | Row in `email_events` | `event_type` = `email.open` | |

---

## Section 3 — Workflow A trigger (free snapshot → nurture)

**Goal:** Report ready fires `levelstack_report_ready` and starts Workflow A.

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 3.1 | Submit free snapshot intake at `https://levelstack.levelplaydigital.com` using **test email** | Intake succeeds | |
| 3.2 | Wait for report pipeline to complete | Report status = `ready` | |
| 3.3 | Check test inbox | **Email 1** received (Resend — report ready / magic link) | |
| 3.4 | Plunk → Contacts → search test email | Contact exists; `subscribed` = true | |
| 3.5 | Plunk → Contact timeline / Events | `levelstack_report_ready` event logged | |
| 3.6 | Plunk → Workflows → Workflow A → Executions | New execution for test contact (may be waiting on +4h delay) | |
| 3.7 | Vercel logs (`lpd-levelstack`) | No `[plunk] nurture track failed` errors | |

**Personalization check** (Plunk contact data):

- [ ] `firstName` populated
- [ ] `reportUrl` populated
- [ ] `topCompetitor` / `topFinding` present when report has them

**Accelerated email test (optional):** In Plunk dashboard, open Workflow A execution and confirm step graph is wired: Trigger → 4h delay → Email 2 → … → Email 5. For same-day verification, temporarily reduce the first delay in dashboard or send a manual test email from the Email 2 template.

---

## Section 4 — Workflow A exit (purchase stops nurture)

**Goal:** `$97` checkout fires `levelstack_purchased` and exits Workflow A.

**Setup:** Use the same test email from Section 3 (active Workflow A execution).

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 4.1 | From report, click unlock / upgrade CTA → hub checkout | Lands on `levelplaydigital.com` cart/checkout with `reportId` in URL/metadata | |
| 4.2 | Complete Stripe checkout (test or live per environment) | Payment succeeds | |
| 4.3 | Plunk → Contact timeline | `levelstack_purchased` event logged | |
| 4.4 | Plunk → Workflow A → Executions | Execution **exited** or cancelled (not still scheduled for Emails 2–5) | |
| 4.5 | Hub Vercel logs | No `Error tracking LevelStack purchase in Plunk` | |
| 4.6 | Wait past next scheduled nurture delay | **No** Email 2 from Plunk nurture sequence | |

**Regression:** Confirm `orders` row exists in Supabase for the test email/report.

---

## Section 5 — Workflow B (SAP waitlist)

**Goal:** Hub waitlist form writes Supabase row and fires `sap_waitlist_joined`.

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 5.1 | Open `https://levelplaydigital.com/platform/seo` | Waitlist form visible; tier picker + founding counter | |
| 5.2 | Submit with **new test email** (no prior $97 order) | Success message; `sap_credit_eligible = false` | |
| 5.3 | Supabase → `sap_waitlist_signups` | Row with `email`, `intended_tier`, `billing_preference`, `founding_member`, `source` | |
| 5.4 | Submit from LevelStack report bridge URL with `?reportId={uuid}&source=levelstack_report_credit` | Page shows credit hint; form passes `reportId` | |
| 5.5 | Submit with **Action Roadmap buyer email** (same as completed $97 order) | `sap_credit_eligible = true` | |
| 5.6 | Submit with `reportId` but **different email** than order owner | `sap_credit_eligible = false` (credit not stealable) | |
| 5.7 | Plunk → Contacts → test email | Contact exists | |
| 5.8 | Plunk → Contact timeline | `sap_waitlist_joined` event with tier + credit flags | |
| 5.9 | Plunk → Workflow B → Executions | New execution started (when credit-eligible, if branch configured) | |
| 5.10 | Hub Vercel logs | No `[sap-waitlist] plunk track failed` | |

**Credit eligibility:** Resolved server-side only. Workflow B trigger uses `sapCreditEligible: true` from Plunk event payload.

---

## Section 6 — Analytics webhooks (live email events)

**Goal:** Plunk analytics workflows POST to levelstack → `email_events`.

Use a real nurture or waitlist email (or Plunk dashboard test send to subscribed contact).

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 6.1 | Receive a Plunk MARKETING email (Email 2+ or waitlist W1+) | Email in inbox | |
| 6.2 | Open email | — | |
| 6.3 | Click a link in email | — | |
| 6.4 | Supabase `email_events` for test email | Rows for `email.delivery`, `email.open`, `email.click` (may take 1–2 min) | |
| 6.5 | Plunk → Analytics workflow executions | Webhook step completed (not failed) | |

```sql
SELECT event_type, campaign_step, plunk_event_id, occurred_at
FROM email_events
WHERE contact_email = 'YOUR_TEST_EMAIL'
ORDER BY occurred_at DESC;
```

---

## Section 7 — Unsubscribe

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 7.1 | Click **Unsubscribe** in footer of Plunk nurture email | Lands on Plunk unsubscribe page | |
| 7.2 | Plunk → Contact | `subscribed` = false | |
| 7.3 | Plunk → Contact timeline | `contact.unsubscribed` event | |
| 7.4 | Supabase `email_events` | Row with `event_type` = `contact.unsubscribed` | |
| 7.5 | Trigger another nurture event for same email | **No** new MARKETING sends | |

---

## Section 8 — Negative / edge cases

| # | Scenario | Expected | ✓ |
|---|----------|----------|---|
| 8.1 | Duplicate enabled Workflow A in Plunk | Only one should exist; if two, contacts get duplicate emails | |
| 8.2 | Hub `PLUNK_SECRET_KEY` mismatch vs levelstack | Track calls fail; events missing in Plunk timeline | |
| 8.3 | Missing `PLUNK_WEBHOOK_SECRET` on Vercel | Webhook returns `401`; no `email_events` rows | |
| 8.4 | Webhook POST without `Authorization` header | HTTP `401` | |
| 8.5 | Waitlist honeypot field filled (`website`) | API returns success but does **not** insert row | |
| 8.6 | Waitlist rate limit (>5 requests / 10 min) | HTTP `429` | |

---

## Section 9 — GHL mirror (optional)

Only if `GHL_SYNC_ENABLED=true` on levelstack.

| # | Step | Pass criteria | ✓ |
|---|------|---------------|---|
| 9.1 | After report ready | GHL contact has tag `levelstack` only (no nurture trigger tags) | |
| 9.2 | GHL custom fields | `top_competitor`, `top_finding`, `report_tier`, report URL populated | |
| 9.3 | Hub chat widget | Still loads on `levelplaydigital.com` | |

---

## Sign-off checklist

| Area | Status |
|------|--------|
| Domain verified + deliverability acceptable | ☐ Pass ☐ Fail |
| Email 1 (Resend) + Workflow A trigger | ☐ Pass ☐ Fail |
| Purchase exits Workflow A | ☐ Pass ☐ Fail |
| Waitlist → Workflow B | ☐ Pass ☐ Fail |
| Analytics → `email_events` | ☐ Pass ☐ Fail |
| Unsubscribe flow | ☐ Pass ☐ Fail |
| No duplicate Plunk workflows | ☐ Pass ☐ Fail |

**Tester sign-off:** _______________ · **Date:** _______________

**Notes / blockers:**

```
```

---

## Quick reference

| Event | Fired by | Workflow |
|-------|----------|----------|
| `levelstack_report_ready` | `lpd-levelstack` pipeline | A — Emails 2–5 |
| `levelstack_purchased` | Hub Stripe webhook | A exit |
| `sap_waitlist_joined` | Hub `POST /api/sap-waitlist` | B — W1–W4 |
| `email.delivery` / `open` / `click` | Plunk system | Analytics → webhook |
| `contact.unsubscribed` | Plunk unsubscribe | Analytics → webhook |

| Log prefix | Repo |
|------------|------|
| `[plunk] nurture track failed` | levelstack |
| `[plunk] purchase track failed` | levelstack |
| `Error tracking LevelStack purchase in Plunk` | hub |
| `[sap-waitlist] plunk track failed` | hub |
| `[plunk-webhook] insert failed` | levelstack |
