/**
 * Customer-facing product names and static UI copy.
 * Canonical glossary: lpd-planning/COPY_BANK.md §7.0
 *
 * Jargon polish lives in customer-copy.ts — do not duplicate SNIPPET_* there.
 */

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
  leadLine: "Want us to automate these fixes for you? Apply for early access.",
  body: `SEO Automator Pro is currently at capacity to ensure maximum performance for our charter members. Unlock your ${PRODUCT_NAMES.paid} ($97) today to secure a priority position on our waitlist. When a spot opens up, your $97 assessment fee will be credited 100% toward your first month of service.`,
  button: `Unlock ${PRODUCT_NAMES.paid} — $97`,
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
    "100% assessment fee credited if you join the SEO Automator Pro waitlist.",
  secondaryCta: `Return to ${PRODUCT_NAMES.free}`,
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
  body: `Secure your ${PRODUCT_NAMES.paid} today for $97. Your purchase locks in your priority spot on the SEO Automator Pro waitlist. The moment your slot opens, your full assessment fee credits to your subscription. Your dashboard — with prioritized fixes and copy-paste assets — is ready immediately.`,
} as const

export const ACTION_ITEM_SAP_MICRO_CTA = {
  prefix: "Don't want to handle this code yourself?",
  link: "Join the waitlist",
  suffix: "to have SEO Automator Pro deploy this fix automatically.",
} as const

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
