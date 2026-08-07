/**
 * Customer-facing product names and static UI copy.
 * Canonical glossary: lpd-planning/COPY_BANK.md §7.0
 * Landing/footer/disclaimers: COPY_BANK §7.2 / §7.4
 *
 * Jargon polish lives in customer-copy.ts — do not duplicate SNIPPET_* there.
 */

/** COPY_BANK §7.2 — site footer tagline */
export const SITE_FOOTER_TAGLINE =
  "We spot gaps. SEO Automator Pro fixes them. No rank or sales promises." as const

/** COPY_BANK §7.2 — Honest scope landing card */
export const HONEST_SCOPE_CARD_COPY =
  "We show priorities. SEO Automator Pro fixes them. No rank or sales promises." as const

/** COPY_BANK §7.4 DISC-01 — score footer, executive summary, print view */
export const REPORT_DIAGNOSTIC_DISCLAIMER =
  "Diagnostic only — LevelStack spots gaps. SEO Automator Pro fixes the technical layer. LevelStack does not guarantee rankings or revenue outcomes." as const

/** COPY_BANK §7.4 DISC-02 — action plan section callout */
export const REPORT_ACTION_PLAN_CALLOUT =
  "LevelStack lists what to fix. SEO Automator Pro fixes the technical layer." as const

/** Empty timeframe buckets on the Action Plan / roadmap tab. */
export const ROADMAP_BUCKET_EMPTY_COPY = {
  week: "Nothing urgent this week. Move to the next timeframe when you're ready.",
  month: "No items scheduled this month.",
  quarter: "No larger projects queued this quarter.",
} as const

/** COPY_BANK §7.4 DISC-03 — pipeline-generated executive summary fallback */
export const REPORT_PIPELINE_DISCLAIMER =
  "This report is diagnostic only — LevelStack identifies gaps. SEO Automator Pro fixes the technical layer. No ranking or revenue outcomes are guaranteed." as const

export const PRODUCT_NAMES = {
  free: "Visibility Snapshot",
  paid: "Action Roadmap",
  premium: "Action Roadmap + Strategy Call",
  dashboard: "LevelStack Dashboard",
  lockedModule: "90-Day Action Blueprint",
  pdf: "Action Roadmap PDF",
} as const

export type ProductNameKey = keyof typeof PRODUCT_NAMES

export const OUTCOME_LABELS = {
  revenueRisk: "Revenue Risk",
  visibilityLeak: "Visibility Leak",
  competitorAdvantage: "Competitor Advantage",
  performanceLeak: "Performance Leak",
  verifiedAsset: "Verified Asset",
} as const

export type OutcomeLabelKey = keyof typeof OUTCOME_LABELS

export const UPGRADE_BANNER = {
  leadLine: `Ready for the prioritized plan? Unlock your ${PRODUCT_NAMES.paid}.`,
  headerLine: (checked: number, total: number) =>
    `You've seen ${checked} of ${total} areas.`,
  valueLine:
    "The Action Roadmap opens all six areas, ranks every issue by impact, and gives you copy-paste fixes with owner and time-to-fix for each.",
  body: `The $97 assessment fee credits toward your first founding-rate month of SEO Automator Pro when an eligible slot opens (same email as purchase).`,
  button: `Unlock ${PRODUCT_NAMES.paid} — $97`,
  ctaSuffix: "one-time, no subscription",
  secondaryCta: `Prefer a walkthrough? ${PRODUCT_NAMES.premium} — $297`,
  sampleLink: `See a sample ${PRODUCT_NAMES.paid}`,
  monitoringBridge:
    "Already planning to act on what you found? The technical foundation your rankings depend on needs ongoing attention — not just a one-time fix. SEO Automator Pro monitors your site continuously so you can see what changed and address it before visibility slips between audits.",
  monitoringCta: "Learn about SEO Automator Pro",
} as const

/** COPY_BANK §3 Placement 3 — Action Roadmap end of Action Plan */
export const SAP_BRIDGE_PLACEMENT_3 = {
  body: "Your Action Roadmap tells you what to fix and why. Most items still need your time or someone else's. The technical SEO layer is the one part that can run continuously through product-managed monitoring — so you stay focused on the work only you can do while the product handles routine technical corrections.",
  ctaLabel: "Join the SEO Automator Pro Waitlist — Founding Rate",
} as const

export const LOCKED_SECTION_MODAL = {
  title: `Unlock Your ${PRODUCT_NAMES.lockedModule} & Competitive Analysis`,
  description:
    "Your free snapshot found the gaps. The Action Roadmap shows how to close them.",
  bullets: [
    "Full 90-day prioritized action plan with Who / Time / Impact",
    "Reputation, digital presence, funnel, and competitive modules unlocked",
    "Dashboard + PDF ready immediately after purchase",
  ] as const,
  primaryCta: (price = "$97") => `Unlock ${PRODUCT_NAMES.paid} — ${price}`,
  creditNote:
    "The $97 assessment fee credits toward your first founding-rate month when an eligible SEO Automator Pro slot opens.",
  /** Secondary action — opens the public paid sample instead of dismissing. */
  secondaryCta: `See a sample ${PRODUCT_NAMES.paid}`,
} as const

/** Public illustrative Action Roadmap (paid sample). */
export const SAMPLE_ACTION_ROADMAP_PATH = "/sample-report/action-roadmap" as const

export const SAMPLE_ACTION_ROADMAP_LINKS = {
  lockedPreview: (sectionLabel: string) =>
    `See how ${sectionLabel} looks in a sample ${PRODUCT_NAMES.paid}`,
  samplePageCtaLead:
    "This is a sample Action Roadmap for a sample business — not your data.",
} as const

export const SAP_WAITLIST_MODAL = {
  title: "Secure Your Charter Spot for SEO Automator Pro",
  paidStatusLine: "Priority Waitlist Authorized (Assessment Completed)",
  bullets: [
    "Receive an instant email notification the second your integration slot opens.",
    "Lock in our beta charter pricing (guaranteed life-of-account discount).",
    "Instantly apply your $97 assessment fee to your first month of automation.",
  ] as const,
  cta: "Apply for Early Access & Lock in My $97 Credit",
  primaryCta: "Apply for Early Access",
  creditNote: "Lock in your $97 assessment credit when your slot opens.",
  /** Built at runtime via getHubSeoWaitlistUrl({ reportId, source: \"levelstack_report_credit\" }). */
  waitlistUrl: "/platform/seo?source=levelstack_report_credit#waitlist",
} as const

export const CHARTER_GUARANTEE = {
  title: "100% Risk-Free Charter Guarantee",
  /** COPY_BANK §7.1 FAQ-03 direction */
  body: `Secure your ${PRODUCT_NAMES.paid} today for $97. Priority waitlist + assessment fee credit at SAP onboarding. Dashboard live immediately.`,
} as const

export const ACTION_ITEM_SAP_MICRO_CTA = {
  prefix: "Don't want to handle this code yourself?",
  link: "Join the waitlist",
  suffix: "to have SEO Automator Pro deploy this fix automatically.",
} as const

/**
 * Owner-only, non-technical tasks (claim listings, reply to reviews, post once)
 * should not show the "handle this code yourself" Automator waitlist micro-CTA.
 * Keep the CTA when Freelancer / Developer / Agency (or similar) is involved,
 * or when the item is marked automatable.
 */
export function shouldShowActionItemSapMicroCta(
  who: string,
  options?: { automatable?: boolean },
): boolean {
  if (options?.automatable) return true
  const normalized = who.trim().toLowerCase()
  if (!normalized) return false
  if (
    /freelancer|developer|\bdevs?\b|agency|engineer|contractor|designer|\bops\b|marketing/i.test(
      normalized,
    )
  ) {
    return true
  }
  // Solely business owner (You / Owner / Founder)
  return !/\b(you|owner|founder)\b/i.test(normalized)
}

/** Tier midpoints for ROI copy (annual, one missed lead/month). */
export const CONTRACT_VALUE_TIER_MIDPOINTS: Record<string, number> = {
  under_500: 250,
  "500_2500": 1500,
  "2500_10000": 5000,
  "10000_plus": 15000,
}

export function formatRoiLine(tier: string): string | null {
  const midpoint = CONTRACT_VALUE_TIER_MIDPOINTS[tier]
  if (!midpoint) return null
  const annual = midpoint * 12
  return `At your contract tier, one missed lead per month could represent roughly $${annual.toLocaleString()}/year — based on the range you selected.`
}

/**
 * Combined product + score-basis + methodology note (dogfood UX).
 * Free Overall uses Search + Social only; paid uses all scored diagnostics.
 */
export const SCORE_DISCLAIMER = {
  title: "About these scores",
  product:
    `${PRODUCT_NAMES.free} is a limited free view (Search Visibility and Social & off-site). ${PRODUCT_NAMES.paid} is the full paid diagnostic with every unlocked section.`,
  scoreBasis:
    "Free and paid Overall scores often differ because they average different section sets — not because one run is “wrong.”",
  methodology:
    "Scores summarize public presence signals at the time of the run. They are estimates, not a guarantee of ranking, traffic, or revenue.",
} as const

export function scoreDisclaimerParagraphs(): string[] {
  return [
    SCORE_DISCLAIMER.product,
    SCORE_DISCLAIMER.scoreBasis,
    SCORE_DISCLAIMER.methodology,
  ]
}
