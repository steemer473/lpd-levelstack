# v0 — Funnel Audit landing page (Variation D · Full Light)

Use a **new v0 chat**. Model: **v0-max** or **v0-pro**.

**Figma source:** [Variation D — Full Light](https://www.figma.com/design/9cDNeop0FbhNQl5XMVOrQ7/LevelStack-%E2%80%94-Funnel-Audit---Optimized-Layouts?node-id=27-15)  
- Linked node `27:15` is the **hero background slice** only.  
- **Build the full page** from canvas **`27:2`** (`8 - Variation D (Full Light)`), nodes `27:5`–`27:400`.  
- `fileKey: 9cDNeop0FbhNQl5XMVOrQ7` · `nodeId: 27:2`

## Attach (only these)

1. **Figma frame** — link above (full canvas `27:2`, not just `27:15`)
2. **`docs/v0/levelstack-v0-design-tokens.css`** — hub/marketing tokens (`--lpd-orange`, `--lpd-blue`, `--lpd-dark`)
3. This file
4. **Live pricing reference** — [levelplaydigital.com/platform/levelstack#pricing](https://levelplaydigital.com/platform/levelstack#pricing) (canonical pricing UI — do not redesign)
5. **Hub repo pricing source** (if v0 has repo access): `components/platform/levelstack-sections.tsx` + `data/levelstackPlans.ts` in **`lpd-redesign`**

## Do NOT attach

- `docs/v0/V0-RULES.md` — that governs the **report UI** (`/reports/[id]`), not this marketing page
- `assets/levelstack-sample-report.html` — legacy v1 layout
- `docs/v0/reports-page-variations.md` — report-page redesign prompts
- Deprecated report PNGs (`levelstack-report-header-v2.png`, etc.)

## What this page is

- **Product:** LevelStack funnel audit marketing / pricing landing page
- **Job:** Convert visitors to free snapshot ($0) or full report ($97) / report+call ($297)
- **Audience:** Small business owners who suspect something is wrong with their online presence
- **Tone:** Premium consultant — clean, light, editorial. **Not** a dark SaaS dashboard
- **Route target:** `app/platform/levelstack/page.tsx` + `components/platform/levelstack-sections.tsx` in **`lpd-redesign`** (hub — same route as [live page](https://levelplaydigital.com/platform/levelstack))

## Visual system (Variation D · Full Light)

- **Background:** pure white `#FFFFFF` page body
- **Text:** dark navy headings (`--lpd-dark` / `#002147`), body `#334155`–`#475569`
- **Accent:** hub brand blue `--lpd-blue` (`#00D4F5`) for primary CTAs, links, top accent bars
- **Secondary CTA:** outlined / ghost buttons for `$97` and `$297`
- **Cards:** white with subtle border `border-slate-200`, light shadow, **4px top accent bar** (blue for free, orange/navy for paid tiers)
- **Badges:** uppercase pill chips — `FREE SNAPSHOT`, `FULL REPORT`, `MOST POPULAR`
- **Section labels:** small uppercase eyebrow chips (`FROM THE FIELD`, `FREE SNAPSHOT — $0`)
- **Left accent stripes:** 4px vertical bar on story/quote cards (blue or slate)
- **Max width:** `1280px` content, `48px` horizontal padding
- **Typography:** Poppins headings, Inter body (match tokens)

**This is NOT the report page.** Do not use flat navy report header, 7-tab bar, or `--rpt-orange` / `--rpt-blue` report tokens here.

## Page sections (top → bottom — match Figma order)

### 1. Hero (`27:15`–`27:85`)
- Centered eyebrow pill: `LevelStack · Level Play Digital`
- Headline (two lines, large): **"What does the internet say about your business?"**
- Subcopy: *Find out before your next prospect does. Start with the free snapshot — no credit card, no account, ready in minutes.*
- **Dual CTAs side by side:**
  - Primary filled: `Get Free Snapshot — $0` → `/free`
  - Secondary outline: `Full Report — $97` → hub pricing URL
- Trust line: `No credit card · Same-day delivery · One-time fee`
- **Report preview mockup** (card below CTAs):
  - Mini header: `LevelStack Report · MC Fitness & Wellness · Atlanta, GA · June 2026` + `Funnel readiness: 42%`
  - **6 mini section tiles** in a row (172×88 each):
    - `01 Search footprint` — FREE badge, `2 critical`, progress bar
    - `02 Social & off-site` — FREE, `3 gaps`
    - `03 Reputation` — FULL REPORT, `1 critical`
    - `04 Revenue funnel` — FULL REPORT, `42% ready`
    - `05 Competitive` — FULL REPORT, `1 win 2 gaps`
    - `06 Action plan` — FULL REPORT, `14 items`
  - Each tile: colored top stripe, tier badge, title, stat, thin progress bar

### 2. From the field (`27:87`–`27:101`)
- Eyebrow: `FROM THE FIELD`
- Heading: **Real findings from real audits.**
- Sub: *Before LevelStack was a product it was a research process we ran manually. These are the patterns we kept finding.*
- **Two story cards** (side by side):
  - **The ad spend problem** — complaint on page one before website; finding type tag
  - **The dissolved partnership** — old co-brokerage sites ranking; finding type tag
- 4px left accent bar on each card

### 3. Two offers (`27:105`–`27:166`)
- Band title: **Two offers. Two different jobs.** + right subline
- **Split 50/50 panels:**
  - **Left — Free Snapshot $0:** question headline, coverage bullets (✓), example finding callout, CTA `Get My Free Snapshot — $0`
  - **Right — Full Report $97:** question headline, "what full report adds" bullets (→), CTAs `Get Full Report — $97` + `Report + Call — $297`

### 4. Six sections intro (`27:167`–`27:170`)
- **Six sections. Three are free. Three unlock with the full report.**
- Right link: `Jump to pricing →` (anchor scroll)

### 5. Six section cards (`27:171`–`27:225`)
- **3×2 grid** of feature cards (384×180)
- Each: number badge `01`–`06`, tier chip (FREE SNAPSHOT / FULL REPORT), title, description
- Copy from Figma metadata (Search Footprint, Social & Off-Site, Reputation & Digital Presence, Revenue Funnel, Competitive Context, Prioritized Action Plan)

### 6. Mid-page CTA band (`27:226`–`27:230`)
- Navy/dark band: *The free snapshot shows the surface. The full report shows the cost.*
- Sub + right button `Get Full Report — $97`

### 7. How it works (`27:232`–`27:256`)
- 4 steps with numbered circles + connecting line:
  1. Start free — 2 minutes
  2. Research runs automatically
  3. Snapshot delivered
  4. Optional: 30-min call

### 8. Good fit / Not ideal (`27:258`–`27:274`)
- Two cards: ✓ good-fit bullets vs ✗ not-ideal bullets

### 9. System boundaries (`27:276`–`27:291`)
- 3 cards: What LevelStack provides · What you provide · What is not included

### 10. Pricing — **reuse existing component** (do not build from Figma)

**Do NOT implement Figma nodes `27:292`–`27:362` as new UI.**  
Reuse the **existing LevelStack pricing block** already live at [levelplaydigital.com/platform/levelstack#pricing](https://levelplaydigital.com/platform/levelstack#pricing).

**Source of truth (in order):**
1. Existing hub component in `lpd-redesign` — extract/render the current pricing section from `components/platform/levelstack-sections.tsx` (plan data from `data/levelstackPlans.ts`)
2. If component is not modular yet, refactor pricing into `<LevelStackPricing />` and import it — **preserve behavior, copy, and checkout wiring**
3. Match the live page exactly — do not invent new tier cards from Figma

**Live pricing spec (must match):**
- Section id: `id="pricing"` (for `Jump to pricing →` anchor)
- Heading: **LevelStack pricing** + subline *Start free. Upgrade when you're ready. No subscription, ever.*
- **3 tiers:** Free Snapshot `$0` · Full Report `$97` (**Most Popular**) · Report + Call `$297`
- Feature lists per tier (free = snapshot features only; paid = full six sections + PDF + automator flags; $297 adds strategy call copy)
- CTAs: `Get Free Snapshot` → product `/free` · `Get Full Report — $97` · `Get Report + Call — $297` → hub checkout
- Footnote: *Not sure which to start with? The free snapshot takes two minutes…*

Figma pricing layout is **reference only** for page rhythm/spacing around the section — not for rebuilding cards.

### 11. FAQ (`27:364`–`27:386`)
- Accordion rows (5 questions) with 4px left accent
- Q1–Q5 copy from Figma (snapshot timing, multiple business names, subscription, after report, vs SEO audit)

### 12. Final CTA (`27:388`–`27:399`)
- Dark footer band, centered headline + 3 CTAs (`$0` / `$97` / `$297`)

## Stack & wiring

```
STACK: Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, lucide-react.
REPO: lpd-redesign (hub) — app/platform/levelstack/page.tsx

CTAs:
  NEXT_PUBLIC_LEVELSTACK_APP_URL/free  → Get Free Snapshot ($0)
  /platform/levelstack#pricing         → in-page anchor
  hub checkout (levelstack-full-report) → $97
  hub checkout (levelstack-strategy-call) → $297

PRICING (required):
  Reuse existing LevelStack pricing from components/platform/levelstack-sections.tsx
  + data/levelstackPlans.ts — same as https://levelplaydigital.com/platform/levelstack#pricing
  Do NOT build new pricing cards from Figma.

COMPONENTS:
  app/platform/levelstack/page.tsx
  components/platform/levelstack-sections.tsx (new Variation D sections + existing pricing import)

Use existing ProductShell only if it matches light layout; otherwise standalone marketing layout.
Reuse Button, Card, Badge, Accordion from shadcn.
No fake APIs, no auth forms on this page.
```

## Paste this prompt

```
Replicate Figma canvas "8 - Variation D (Full Light)" (node 27:2) EXACTLY.
This is the LevelStack FUNNEL AUDIT marketing landing page — NOT the /reports/[id] diagnostic UI.

Follow docs/v0/v0-funnel-audit-variation-d-prompt.md and levelstack-v0-design-tokens.css.
Light/white page. Hub colors (--lpd-dark, --lpd-blue, --lpd-orange). No dark report header. No 7-tab report bar.

Build sections 1–9 and 11–12 from Figma. For pricing (section 10):
→ REUSE the existing pricing component from https://levelplaydigital.com/platform/levelstack#pricing
→ Import from components/platform/levelstack-sections.tsx + data/levelstackPlans.ts (lpd-redesign)
→ Do NOT rebuild $0 / $97 / $297 cards from Figma nodes 27:292–27:362

Build all other sections in order:
1) Hero with dual CTAs + 6-tile report preview mockup
2) From the field — 2 story cards
3) Two offers split panel ($0 vs $97)
4) Six sections intro + 3×2 section grid
5) Mid-page CTA band
6) How it works (4 steps)
7) Good fit / Not ideal
8) System boundaries (3 cards)
9) Pricing — existing hub component (id="pricing")
10) FAQ accordion (5 items)
11) Final CTA footer

"Jump to pricing →" must scroll to #pricing on the reused component.

Use Figma copy verbatim where possible (MC Fitness mock, case studies, section descriptions).
Primary CTA links to /free. Paid CTAs to hub pricing.
Max width 1280px. Cards: white, subtle border, 4px top accent bar, left accent on story cards.
Tier badges: FREE SNAPSHOT (cyan/blue) vs FULL REPORT (navy/orange).

Output: app/platform/levelstack/page.tsx + components/platform/levelstack-sections.tsx
Mobile: stack grids to single column; preserve section order.
```

## If v0 builds the wrong page

Follow-up message:

```
Wrong page type. This is the marketing funnel-audit landing page (Figma 27:2), not the report view.
Re-read v0-funnel-audit-variation-d-prompt.md. White background, hub tokens, pricing + FAQ + hero mockup.
Do NOT use V0-RULES.md report header, navy diagnostic band, or executive summary layout.
```

Pricing-specific follow-up:

```
You rebuilt the pricing section from Figma. Wrong.
Reuse the EXISTING pricing block from https://levelplaydigital.com/platform/levelstack#pricing —
import from components/platform/levelstack-sections.tsx + data/levelstackPlans.ts in lpd-redesign.
Keep id="pricing", three tiers ($0 / $97 / $297), Most Popular on $97, and existing checkout CTAs.
```

## v0 checklist

- [ ] Figma link opens canvas `27:2` (full page)
- [ ] `levelstack-v0-design-tokens.css` attached
- [ ] `V0-RULES.md` **not** attached (report-only)
- [ ] Hero includes 6-tile preview with FREE vs FULL REPORT badges
- [ ] Pricing section reuses live hub component (`#pricing`) — not Figma-built cards
- [ ] CTAs wire to product `/free` and hub checkout for $97 / $297
