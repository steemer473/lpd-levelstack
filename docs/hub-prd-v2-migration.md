# Hub migration checklist — PRD v2 pricing

Apply in **`lpd-redesign`** before public launch. Product repo (`lpd-levelstack`) already recognizes these plan IDs.

## New plan IDs (replace $497 / $694)

| Plan ID | Price | Includes |
|---------|-------|----------|
| `levelstack-free-snapshot` | $0 | Free snapshot (sections 1–3); no Stripe charge — product grants entitlement on email signup |
| `levelstack-full-report` | $97 | Full 6-section report + PDF |
| `levelstack-strategy-call` | $297 | Full report + 30-minute strategy call |

**Legacy IDs** (`levelstack-standard`, `levelstack-review-call`) remain honored in the product app for existing buyers.

## Hub files to update

1. `data/levelstackPlans.ts` — new SKUs, Stripe price IDs, feature lists
2. `lib/valid-plans.ts` — register new plan IDs
3. `app/platform/levelstack/page.tsx` + `components/platform/levelstack-sections.tsx` — hero CTA to free snapshot, pricing table $0 / $97 / $297
4. Checkout — order bump at $97: +$200 strategy call add-on (`levelstack-strategy-call-bump` or line item)
5. `app/api/webhook/route.ts` — ensure `metadata.planId` writes new IDs to `orders`
6. New route: `app/free/page.tsx` — redirect to product app `/free` (`NEXT_PUBLIC_LEVELSTACK_APP_URL/free`, production: `https://levelstack.levelplaydigital.com/free`)

## Marketing copy changes

- Primary CTA: **Get your free snapshot** (not "Get My LevelStack Report — $497")
- "How it works" step 1: complete free snapshot (email required), not purchase first
- Pricing section: three tiers per PRD §2B

## Launch gate

Deploy hub + product in the same window so CTAs, checkout, and `orders.plan_id` values match product entitlements.
