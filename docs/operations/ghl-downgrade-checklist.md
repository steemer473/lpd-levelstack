# GHL plan downgrade checklist

After moving nurture to Plunk, downgrade GHL from **SaaS Pro ($497)** to **Unlimited ($297)** or **Starter ($97)** while keeping communications features.

---

## Keep (required)

| Feature | Env / config |
|---------|----------------|
| Chat widget | `NEXT_PUBLIC_GHL_CHAT_WIDGET_ID` on hub |
| AI bot / conversation | GHL location settings |
| A2P SMS | GHL phone + compliance |
| Support inbox | GHL conversations |

---

## Remove / do not build

| Item | Action |
|------|--------|
| GHL Workflow A (Emails 2–5) | **Never build** — Plunk Workflow A |
| GHL Workflow B (W1–W4) | **Never build** — Plunk Workflow B |
| Nurture trigger tags | App no longer writes `levelstack_report_ready*` |
| Waitlist tag automation | Replaced by `POST /api/sap-waitlist` + Plunk |

---

## App changes (already shipped)

- `buildReportCompleteTags()` returns `["levelstack"]` only
- `GHL_SYNC_ENABLED=false` skips GHL upsert entirely (optional)
- Hub contact form → GHL unchanged (`app/api/contact/route.ts`)

---

## Manual steps in GHL admin

1. **Cancel or downgrade** SaaS Pro to Unlimited or Starter.
2. Confirm chat widget still loads on `levelplaydigital.com`.
3. Confirm SMS A2P registration remains active.
4. Delete any draft nurture workflows if created during earlier sprint.
5. Remove unused automation tags from documentation (optional cleanup in GHL).

---

## Cost expectation

| Plan | Monthly | Fits |
|------|---------|------|
| Starter | ~$97 | Chat + SMS + inbox only |
| Unlimited | ~$297 | Higher SMS/contact limits |

Nurture email volume moves to Plunk (pay-per-send tier).
