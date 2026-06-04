# Hub env for Phase 1

Add to `lpd-redesign` (Vercel + `.env.local`):

```bash
# Hub stays on :3000; product app runs on :3001 (see lpd-levelstack package.json dev script)
NEXT_PUBLIC_LEVELSTACK_APP_URL=http://localhost:3001
```

Production example:

```bash
NEXT_PUBLIC_LEVELSTACK_APP_URL=https://levelstack.levelplaydigital.com
```

Without this variable, hub account sidebar and checkout success will not show the intake link.
