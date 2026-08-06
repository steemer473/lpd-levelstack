import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"
import { severitySchema } from "@/lib/pipeline/report-types"
import { buildExecutiveSummaryFromResearch } from "@/lib/pipeline/serp-backed-sections"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { REPORT_PIPELINE_DISCLAIMER } from "@/lib/report/outcome-copy"

const SECTION_IDS = [
  "search_footprint",
  "social_offsite",
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
  if (
    value === "critical" ||
    value === "attention" ||
    value === "good" ||
    value === "insufficient_data"
  ) {
    return value
  }
  return fallback
}

function coerceScore(
  value: unknown,
  fallback: number | null,
): number | null {
  if (fallback == null) return null
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

function dedupeFindingsByLabel(findings: ReportFinding[]): ReportFinding[] {
  const byLabel = new Map<string, ReportFinding>()

  function findingScore(f: ReportFinding): number {
    const blob = `${f.value} ${f.detail}`
    let score = 0
    if (/\d+\s*★|\d+(?:\.\d)?\s*out of 5/i.test(blob)) score += 4
    if (/category:/i.test(blob)) score += 2
    if (/address:/i.test(blob)) score += 2
    if (/https?:\/\//i.test(blob)) score += 1
    if (/limited|lacks|unavailable|not confirmed/i.test(blob)) score -= 2
    return score
  }

  for (const finding of findings) {
    const key = finding.label.trim().toLowerCase()
    const existing = byLabel.get(key)
    if (!existing || findingScore(finding) > findingScore(existing)) {
      byLabel.set(key, finding)
    }
  }

  return findings.filter((f) => byLabel.get(f.label.trim().toLowerCase()) === f)
}

function isGoodBaselineFinding(finding: ReportFinding): boolean {
  if (finding.severity === "good") return true
  const blob = `${finding.value} ${finding.detail}`.toLowerCase()
  return /no indexed complaints|no complaint|not found when searching|no organic results captured/.test(
    blob,
  )
}

function hasStrongBrandFootprint(baseline: ReportSection): boolean {
  return baseline.findings.some((finding) => {
    const match = finding.value.match(/position #(\d+)/i)
    if (!match) return false
    const rank = Number.parseInt(match[1]!, 10)
    return (
      rank >= 1 &&
      rank <= 3 &&
      (finding.severity === "good" || finding.severity === "low")
    )
  })
}

function applySearchFootprintScoreFloor(
  baseline: ReportSection,
  score: number | null,
  status: ReportSection["status"],
): { score: number | null; status: ReportSection["status"] } {
  if (baseline.id !== "search_footprint" || !hasStrongBrandFootprint(baseline)) {
    return { score, status }
  }
  if (typeof baseline.score !== "number") {
    return { score, status }
  }

  let nextScore = score
  if (typeof nextScore === "number" && nextScore < baseline.score) {
    nextScore = baseline.score
  }

  let nextStatus = status
  if (baseline.status !== "critical" && status === "critical") {
    nextStatus = baseline.status
  }

  return { score: nextScore, status: nextStatus }
}

const LLM_GUARDRAIL_SECTION_IDS = new Set([
  "search_footprint",
  "online_reputation",
  "revenue_funnel",
])

function severityRank(severity: ReportFinding["severity"]): number {
  switch (severity) {
    case "good":
      return 0
    case "low":
      return 1
    case "medium":
      return 2
    case "high":
      return 3
    case "critical":
      return 4
    default:
      return 2
  }
}

function mergeFindingsWithGuardrails(
  rawFindings: unknown[],
  baseline: ReportSection,
): ReportFinding[] {
  if (!LLM_GUARDRAIL_SECTION_IDS.has(baseline.id)) {
    if (rawFindings.length === 0) return baseline.findings
    return [
      ...rawFindings.map((f, i) =>
        normalizeFinding(f, baseline.findings[i] ?? baseline.findings[0]!),
      ),
      ...baseline.findings.slice(rawFindings.length),
    ]
  }

  return baseline.findings.map((baselineFinding) => {
    const llmRaw = rawFindings.find((raw) => {
      const o = asRecord(raw)
      if (!o) return false
      return (
        coerceString(o.label, "").toLowerCase() ===
        baselineFinding.label.trim().toLowerCase()
      )
    })

    if (!llmRaw) return baselineFinding

    const normalized = normalizeFinding(llmRaw, baselineFinding)

    if (isGoodBaselineFinding(baselineFinding)) {
      if (severityRank(normalized.severity) > severityRank(baselineFinding.severity)) {
        return baselineFinding
      }
      return normalized
    }

    return normalized
  })
}

const COMPETITIVE_SUPPLEMENTAL_LABEL_BLOCKLIST = [
  "competitor landscape",
  "market differentiation",
  "market positioning",
  "competitor visibility",
  "competitive landscape",
]

/** Extract domain-like tokens from SERP evidence for hallucination checks. */
function evidenceDomainTokens(evidence: string): Set<string> {
  const tokens = new Set<string>()
  const lower = evidence.toLowerCase()
  for (const match of lower.matchAll(
    /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/g,
  )) {
    const host = match[1]
    if (host) tokens.add(host)
  }
  return tokens
}

/**
 * Drop LLM competitive supplementals that duplicate the primary finding value,
 * use blocked generic labels, or invent business names not in SERP evidence.
 */
function filterCompetitiveSupplementals(
  candidates: ReportFinding[],
  primary: ReportFinding,
): ReportFinding[] {
  const primaryValue = primary.value.trim().toLowerCase()
  const evidenceBlob = `${primary.value} ${primary.detail}`.toLowerCase()
  const evidenceDomains = evidenceDomainTokens(evidenceBlob)

  return candidates.filter((f) => {
    const label = f.label.trim().toLowerCase()
    if (label === primary.label.trim().toLowerCase()) return false
    if (
      COMPETITIVE_SUPPLEMENTAL_LABEL_BLOCKLIST.some((blocked) =>
        label.includes(blocked),
      )
    ) {
      return false
    }
    if (f.value.trim().toLowerCase() === primaryValue) return false

    // Prefer zero supplementals over inventing rivals not present in evidence.
    // If detail names a Title Case multi-word business not found in evidence, drop.
    const inventedName = f.detail.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g,
    )
    if (inventedName) {
      for (const name of inventedName) {
        const normalized = name.toLowerCase()
        // Skip common non-business phrases
        if (
          /google|page|atlanta|level play|your business|competitors?/i.test(
            name,
          )
        ) {
          continue
        }
        if (!evidenceBlob.includes(normalized)) {
          return false
        }
      }
    }

    // Domain citations in supplemental must appear in primary evidence.
    const detailDomains = evidenceDomainTokens(f.detail)
    for (const domain of detailDomains) {
      if (!evidenceDomains.has(domain) && !evidenceBlob.includes(domain)) {
        return false
      }
    }

    return true
  })
}

function normalizeSection(raw: unknown, baseline: ReportSection): ReportSection {
  const o = asRecord(raw)
  if (!o) return baseline

  const rawFindings = Array.isArray(o.findings) ? o.findings : []

  let findings: ReportFinding[]
  if (baseline.id === "competitive_context" && baseline.findings[0]) {
    const primaryFinding = baseline.findings[0]
    // When primary already has SERP evidence, prefer baseline-only over
    // hallucinated "Market Positioning" / "Competitor Visibility" cards.
    const hasSerpEvidence = /#\d+\s+/.test(primaryFinding.detail)
    const supplemental = hasSerpEvidence
      ? []
      : filterCompetitiveSupplementals(
          rawFindings
            .slice(0, 2)
            .map((f, i) =>
              normalizeFinding(f, baseline.findings[i + 1] ?? primaryFinding),
            ),
          primaryFinding,
        )
    findings = [
      primaryFinding,
      ...supplemental,
      ...baseline.findings.slice(1 + supplemental.length),
    ]
  } else {
    findings = mergeFindingsWithGuardrails(rawFindings, baseline)
  }

  if (findings.length === 0) findings = baseline.findings
  findings = dedupeFindingsByLabel(findings)

  const score = coerceScore(o.score, baseline.score)
  const status = coerceStatus(o.status, baseline.status)
  const floored = applySearchFootprintScoreFloor(baseline, score, status)

  return {
    id: baseline.id,
    label: coerceString(o.label, baseline.label),
    status: floored.status,
    score: floored.score,
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

/**
 * Remove invented absolute score claims from LLM executive prose
 * (e.g. "78/100", "scores 78") so the UI score card stays authoritative.
 */
export function stripInventedScoreClaims(text: string): string {
  return text
    .replace(/\b\d{1,3}\s*\/\s*100\b/g, "")
    .replace(/\bscores?\s+\d{1,3}\b/gi, "")
    .replace(/\brated\s+\d{1,3}\s*(?:out\s+of\s+100|\/\s*100)?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, "")
    .trim()
}

function normalizeExecutiveSummary(
  raw: unknown,
  fallback: LevelstackReportJson["executiveSummary"],
): LevelstackReportJson["executiveSummary"] {
  const o = asRecord(raw)
  if (!o) return fallback

  const paragraphs = Array.isArray(o.paragraphs)
    ? o.paragraphs
        .map((p) =>
          typeof p === "string" ? stripInventedScoreClaims(p.trim()) : "",
        )
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
          REPORT_PIPELINE_DISCLAIMER,
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
