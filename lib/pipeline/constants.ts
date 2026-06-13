/** PRD §2 — six ordered search operations mapped to pipeline steps. */
export const AUDIT_OPERATIONS = [
  { id: "brand_name_search", label: "Brand name search", order: 0 },
  { id: "primary_domain_fetch", label: "Primary domain fetch", order: 1 },
  { id: "social_media_search", label: "Social media search", order: 2 },
  { id: "about_footer_fetch", label: "About / footer fetch", order: 3 },
  { id: "directory_review_search", label: "Directory & review search", order: 4 },
  { id: "brand_mention_search", label: "Brand mention search", order: 5 },
] as const

export type AuditOperationId = (typeof AUDIT_OPERATIONS)[number]["id"]

/** Report UI sections — Figma template taxonomy (6 diagnostic + action plan). */
export const PIPELINE_STEPS = [
  { id: "search_footprint", label: "Search footprint", order: 0 },
  { id: "online_reputation", label: "Reputation", order: 1 },
  { id: "digital_presence", label: "Digital presence", order: 2 },
  { id: "revenue_funnel", label: "Revenue funnel", order: 3 },
  { id: "competitive_context", label: "Competitive context", order: 4 },
  { id: "action_plan", label: "Action plan", order: 5 },
] as const

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]["id"]

export const PIPELINE_STEP_IDS: PipelineStepId[] = PIPELINE_STEPS.map((s) => s.id)

/** Free snapshot runs ops 1–5 only (no competitive deep-dive). */
export const FREE_TIER_OPERATION_IDS: AuditOperationId[] = [
  "brand_name_search",
  "primary_domain_fetch",
  "social_media_search",
  "about_footer_fetch",
  "directory_review_search",
]

export const FULL_TIER_OPERATION_IDS: AuditOperationId[] = AUDIT_OPERATIONS.map(
  (o) => o.id,
)

/** Sections visible on free snapshot (Executive Summary is always shown). */
export const FREE_TIER_SECTION_IDS = new Set([
  "search_footprint",
  "online_reputation",
  "digital_presence",
])

export const PAID_ONLY_SECTION_IDS = new Set([
  "revenue_funnel",
  "competitive_context",
  "action_plan",
])
