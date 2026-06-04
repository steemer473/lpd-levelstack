# Vercel deployment (Phase 0)

1. Import this repo as a **new** Vercel project (not `lpd-redesign`).
2. Framework preset: Next.js. Build: `pnpm build`. Install: `pnpm install`.
3. Set environment variables (Production + Preview):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | e.g. `https://levelstack.levelplaydigital.com` |
| `NEXT_PUBLIC_HUB_URL` | `https://levelplaydigital.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as hub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as hub |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; same project |

Do **not** add Stripe keys to this project.

4. In **hub** (`lpd-redesign`), set `NEXT_PUBLIC_LEVELSTACK_APP_URL` to this deployment URL (Phase 1 account CTA).
