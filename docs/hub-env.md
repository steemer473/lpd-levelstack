# Hub env for LevelStack handoff

Add to `lpd-redesign` (Vercel + `.env.local`):

```bash
# Hub stays on :3000; product app runs on :3001 (see lpd-levelstack package.json dev script)
NEXT_PUBLIC_LEVELSTACK_APP_URL=http://localhost:3001
```

Production (must match product `NEXT_PUBLIC_APP_URL`):

```bash
NEXT_PUBLIC_LEVELSTACK_APP_URL=https://levelstack.levelplaydigital.com
```

Without this variable, hub account sidebar, checkout success, and `/free` redirects will not link to the product app.

## Product app (lpd-levelstack)

| Environment | `NEXT_PUBLIC_APP_URL` |
|-------------|------------------------|
| Local | `http://localhost:3001` |
| Production | `https://levelstack.levelplaydigital.com` |

See [vercel.md](./vercel.md) for full Vercel + Supabase auth redirect checklist.
