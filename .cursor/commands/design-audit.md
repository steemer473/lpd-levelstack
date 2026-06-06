# Name: Design Consistency Audit
# Description: Comprehensive cross-page audit for design token compliance, accessibility (WCAG 2.1 AA), and performance patterns. Run periodically or before any major release.

**Instructions for the Agent:**

You are performing a full design consistency and quality audit for the **LevelStack** Next.js product app. Work through each phase sequentially and produce a structured report at the end.

---

## PHASE 1 — DISCOVER ALL PAGES AND COMPONENTS

1. Scan `app/` recursively for all `page.tsx` files. List each unique route (e.g., `/`, `/intake`, `/intake/complete`, `/auth/sign-in`, `/purchase-required`, `/reports/[reportId]`, `/reports/[reportId]/print`).
2. Scan `components/` recursively for all `.tsx` files. Group by folder (e.g., `components/ui/`, `components/layout/`, `components/report/`, `components/intake/`, `components/marketing/`).
3. Read `app/globals.css` and `styles/generated/semantic-root.css` to extract CSS custom property tokens (`:root`, `@theme`, `--lpd-*`, `--seo-brand-*`).
4. Read `tokens/design-tokens.json` and `docs/design-system.md` for token sources and conventions.
5. Read `lib/fonts.ts` to confirm `next/font` usage (Inter, Poppins, Roboto Mono).

---

## PHASE 2 — DESIGN TOKEN AUDIT

For each page and component file found in Phase 1, scan the source code and flag any violations of these rules:

### 2a — Hardcoded Color Violations
Search for patterns that indicate hardcoded colors:
- `style={{ color:` with hex, rgb, or bare hsl values (not CSS variables)
- `style={{ backgroundColor:` with hardcoded values
- Tailwind arbitrary color values: `text-[#...]`, `bg-[#...]`, `border-[#...]`
- Named Tailwind palette classes that bypass tokens: `text-slate-*`, `text-gray-*`, `text-zinc-*`, `bg-slate-*`, `bg-gray-*`, `text-blue-*` (unless mapped in `@theme`)
- Report UI should use `--lpd-*` / `--rpt-*` / semantic tokens per `styles/report-final-design.css` and `docs/design-system.md`
- Exception: values inside generated token files or documented reference assets

### 2b — Typography Violations
Search for:
- Raw `font-family` in style props instead of `font-sans`, `font-heading`, or `font-mono`
- `font-[...]` arbitrary Tailwind values
- Google Fonts `<link>` tags (must use `next/font` via `lib/fonts.ts`)

### 2c — Spacing/Radius Violations
Search for:
- `rounded-[...]` arbitrary values where semantic radius tokens exist
- `p-[...]`, `m-[...]`, `gap-[...]` arbitrary pixel values that duplicate tokenized spacing

### 2d — Cross-Page Consistency Check
Compare the same structural elements across pages:
- Marketing pages: Do hero/nav/footer use `glass-navigation`, `audit-hero`, `product-shell` consistently?
- Report UI: Are `report-header`, `executive-summary-v2`, `finding-card` patterns reused?
- Card components: Are shadcn `Card` primitives used consistently?
- Button variants: Are CTAs using `<Button>` from `@/components/ui/button` (including `variant="brand"`)?
- Intake flow: Is `form-panel` and design tokens applied consistently?

Report any pages that implement the same UI pattern differently.

---

## PHASE 3 — ACCESSIBILITY AUDIT (WCAG 2.1 AA)

For each page and component, check:

### 3a — Image Accessibility
- Find all `<Image` and `<img` tags
- Flag any missing `alt` prop
- Flag `alt=""` that is not accompanied by `role="presentation"` or `aria-hidden="true"`
- Flag generic/meaningless alt text: `alt="image"`, `alt="photo"`, `alt="img"`, `alt="banner"`

### 3b — Interactive Element Labels
- Find all icon-only `<Button>` components
- Flag any missing `aria-label` or `aria-labelledby`
- Find all `<a href>` links with non-descriptive text: "click here", "read more", "learn more", "here"
- Flag links that open in new tab (`target="_blank"`) without `rel="noopener noreferrer"`

### 3c — Form Accessibility
- Find all `<Input>`, `<Select>`, `<Textarea>`, `<Checkbox>`, `<RadioGroup>` elements (intake form priority)
- Flag any input that has no associated `<Label>` (check for matching `htmlFor`/`id` pairs or `aria-label`)
- Flag inputs that rely solely on `placeholder` for identification

### 3d — Focus Management
- Flag `focus:outline-none` or `focus-visible:outline-none` without a replacement focus indicator
- Flag `tabIndex={-1}` on interactive elements that should be reachable
- Flag `outline: none` or `outline: 0` in style props

### 3e — Semantic Structure
- Check each `page.tsx` for presence of `<main>` element (or `product-shell` main landmark)
- Check for heading hierarchy violations (h2 before h1, h4 before h3, etc.)
- Flag pages missing a `<h1>`
- Flag `<div onClick>` patterns that should be `<button>` or `<a>`
- Flag use of `<b>` or `<i>` instead of `<strong>` or `<em>`

### 3f — ARIA
- Flag `aria-*` attributes used on wrong element types
- Flag duplicate landmark roles on a single page
- Check that `<nav>` elements have unique `aria-label` when multiple navs exist

---

## PHASE 4 — PERFORMANCE AUDIT

### 4a — Image Optimization
- Find all raw `<img` tags and flag them (must use `next/image`)
- Find `<Image` tags on above-the-fold / hero sections missing the `priority` prop
- Find `<Image` tags with explicit `loading="eager"` unnecessarily
- Find `<Image` tags missing `width`/`height` or `fill` prop (causes layout shift)

### 4b — Server vs. Client Component Usage
- Find all files with `"use client"` directive
- For each: verify the reason is valid (hooks, browser APIs, event handlers)
- Flag `"use client"` files that contain no hooks, no browser APIs, and no event handlers
- Flag large data-fetching components marked as `"use client"` (should be Server Components)

### 4c — Dynamic Import Opportunities
- Find components that import heavy libraries or large modal/print content
- Flag if these are imported statically rather than with `next/dynamic`

### 4d — Metadata Coverage
- Check every `page.tsx` for `export const metadata` or `export async function generateMetadata`
- Flag pages missing metadata entirely
- Flag metadata missing `description` (critical for SEO)
- Flag `title` fields that are empty or generic ("Page", "Home", undefined)

### 4e — Font Loading
- Search for any `<link href="https://fonts.googleapis.com"` in any layout or page
- Flag if found (must use `next/font` via `lib/fonts.ts`)
- Verify root layout applies font CSS variables

---

## PHASE 5 — REPORT UI & MARKETING CHROME CONSISTENCY

- Verify report pages use `styles/report-final-design.css` scoped classes and `--rpt-*` / `--lpd-*` tokens (not one-off hex in components)
- Check marketing/intake pages align with `styles/seo-audit-utilities.css` patterns (`bg-seo-hero`, `form-panel`, etc.)
- Verify `product-shell`, `glass-navigation`, and `site-footer` are used on product routes consistently
- Flag report print view (`/reports/[reportId]/print`) for layout regressions vs web report

---

## PHASE 6 — GENERATE AUDIT REPORT

Create a comprehensive markdown report saved to `docs/design-audit/design-audit-YYYY-MM-DD.md` with the following structure:

```
# Design Consistency Audit Report
**Date:** [today's date]
**Project:** LevelStack (lpd-levelstack)
**Auditor:** Cursor AI Agent

---

## Executive Summary
[2-3 sentence overview: total violations found, severity breakdown, overall health score]

## Severity Legend
- 🔴 Critical — Accessibility blocker or major brand inconsistency
- 🟠 High — Performance impact or WCAG AA failure
- 🟡 Medium — Design token violation or consistency issue
- 🟢 Low — Minor inconsistency or best-practice suggestion

---

## 1. Design Token Violations
### Hardcoded Colors
[table: File | Line | Violation | Severity | Suggested Fix]

### Typography Violations
[table: File | Line | Violation | Severity | Suggested Fix]

### Spacing/Radius Violations
[table: File | Line | Violation | Severity | Suggested Fix]

### Cross-Page Consistency Issues
[narrative + table of pages implementing same pattern differently]

---

## 2. Accessibility Violations
### Images
[table: File | Element | Issue | Severity | Fix]

### Interactive Elements
[table: File | Element | Issue | Severity | Fix]

### Forms
[table: File | Element | Issue | Severity | Fix]

### Semantic Structure
[table: File | Issue | Severity | Fix]

---

## 3. Performance Violations
### Image Optimization
[table: File | Issue | Severity | Fix]

### Client/Server Component Issues
[table: File | Issue | Severity | Fix]

### Dynamic Import Opportunities
[table: File | Component | Estimated Size | Fix]

### Missing Metadata
[table: Route | Missing Fields | Severity]

---

## 4. Report UI & Marketing Chrome Issues
[table: File | Issue | Severity | Fix]

---

## 5. Priority Fix List
[Ordered list of top 10 most impactful fixes, ranked by severity + frequency]

## 6. Files with Zero Violations ✅
[List of files that passed all checks]

## 7. Recommended Next Steps
[3-5 actionable recommendations based on patterns found]
```

Create the `docs/design-audit/` folder if it does not exist.

After saving the report, output a brief summary in the chat: total files audited, total violations by severity, and the top 3 most critical issues to fix immediately.
