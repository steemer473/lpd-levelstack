import { z } from "zod"

import { recommendationObjectSchema } from "@/lib/pipeline/recommendation-types"

export {
  recommendationObjectSchema,
  evidenceItemSchema,
  confidenceSchema,
  CONFIDENCE_METHODOLOGY_REF,
} from "@/lib/pipeline/recommendation-types"
export type {
  RecommendationObject,
  EvidenceItem,
  Confidence,
} from "@/lib/pipeline/recommendation-types"

export const severitySchema = z.enum(["critical", "high", "medium", "low", "good"])

export const findingSchema = z.object({
  label: z.string(),
  value: z.string(),
  detail: z.string(),
  severity: severitySchema,
  headline: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  riskCategory: z.string().optional(),
  snippetBefore: z.string().optional(),
  snippetAfter: z.string().optional(),
})

export const aiPreviewSchema = z.object({
  platform: z.string(),
  result: z.string(),
  severity: severitySchema,
})

export const scoreRowSchema = z.object({
  label: z.string(),
  value: z.string(),
  percent: z.number().min(0).max(100),
  tone: z.enum(["red", "amber", "green"]),
})

export const competitiveGridSchema = z.object({
  columnHeaders: z.array(z.string()),
  columnSources: z
    .array(
      z.enum(["you", "service_peer", "namesake", "category_peer", "intake"]),
    )
    .optional(),
  comparisonMode: z
    .enum([
      "service_peer",
      "namesake",
      "category_peer",
      "mixed",
      "evidence_only",
    ])
    .optional(),
  rows: z.array(
    z.object({
      label: z.string(),
      cells: z.array(z.string()),
      youColumnIndex: z.number().int().min(0).optional(),
    }),
  ),
})

export const reportSectionStatusSchema = z.enum([
  "critical",
  "attention",
  "good",
  "insufficient_data",
])

export const reportSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: reportSectionStatusSchema,
  /** Null when status is insufficient_data (P1-2) — do not invent 0. */
  score: z.number().min(0).max(100).nullable(),
  findings: z.array(findingSchema),
  aiPreview: z.array(aiPreviewSchema).optional(),
  scoreRows: z.array(scoreRowSchema).optional(),
  competitiveGrid: competitiveGridSchema.optional(),
})

export const actionItemSchema = z.object({
  task: z.string(),
  sub: z.string().optional(),
  who: z.string(),
  time: z.string(),
  findingRef: z.string().optional(),
  automatorFlag: z.boolean().optional(),
  automatorProduct: z.enum(["seo", "workflow"]).optional(),
  impactLevel: z.string().optional(),
  artifact: z.string().optional(),
  coreMetric: z.string().optional(),
  leakBadge: z.string().optional(),
  marketToll: z.string().optional(),
})

export const insightBlockSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  summary: z.string(),
  details: z.array(z.string()),
})

export const signalStatusRowSchema = z.object({
  label: z.string(),
  value: z.string(),
  percent: z.number().min(0).max(100),
  tone: z.enum(["red", "amber", "green"]),
})

export const actionPlanSchema = z.object({
  thisWeek: z.array(actionItemSchema).min(1).max(4),
  thisMonth: z.array(actionItemSchema).max(4),
  thisQuarter: z.array(actionItemSchema).max(4),
})

export const executiveInsightsSchema = z.object({
  whatProspectsSee: z.string(),
  reputationGap: z.string(),
  revenueRisk: z.string(),
})

export const executiveHighlightsSchema = z.object({
  businessImpact: z.string(),
  highestLeverageOpportunity: z.string(),
})

export const executiveSummarySchema = z.object({
  paragraphs: z.array(z.string()),
  criticalIssue: z.string(),
  firstSteps: z.array(z.string()),
  insights: executiveInsightsSchema.optional(),
  highlights: executiveHighlightsSchema.optional(),
  strengths: z.array(z.string()).max(3).optional(),
  topOpportunities: z.array(z.string()).max(3).optional(),
})

export const levelstackReportJsonSchema = z.object({
  meta: z.object({
    businessName: z.string(),
    ownerName: z.string(),
    marketLabel: z.string(),
    reportDate: z.string(),
    planId: z.string().nullable(),
    reportTier: z
      .enum(["free_snapshot", "full_report", "strategy_call"])
      .optional(),
    overallScore: z.number(),
    letterGrade: z.string(),
    totalFindings: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
    issueCountForUpgrade: z.number().optional(),
    lockedSectionCount: z.number().optional(),
    upgradeTeasers: z
      .object({
        competitivePositionAlert: z.string().optional(),
        competitiveSearchQuery: z.string().optional(),
        competitorCount: z.number().int().min(0).optional(),
        previewCompetitor: z
          .object({
            rank: z.number().int().min(1),
            domain: z.string(),
            title: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    teaserActionCount: z.number().int().min(0).optional(),
    partnerBranding: z
      .object({
        companyName: z.string(),
        logoUrl: z.string().nullable().optional(),
        accentColorHex: z.string(),
      })
      .optional(),
  }),
  executiveSummary: executiveSummarySchema,
  sections: z.array(reportSectionSchema),
  actionPlan: actionPlanSchema,
  /** P2-1 Recommendation Objects — optional until P2-4 dual-write. */
  recommendations: z.array(recommendationObjectSchema).optional(),
  signalRows: z.array(signalStatusRowSchema).optional(),
  insights: z.array(insightBlockSchema).optional(),
})

export type LevelstackReportJson = z.infer<typeof levelstackReportJsonSchema>
export type ReportFinding = z.infer<typeof findingSchema>
export type ReportSection = z.infer<typeof reportSectionSchema>
export type ReportActionItem = z.infer<typeof actionItemSchema>
