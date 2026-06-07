# ADR 001 — Cross-domain auth (Phase 1)

## Status

Accepted for Phase 1 (interim); extended for free snapshot (PRD v2)

## Context

Hub (`levelplaydigital.com`) and product (`levelstack.levelplaydigital.com`) share Supabase `auth.users` but run on different origins. Browser cookies do not cross origins by default.

## Decision

- Hub links to product `/intake` via `NEXT_PUBLIC_LEVELSTACK_APP_URL` (`https://levelstack.levelplaydigital.com` in production).
- Product hosts its own `/auth/sign-in` (email/password, same Supabase project).
- Users sign in **on the product origin** after purchase before submitting intake.
- **Free snapshot:** `/free` intake sends a Supabase magic link via Resend. Link redirects to `/auth/callback?next=/reports/{id}` on the product origin; Supabase must allow that URL in **Redirect URLs** (see [vercel.md](../vercel.md)).

## Consequences

- One extra sign-in step after hub checkout (acceptable for v1).
- Free funnel uses magic-link email on product origin; `NEXT_PUBLIC_APP_URL` and Supabase redirect allow list must match.
- Future: shared parent-domain cookies, OAuth `redirectTo` product callback only, or unified hub handoff.
