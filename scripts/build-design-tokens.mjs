/**
 * Generates CSS custom properties from tokens/design-tokens.json (single source of truth).
 * Run: pnpm build:tokens
 * Hook: prebuild (before next build)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const TOKENS_PATH = join(ROOT, "tokens", "design-tokens.json")
const OUT_DIR = join(ROOT, "styles", "generated")
const OUT_FILE = join(OUT_DIR, "semantic-root.css")

const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"))

function getToken(pathStr) {
  const parts = pathStr.split(".")
  let cur = tokens
  for (const p of parts) {
    cur = cur?.[p]
    if (cur === undefined) throw new Error(`Missing token path: ${pathStr}`)
  }
  if (typeof cur !== "object" || cur === null || !("$value" in cur)) {
    throw new Error(`Not a token leaf: ${pathStr}`)
  }
  const val = cur.$value
  return typeof val === "number" ? String(val) : String(val)
}

/** shadcn-style: "H S% L%" without hsl() wrapper */
function hslToSpaceSeparated(value) {
  const v = value.trim()
  if (v.startsWith("#")) {
    return hexToHslSpace(v)
  }
  const comma = v.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i
  )
  if (comma) {
    return `${comma[1]} ${comma[2]}% ${comma[3]}%`
  }
  const space = v.match(/hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i)
  if (space) {
    return `${space[1]} ${space[2]}% ${space[3]}%`
  }
  throw new Error(`Cannot parse HSL/hex: ${value}`)
}

function hexToHslSpace(hex) {
  let h = hex.replace(/^#/, "")
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let hue = 0
  let sat = 0
  const light = (max + min) / 2
  if (max !== min) {
    const d = max - min
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        hue = ((b - r) / d + 2) / 6
        break
      default:
        hue = ((r - g) / d + 4) / 6
    }
  }
  const H = Math.round(hue * 360 * 10) / 10
  const S = Math.round(sat * 1000) / 10
  const L = Math.round(light * 1000) / 10
  return `${H} ${S}% ${L}%`
}

/** Full color for --accent-orange style vars */
function colorAsCss(value) {
  const v = value.trim()
  if (v.startsWith("#")) return v
  if (/^hsla?\(/i.test(v)) return v.replace(/,/g, "")
  return v
}

const SEMANTIC_LIGHT = {
  background: "color.semantic.light.background",
  foreground: "color.semantic.light.foreground",
  muted: "color.semantic.light.muted",
  "muted-foreground": "color.semantic.light.mutedForeground",
  card: "color.semantic.light.card",
  "card-foreground": "color.semantic.light.cardForeground",
  popover: "color.semantic.light.popover",
  "popover-foreground": "color.semantic.light.popoverForeground",
  border: "color.semantic.light.border",
  input: "color.semantic.light.input",
  primary: "color.semantic.light.primary",
  "primary-foreground": "color.semantic.light.primaryForeground",
  secondary: "color.semantic.light.secondary",
  "secondary-foreground": "color.semantic.light.secondaryForeground",
  accent: "color.semantic.light.accent",
  "accent-foreground": "color.semantic.light.accentForeground",
  destructive: "color.semantic.light.destructive",
  "destructive-foreground": "color.semantic.light.destructiveForeground",
  ring: "color.semantic.light.ring",
}

const SEMANTIC_DARK = {
  background: "color.semantic.dark.background",
  foreground: "color.semantic.dark.foreground",
  muted: "color.semantic.dark.muted",
  "muted-foreground": "color.semantic.dark.mutedForeground",
  card: "color.semantic.dark.card",
  "card-foreground": "color.semantic.dark.cardForeground",
  popover: "color.semantic.dark.popover",
  "popover-foreground": "color.semantic.dark.popoverForeground",
  border: "color.semantic.dark.border",
  input: "color.semantic.dark.input",
  primary: "color.semantic.dark.primary",
  "primary-foreground": "color.semantic.dark.primaryForeground",
  secondary: "color.semantic.dark.secondary",
  "secondary-foreground": "color.semantic.dark.secondaryForeground",
  accent: "color.semantic.dark.accent",
  "accent-foreground": "color.semantic.dark.accentForeground",
  destructive: "color.semantic.dark.destructive",
  "destructive-foreground": "color.semantic.dark.destructiveForeground",
  ring: "color.semantic.dark.ring",
}

function linesForSemantic(map) {
  const out = []
  for (const [cssKey, path] of Object.entries(map)) {
    const raw = getToken(path)
    out.push(`    --${cssKey}: ${hslToSpaceSeparated(raw)};`)
  }
  return out.join("\n")
}

function buildCss() {
  const radius = getToken("dimension.radius.lg")
  const brandOrange = getToken("color.brand.orange")
  const brandBlue = getToken("color.brand.blue")
  const heroBg = getToken("color.surface.hero.background")
  const pricingLight = getToken("color.surface.pricingBackground.light")
  const pricingDark = getToken("color.surface.pricingBackground.dark")
  const sidebarBorder = getToken("color.sidebar.border")
  const sidebarAccent = getToken("color.sidebar.accent")
  const sw = getToken("dimension.layout.sidebar.width")
  const swIcon = getToken("dimension.layout.sidebar.widthIcon")

  const gradBrandText = getToken("effect.gradient.brandText")
  const gradBtnPrimary = getToken("effect.gradient.btnPrimary")
  const shadowBtnHover = getToken("shadow.btnPrimaryHover")
  const shadowCardHover = getToken("shadow.cardHover")

  const breakpoints = tokens.breakpoint ?? {}
  const zIndex = tokens.zIndex ?? {}
  const iconSize = tokens.icon?.size ?? {}
  const borderWidth = tokens.borderWidth ?? {}

  const bpLines = []
  for (const [k, v] of Object.entries(breakpoints)) {
    if (v && typeof v === "object" && "$value" in v) {
      bpLines.push(`    --breakpoint-${k}: ${v.$value};`)
    }
  }

  const zLines = []
  for (const [k, v] of Object.entries(zIndex)) {
    if (v && typeof v === "object" && "$value" in v) {
      zLines.push(`    --z-${k}: ${v.$value};`)
    }
  }

  const iconLines = []
  for (const [k, v] of Object.entries(iconSize)) {
    if (v && typeof v === "object" && "$value" in v) {
      iconLines.push(`    --icon-size-${k}: ${v.$value};`)
    }
  }

  const bwLines = []
  for (const [k, v] of Object.entries(borderWidth)) {
    if (v && typeof v === "object" && "$value" in v) {
      const key = k === "DEFAULT" ? "default" : k
      bwLines.push(`    --border-width-${key}: ${v.$value};`)
    }
  }

  return `/**
 * AUTO-GENERATED from tokens/design-tokens.json — do not edit by hand.
 * Regenerate: pnpm build:tokens
 */
@layer base {
  :root {
${linesForSemantic(SEMANTIC_LIGHT)}
    --radius: ${radius};

    --accent-orange: ${colorAsCss(brandOrange)};
    --accent-blue: ${colorAsCss(brandBlue)};
    --hero-bg: ${colorAsCss(heroBg)};
    --dark-900: ${colorAsCss(getToken("color.scale.dark.900"))};
    --dark-800: ${colorAsCss(getToken("color.scale.dark.800"))};
    --dark-700: ${colorAsCss(getToken("color.scale.dark.700"))};
    --dark-600: ${colorAsCss(getToken("color.scale.dark.600"))};
    --light-50: ${colorAsCss(getToken("color.scale.light.50"))};
    --light-100: ${colorAsCss(getToken("color.scale.light.100"))};
    --light-200: ${colorAsCss(getToken("color.scale.light.200"))};
    --light-300: ${colorAsCss(getToken("color.scale.light.300"))};
    --light-400: ${colorAsCss(getToken("color.scale.light.400"))};
    --light-500: ${colorAsCss(getToken("color.scale.light.500"))};

    --pricing-bg: ${pricingLight.startsWith("#") ? pricingLight : colorAsCss(pricingLight)};

    --sidebar-width: ${sw};
    --sidebar-width-icon: ${swIcon};
    --sidebar-border: ${hslToSpaceSeparated(sidebarBorder)};
    --sidebar-accent: ${hslToSpaceSeparated(sidebarAccent)};

    --effect-gradient-brand-text: ${gradBrandText};
    --effect-gradient-btn-primary: ${gradBtnPrimary};
    --shadow-btn-primary-hover: ${shadowBtnHover};
    --shadow-card-hover: ${shadowCardHover};

    --lh-body: ${getToken("typography.lineHeight.body")};
    --lh-hero-h1: ${getToken("typography.lineHeight.heroH1")};

    /* LevelStack report + product shell (brief §10.3, sample HTML) */
    --lpd-dark: #002147;
    --lpd-orange: #FF6633;
    --lpd-blue: #00D4F5;
    --lpd-severity-critical: #E24B4A;
    --lpd-severity-attention: #EF9F27;
    --lpd-severity-good: #639922;

    /* LevelStack report surfaces */
    --report-header-border: rgba(255, 255, 255, 0.10);
    --report-tab-active-border: var(--lpd-orange);
    --report-intro-bg: color-mix(in srgb, var(--lpd-blue) 8%, white);
    --report-intro-border: color-mix(in srgb, var(--lpd-blue) 25%, white);
    --report-text-title: 1.25rem;
    --report-text-section: 0.9375rem;
    --report-text-body: 0.875rem;
    --report-text-detail: 0.8125rem;
    --report-text-meta: 0.75rem;
    --report-text-caption: 0.6875rem;
    --report-text-micro: 0.625rem;
    --report-text-score: 1.875rem;
    --report-text-grade: 3rem;

    /* seo-audit-nextjs (apps/web/globals.css + tailwind.config.js) */
    --seo-brand-dark: #0B0F19;
    --seo-brand-blue: #2563EB;
    --seo-brand-orange: #F97316;
    --seo-brand-light: #EFF6FF;

${bpLines.join("\n")}
${zLines.join("\n")}
${iconLines.join("\n")}
${bwLines.join("\n")}
  }

  @media (prefers-color-scheme: dark) {
    :root {
${linesForSemantic(SEMANTIC_DARK)}
      --pricing-bg: ${pricingDark.startsWith("#") ? pricingDark : colorAsCss(pricingDark)};
    }
  }
}
`
}

mkdirSync(OUT_DIR, { recursive: true })
const css = buildCss()
writeFileSync(OUT_FILE, css, "utf8")
console.log(`Wrote ${OUT_FILE}`)
