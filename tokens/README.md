# Design tokens

Single source of truth: `design-tokens.json` (synced from `lpd-redesign`).

Regenerate CSS variables:

```bash
pnpm build:tokens
```

Output: `styles/generated/semantic-root.css` (imported by `app/globals.css`).

LevelStack report colors (`--lpd-*`) and SEO audit bridge (`--seo-brand-*`) are appended in `scripts/build-design-tokens.mjs`.

See `seo-audit-reference.md` for mapping to `seo-audit-nextjs` and [seo.levelplaydigital.com](https://seo.levelplaydigital.com/).
