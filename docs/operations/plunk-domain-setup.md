# Plunk sending domain setup

Configure a **dedicated marketing subdomain** so nurture sends do not share reputation with transactional Resend mail.

**Sending engine:** Plunk (hosted) delivers all nurture mail. `lpd-levelstack` and `lpd-redesign` only trigger workflows — they do not SMTP-send Emails 2–5 or W1–W4. See [plunk-nurture-workflow.md](./plunk-nurture-workflow.md) § “Where campaigns run”.

---

## Target configuration

| Purpose | Domain | Provider |
|---------|--------|----------|
| Transactional (Email 1, auth, receipts) | `mail.levelplaydigital.com` or Resend default | **Resend** |
| Nurture (Emails 2–5, W1–W4) | `notify.levelplaydigital.com` | **Plunk** |

From address for nurture:

```
notify@notify.levelplaydigital.com
```

Set `PLUNK_FROM_EMAIL` and `PLUNK_FROM_NAME=LevelStack` in lpd-levelstack Vercel env.

---

## DNS records (Plunk dashboard)

1. Log in to [Plunk](https://app.useplunk.com) → **Settings → Domains**.
2. Add domain `notify.levelplaydigital.com`.
3. Add the DNS records Plunk provides (typically):
   - **TXT** — domain verification
   - **CNAME** — DKIM (one or more selectors)
   - **TXT** — SPF (merge with existing SPF if needed; include Plunk/Resend as directed)

### SPF merge note

If `levelplaydigital.com` already has an SPF record for Resend, merge into a single TXT:

```
v=spf1 include:amazonses.com include:_spf.plunk.email ~all
```

Use exact includes from Plunk + Resend docs for your account — do not duplicate `v=spf1`.

---

## Template compliance

All nurture templates are synced as **MARKETING** type with:

- `{{unsubscribeUrl}}` in footer (`lib/email/nurture-email-layout.ts`)
- `subscribed: true` on `levelstack_report_ready` and `sap_waitlist_joined` track calls

Webhook handler: `app/api/webhooks/plunk/route.ts` logs `contact.unsubscribed` to `email_events`.

---

## Pre-launch checks

1. Domain shows **Verified** in Plunk.
2. Send a test MARKETING email from Plunk dashboard to a personal inbox.
3. Run [mail-tester.com](https://www.mail-tester.com) — target 9+/10 before enabling Workflow A.
4. Confirm Resend transactional still sends from its own domain (no cross-contamination).

---

## Rollback

If deliverability issues appear:

1. Pause workflows in Plunk dashboard.
2. Leave Resend Email 1 running (unaffected).
3. Fix DNS/DKIM before re-enabling.
