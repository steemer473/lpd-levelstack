import { z } from "zod"

/** Default methodologyRef for V1 confidence (P2-3). */
export const CONFIDENCE_METHODOLOGY_REF =
  "docs/plans/confidence-methodology.md"

// --- P2-2 evidence provenance ---

export const evidenceSourceTypeSchema = z.enum([
  "serp_organic",
  "serp_maps",
  "website",
  "pagespeed",
  "ai_overview",
  "social_serp",
  "directory_serp",
  "intake",
  "derived",
])

export const freshnessClassSchema = z.enum([
  "fresh",
  "aging",
  "stale",
  "unknown",
])

export const evidenceItemSchema = z.object({
  sourceType: evidenceSourceTypeSchema,
  sourceLabel: z.string(),
  provider: z.string().optional(),
  capturedAt: z.string(),
  query: z.string().optional(),
  url: z.string().optional(),
  rawRef: z.string().optional(),
  freshnessClass: freshnessClassSchema,
})

// --- P2-3 confidence ---

export const confidenceBandSchema = z.enum(["Low", "Medium", "High"])

export const confidenceSchema = z.object({
  band: confidenceBandSchema,
  rationale: z.string(),
  methodologyRef: z.string(),
})

// --- Recommendation Object (P2-1) ---

export const recommendationPrioritySchema = z.enum(["P0", "P1", "P2", "P3"])

export const roiKindSchema = z.enum([
  "upside",
  "risk_reduction",
  "unknown",
])

export const roiSchema = z.object({
  kind: roiKindSchema,
  /** Directional range / label only — no fake $ point estimates in V1. */
  rangeLabel: z.string(),
  notes: z.string().optional(),
})

export const recommendationDependenciesSchema = z.object({
  recommendationIds: z.array(z.string()),
})

export const ownerRoleSchema = z.enum([
  "business_owner",
  "marketing",
  "ops",
  "freelancer",
  "agency",
  "unassigned",
])

export const ownerSchema = z.object({
  role: ownerRoleSchema,
})

export const automatabilitySchema = z.object({
  /** General: can automation / AI help execute this? */
  automatable: z.boolean(),
  /** Existing LPD Automator Pro product hint (from actionItem). */
  lpdProduct: z.enum(["seo", "workflow"]).optional(),
})

export const artifactKindSchema = z.enum([
  "email_template",
  "copy_rewrite",
  "reply_draft",
  "checklist",
  "none",
])

export const artifactSchema = z.object({
  kind: artifactKindSchema,
  content: z.string().optional(),
})

export const recommendationObjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  evidence: z.array(evidenceItemSchema),
  confidence: confidenceSchema,
  priority: recommendationPrioritySchema,
  roi: roiSchema,
  dependencies: recommendationDependenciesSchema,
  owner: ownerSchema,
  automatability: automatabilitySchema,
  artifact: artifactSchema,
  urgency: z.string(),
  consequenceOfInaction: z.string(),
  /** Bridge to legacy section builders until P2-4. */
  sourceSectionId: z.string().optional(),
  /** From actionItem.time during migration. */
  effortHint: z.string().optional(),
})

export type EvidenceItem = z.infer<typeof evidenceItemSchema>
export type Confidence = z.infer<typeof confidenceSchema>
export type RecommendationObject = z.infer<typeof recommendationObjectSchema>
export type EvidenceSourceType = z.infer<typeof evidenceSourceTypeSchema>
export type FreshnessClass = z.infer<typeof freshnessClassSchema>
export type ConfidenceBand = z.infer<typeof confidenceBandSchema>
export type RecommendationPriority = z.infer<
  typeof recommendationPrioritySchema
>
