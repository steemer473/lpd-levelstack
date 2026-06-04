# ADR 001 — Cross-domain auth (Phase 1)

## Status

Accepted for Phase 1 (interim)

## Context

Hub (`levelplaydigital.com`) and product (`levelstack.*`) share Supabase `auth.users` but run on different origins. Browser cookies do not cross origins by default.

## Decision

- Hub links to product `/intake` via `NEXT_PUBLIC_LEVELSTACK_APP_URL`.
- Product hosts its own `/auth/sign-in` (email/password, same Supabase project).
- Users sign in **on the product origin** after purchase before submitting intake.

## Consequences

- One extra sign-in step after hub checkout (acceptable for v1).
- Future: shared parent-domain cookies, OAuth `redirectTo` product callback only, or magic-link handoff.
