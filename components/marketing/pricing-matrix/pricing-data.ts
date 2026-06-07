/**
 * Shared pricing matrix data — mirrors the live LevelStack pricing table at
 * /platform/levelstack#pricing so all variations stay in sync with the catalog.
 */

export type PlanId = "free" | "full" | "call"

export type PricingPlan = {
  id: PlanId
  name: string
  price: string
  href?: string
  ariaLabel: string
  cta: string
  /** Short value line used by the card-style variation. */
  tagline: string
  highlight?: boolean
}

export type PricingFeature = {
  label: string
  /** Which sections of the report this belongs to, for grouped layouts. */
  group: "Included in Free Snapshot" | "Full Report" | "Report + Call"
  availability: Record<PlanId, boolean>
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Snapshot",
    price: "$0",
    href: "/free",
    ariaLabel: "Get Free Snapshot",
    cta: "Get Free Snapshot",
    tagline: "See your three most common gaps in two minutes.",
  },
  {
    id: "full",
    name: "Full Report",
    price: "$97",
    ariaLabel: "Get Full Report for $97",
    cta: "Get Full Report — $97",
    tagline: "The complete six-section diagnosis with a ranked action plan.",
    highlight: true,
  },
  {
    id: "call",
    name: "Report + Call",
    price: "$297",
    ariaLabel: "Get Report and Call for $297",
    cta: "Get Report + Call — $297",
    tagline: "Everything in the full report plus a 30-minute review call.",
  },
]

export const PRICING_FEATURES: PricingFeature[] = [
  {
    label: "Search footprint review",
    group: "Included in Free Snapshot",
    availability: { free: true, full: true, call: true },
  },
  {
    label: "Online reputation review",
    group: "Included in Free Snapshot",
    availability: { free: true, full: true, call: true },
  },
  {
    label: "Digital presence gap analysis",
    group: "Included in Free Snapshot",
    availability: { free: true, full: true, call: true },
  },
  {
    label: "Revenue funnel diagnosis",
    group: "Full Report",
    availability: { free: false, full: true, call: true },
  },
  {
    label: "Competitive context snapshot",
    group: "Full Report",
    availability: { free: false, full: true, call: true },
  },
  {
    label: "Prioritized action plan",
    group: "Full Report",
    availability: { free: false, full: true, call: true },
  },
  {
    label: "SEO Automator Pro flags inline",
    group: "Full Report",
    availability: { free: false, full: true, call: true },
  },
  {
    label: "PDF download",
    group: "Full Report",
    availability: { free: false, full: true, call: true },
  },
  {
    label: "30-min strategy call",
    group: "Report + Call",
    availability: { free: false, full: false, call: true },
  },
]
