import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"
import { severitySchema } from "@/lib/pipeline/report-types"
import { buildExecutiveSummaryFromResearch } from "@/lib/pipeline/serp-backed-sections"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

const SECTION_IDS = [
  "search_footprint",
  "online_reputation",
  "digital_presence",
  "revenue_funnel",
  "competitive_context",
] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return fallback
}

function coerceSeverity(
  value: unknown,
  fallback: ReportFinding["severity"],
): ReportFinding["severity"] {
  const parsed = severitySchema.safeParse(value)
  return parsed.success ? parsed.data : fallback
}

function coerceStatus(
  value: unknown,
  fallback: ReportSection["status"],
): ReportSection["status"] {
  if (value === "critical" || value === "attention" || value === "good") {
    return value
  }
  return fallback
}

function coerceScore(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return Math.min(100, Math.max(0, Math.round(value)))
  }
  return fallback
}

function normalizeFinding(
  raw: unknown,
  fallback: ReportFinding,
): ReportFinding {
  const o = asRecord(raw)
  if (!o) return fallback

  const label = coerceString(o.label, fallback.label)
  const value = coerceString(o.value, fallback.value)
  const llmDetail = typeof o.detail === "string" ? o.detail.trim() : ""

  return {
    label,
    value: value || fallback.value,
    detail: llmDetail || fallback.detail || "See research evidence above.",
    severity: coerceSeverity(o.severity, fallback.severity),
  }
}

function normalizeAiPreview(
  raw: unknown,
  baseline?: ReportSection["aiPreview"],
): ReportSection["aiPreview"] {
  if (!Array.isArray(raw) || raw.length === 0) return baseline

  const base = baseline ?? []
  return raw.map((item, i) => {
    const o = asRecord(item)
    const fallback = base[i]
    if (!o) return fallback!
    return {
      platform: coerceString(o.platform, fallback?.platform ?? "AI preview"),
      result: coerceString(o.result, fallback?.result ?? ""),
      severity: coerceSeverity(o.severity, fallback?.severity ?? "medium"),
    }
  }).filter(Boolean) as NonNullable<ReportSection["aiPreview"]>
}

function normalizeSection(raw: unknown, baseline: ReportSection): ReportSection {
  const o = asRecord(raw)
  if (!o) return baseline

  const rawFindings = Array.isArray(o.findings) ? o.findings : []

  let findings: ReportFinding[]
  if (baseline.id === "competitive_context" && baseline.findings[0]) {
    const primaryFinding = baseline.findings[0]
    const supplemental = rawFindings
      .slice(0, 2)
      .map((f, i) =>
        normalizeFinding(f, baseline.findings[i + 1] ?? primaryFinding),
      )
      .filter(
        (f) =>
          f.label !== primaryFinding.label &&
          !f.label.toLowerCase().includes("competitor landscape") &&
          !f.label.toLowerCase().includes("market differentiation"),
      )
    findings = [primaryFinding, ...supplemental, ...baseline.findings.slice(1 + supplemental.length)]
  } else {
    findings =
      rawFindings.length > 0
        ? [
            ...rawFindings.map((f, i) =>
              normalizeFinding(
                f,
                baseline.findings[i] ?? baseline.findings[0]!,
              ),
            ),
            ...baseline.findings.slice(rawFindings.length),
          ]
        : baseline.findings
  }

  if (findings.length === 0) findings = baseline.findings

  return {
    id: baseline.id,
    label: coerceString(o.label, baseline.label),
    status: coerceStatus(o.status, baseline.status),
    score: coerceScore(o.score, baseline.score),
    findings: findings.length > 0 ? findings : baseline.findings,
    aiPreview: normalizeAiPreview(o.aiPreview, baseline.aiPreview),
    scoreRows: baseline.scoreRows,
    competitiveGrid: baseline.competitiveGrid,
  }
}

function coerceStringArray(value: unknown, max: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
  return items.length > 0 ? items : undefined
}

function normalizeExecutiveSummary(
  raw: unknown,
  fallback: LevelstackReportJson["executiveSummary"],
): LevelstackReportJson["executiveSummary"] {
  const o = asRecord(raw)
  if (!o) return fallback

  const paragraphs = Array.isArray(o.paragraphs)
    ? o.paragraphs
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter(Boolean)
    : []

  const firstSteps = Array.isArray(o.firstSteps)
    ? o.firstSteps
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    : []

  const insightsRaw = asRecord(o.insights)
  const insights =
    insightsRaw &&
    coerceString(insightsRaw.whatProspectsSee, "") &&
    coerceString(insightsRaw.reputationGap, "") &&
    coerceString(insightsRaw.revenueRisk, "")
      ? {
          whatProspectsSee: coerceString(
            insightsRaw.whatProspectsSee,
            fallback.insights?.whatProspectsSee ?? fallback.paragraphs[0] ?? "",
          ),
          reputationGap: coerceString(
            insightsRaw.reputationGap,
            fallback.insights?.reputationGap ?? fallback.paragraphs[1] ?? "",
          ),
          revenueRisk: coerceString(
            insightsRaw.revenueRisk,
            fallback.insights?.revenueRisk ??
              fallback.paragraphs[2] ??
              fallback.paragraphs[fallback.paragraphs.length - 1] ??
              "",
          ),
        }
      : fallback.insights

  const highlightsRaw = asRecord(o.highlights)
  const highlights =
    highlightsRaw &&
    coerceString(highlightsRaw.businessImpact, "") &&
    coerceString(highlightsRaw.highestLeverageOpportunity, "")
      ? {
          businessImpact: coerceString(
            highlightsRaw.businessImpact,
            fallback.highlights?.businessImpact ?? "",
          ),
          highestLeverageOpportunity: coerceString(
            highlightsRaw.highestLeverageOpportunity,
            fallback.highlights?.highestLeverageOpportunity ?? "",
          ),
        }
      : fallback.highlights

  return {
    paragraphs:
      paragraphs.length >= 2 ? paragraphs.slice(0, 5) : fallback.paragraphs,
    criticalIssue: coerceString(o.criticalIssue, fallback.criticalIssue),
    firstSteps:
      firstSteps.length > 0 ? firstSteps.slice(0, 4) : fallback.firstSteps,
    insights,
    highlights,
    strengths: coerceStringArray(o.strengths, 3) ?? fallback.strengths,
    topOpportunities:
      coerceStringArray(o.topOpportunities, 3) ?? fallback.topOpportunities,
  }
}

export function normalizeSynthesisPayload(
  json: unknown,
  baselineSections: ReportSection[],
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle | null,
): {
  sections: ReportSection[]
  executiveSummary: LevelstackReportJson["executiveSummary"]
  actionPlan: unknown
} {
  const root = asRecord(json) ?? {}
  const baselineById = new Map(baselineSections.map((s) => [s.id, s]))

  const sections = SECTION_IDS.map((id) => {
    const baseline = baselineById.get(id)
    if (!baseline) {
      throw new Error(`Missing baseline section: ${id}`)
    }
    const llmSection = Array.isArray(root.sections)
      ? root.sections.find(
          (s) => asRecord(s)?.id === id || asRecord(s)?.id === baseline.id,
        )
      : undefined
    return normalizeSection(llmSection, baseline)
  })

  const execFallback =
    bundle ?
      buildExecutiveSummaryFromResearch(intake, bundle, sections)
    : {
        paragraphs: [
          `This report summarizes how prospects may perceive ${intake.primaryBusinessName} online.`,
          "Diagnostic only — you or your team execute the fixes listed in the action plan.",
        ],
        criticalIssue: "Review section findings for the highest-priority trust or conversion gaps.",
        firstSteps: [],
      }

  return {
    sections,
    executiveSummary: normalizeExecutiveSummary(root.executiveSummary, execFallback),
    actionPlan: root.actionPlan,
  }
}
