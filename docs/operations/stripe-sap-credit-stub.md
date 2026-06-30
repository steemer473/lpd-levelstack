# Stripe SAP credit coupon — implementation stub

**Policy:** [`lpd-planning/SAP_CREDIT_POLICY.md`](../../../lpd-planning/SAP_CREDIT_POLICY.md)

## At SAP public launch

1. Create Stripe coupon: `$97 off first invoice`, duration `once`, id `SAP_ASSESSMENT_CREDIT_97`
2. In SAP checkout route, read `sapCreditEligible` from:
   - Hub order metadata (`orders.metadata` from webhook)
   - Or GHL `levelstack_sap_credit_eligible` via API lookup
3. Auto-apply promotion code when eligible

## Hub metadata (shipped)

Checkout session metadata on LevelStack plans:

- `sapCreditEligible`: `"true"` for `levelstack-standard` ($97)
- `levelstackPaidAmount`: `"97"` or `"297"`

Webhook: `app/api/webhook/route.ts` persists session metadata to `orders`.

## Manual fulfillment (until coupon live)

See SAP_CREDIT_POLICY.md Phase 1.
