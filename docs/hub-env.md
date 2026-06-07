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

## GoHighLevel lead sync

LevelStack syncs intake leads to GHL via server-side API (same location as the hub). Copy these from the **lpd-redesign** Vercel project (or hub `.env.local`):

```bash
GHL_API_KEY=       # same value as hub
GHL_LOCATION_ID=   # same value as hub
```

Set in **lpd-levelstack** Vercel → Production and Preview. Without them, intake still succeeds but leads are not synced (logged as `[ghl]` warnings).
