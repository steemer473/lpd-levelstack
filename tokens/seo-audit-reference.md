# SEO audit app token reference

Cross-repo mapping for [seo.levelplaydigital.com](https://seo.levelplaydigital.com/) styling.

## seo-audit-nextjs (`/Sites/seo-audit-nextjs`)

| Token | Value | LevelStack CSS var |
|-------|--------|-------------------|
| `brandDark` | `#0B0F19` | `--seo-brand-dark` |
| `brandBlue` | `#2563EB` | `--seo-brand-blue` |
| `brandOrange` | `#F97316` | `--seo-brand-orange` |
| `brandLight` | `#EFF6FF` | `--seo-brand-light` |

**Files:** `apps/web/app/globals.css`, `apps/web/tailwind.config.js`

**Utilities:** `.gradient-blue-orange` → `135deg, #2563EB → #F97316`

**Layout pattern:** `bg-gradient-to-br from-brandDark via-brandDark to-blue-950` + white `shadow-2xl` form card.

## seo-foundation-audit (production SEO tool)

Uses inline HSL aligned with hub tokens:

- `--accent-orange`: `hsl(14, 100%, 60%)` (#FF6633 family)
- `--accent-blue`: `hsl(193, 100%, 50%)` (#00D4F5 family)
- Hero background: `hsl(210, 59.18%, 37.37%)` → hub `--hero-bg`
- `.gradient-text`: cyan → orange (hub `--effect-gradient-brand-text`)

**Components to mirror:** `navigation.tsx` (glass nav), `hero-header.tsx`, `audit-form.tsx` (elevated card).

## LevelStack report tokens

Report shell uses `--lpd-*` (sample HTML / brief §10.3) — separate from SEO audit marketing chrome.
