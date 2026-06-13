# Design system (LevelStack product app)

Aligned with **lpd-redesign** / [levelplaydigital.com](https://levelplaydigital.com).

## Tokens

- Source: `tokens/design-tokens.json` (hub copy)
- Build: `pnpm build:tokens` → `styles/generated/semantic-root.css`
- LevelStack report aliases: `--lpd-dark`, `--lpd-orange`, `--lpd-blue`, severity colors

## Typography

- Body: Inter (`lib/fonts.ts`)
- Headings: Poppins
- Mono: Roboto Mono

## Layout

- `components/layout/product-shell.tsx` — header (logo + nav), footer, max-width main
- `components/brand/levelstack-logo.tsx` — hub SVG wordmark

## Components

- shadcn `radix-vega` in `components/ui/`
- Primary CTAs: `Button variant="brand"` (orange gradient, hub `.btn-primary`)
- Report UI: `bg-lpd-dark`, `text-lpd-orange`, etc. via `@theme` + `lib/report/display-helpers.ts`

## Report visual reference (Figma)

- Figma: [audit-report frame 4:4](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4) — canonical layout (deprecated: v2 PNGs)
- Styles: `styles/report-final-design.css` (report-scoped `--rpt-*`; header uses `--lpd-dark` `#002147`)
- Implementation: `components/report/report-header.tsx`, `executive-summary-v2.tsx`
- Legacy `assets/levelstack-sample-report.html` — copy tone only; v1 layout, not for design generation

## SEO audit alignment

Marketing chrome follows [seo.levelplaydigital.com](https://seo.levelplaydigital.com/) patterns:

- Token map: `tokens/seo-audit-reference.md`
- Utilities: `styles/seo-audit-utilities.css` (`.bg-seo-hero`, `.bg-lpd-hero`, `.form-panel`, `.gradient-blue-orange`)
- Components: `glass-navigation.tsx`, `audit-hero.tsx`, `form-panel.tsx`

`seo-audit-nextjs` uses `#0B0F19` / `#2563EB` / `#F97316` → `--seo-brand-*`. Production SEO tool uses hub `--hero-bg` navy hero (same as `audit-hero` variant `navy`).

## Syncing with hub

When hub tokens change, copy `tokens/design-tokens.json` and run `pnpm build:tokens`.

Reference hub: `styles/tailwind.css`, `app/styleguide/page.tsx`, `components/ui/page-section.tsx`.
