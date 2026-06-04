import { z } from "zod"

export const severitySchema = z.enum(["critical", "high", "medium", "low", "good"])

export const findingSchema = z.object({
  label: z.string(),
  value: z.string(),
  detail: z.string(),
  severity: severitySchema,
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
  rows: z.array(
    z.object({
      label: z.string(),
      cells: z.array(z.string()),
      youColumnIndex: z.number().int().min(0).optional(),
    }),
  ),
})

export const reportSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["critical", "attention", "good"]),
  score: z.number().min(0).max(100),
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
})

export const actionPlanSchema = z.object({
  thisWeek: z.array(actionItemSchema).min(1).max(4),
  thisMonth: z.array(actionItemSchema).max(4),
  thisQuarter: z.array(actionItemSchema).max(4),
})

export const levelstackReportJsonSchema = z.object({
  meta: z.object({
    businessName: z.string(),
    ownerName: z.string(),
    marketLabel: z.string(),
    reportDate: z.string(),
    planId: z.string().nullable(),
    overallScore: z.number(),
    letterGrade: z.string(),
    totalFindings: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
  }),
  executiveSummary: z.object({
    paragraphs: z.array(z.string()),
    criticalIssue: z.string(),
    firstSteps: z.array(z.string()),
  }),
  sections: z.array(reportSectionSchema),
  actionPlan: actionPlanSchema,
})

export type LevelstackReportJson = z.infer<typeof levelstackReportJsonSchema>
export type ReportFinding = z.infer<typeof findingSchema>
export type ReportSection = z.infer<typeof reportSectionSchema>
