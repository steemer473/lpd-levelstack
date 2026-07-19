import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"
import {
  isCustomerFacingFinding,
  isInternalLimitation,
  polishCustomerFindingCopy,
} from "@/lib/report/customer-copy"

const URGENT_SECTION_PRIORITY = [
  "search_footprint",
  "digital_presence",
  "online_reputation",
  "revenue_funnel",
  "competitive_context",
] as const

const LEVERAGE_SECTION_PRIORITY = [
  "digital_presence",
  "online_reputation",
  "search_footprint",
] as const

export function normalizeFindingKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "")
    .trim()
    .slice(0, 120)
}

type FindingWithSection = ReportFinding & {
  sectionId: string
  sectionScore: number | null
}

function flattenFindings(sections: ReportSection[]): FindingWithSection[] {
  return sections.flatMap((section) =>
    section.findings.map((finding) => ({
      ...finding,
      sectionId: section.id,
      sectionScore: section.score,
    })),
  )
}

function severityRank(severity: ReportFinding["severity"]): number {
  if (severity === "critical") return 0
  if (severity === "high") return 1
  if (severity === "medium") return 2
  if (severity === "low") return 3
  return 4
}

function sortUrgent(findings: FindingWithSection[]): FindingWithSection[] {
  return [...findings].sort((a, b) => {
    const sev = severityRank(a.severity) - severityRank(b.severity)
    if (sev !== 0) return sev
    const aIdx = URGENT_SECTION_PRIORITY.indexOf(
      a.sectionId as (typeof URGENT_SECTION_PRIORITY)[number],
    )
    const bIdx = URGENT_SECTION_PRIORITY.indexOf(
      b.sectionId as (typeof URGENT_SECTION_PRIORITY)[number],
    )
    const aOrder = aIdx === -1 ? 99 : aIdx
    const bOrder = bIdx === -1 ? 99 : bIdx
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a.sectionScore ?? 999) - (b.sectionScore ?? 999)
  })
}

export function pickDistinctFindings(
  findings: FindingWithSection[],
  excludeKeys: Set<string>,
  limit: number,
): string[] {
  const picked: string[] = []
  for (const finding of findings) {
    if (!isCustomerFacingFinding(finding.value)) continue
    const key = normalizeFindingKey(finding.value)
    if (!key || excludeKeys.has(key)) continue
    excludeKeys.add(key)
    picked.push(polishCustomerFindingCopy(finding.value))
    if (picked.length >= limit) break
  }
  return picked
}

function sectionLabel(sectionId: string): string {
  const labels: Record<string, string> = {
    search_footprint: "search footprint",
    online_reputation: "reputation",
    digital_presence: "digital presence",
    revenue_funnel: "revenue funnel",
    competitive_context: "competitive context",
  }
  return labels[sectionId] ?? "public presence"
}

function buildBusinessImpact(
  criticalFinding: FindingWithSection | undefined,
  businessName: string,
  primaryService: string | undefined,
  fallback?: string,
): string {
  if (fallback && !fallback.toLowerCase().includes(criticalFinding?.value.toLowerCase() ?? "")) {
    return fallback
  }
  if (!criticalFinding) {
    return `Unresolved gaps can reduce trust and marketing efficiency for ${businessName}.`
  }
  const theme = sectionLabel(criticalFinding.sectionId)
  const service = primaryService ?? "your services"
  return `Unresolved ${theme} gaps can waste marketing spend and slow trust before prospects book ${service}.`
}

export type DistinctExecutiveHighlights = {
  criticalIssue: string
  businessImpact: string
  highestLeverageOpportunity: string
  strengths: string[]
  topOpportunities: string[]
}

export function computeDistinctHighlightsFromSections(
  sections: ReportSection[],
  businessName: string,
  options?: {
    primaryService?: string
    criticalIssue?: string
    highlights?: LevelstackReportJson["executiveSummary"]["highlights"]
    strengths?: string[]
    topOpportunities?: string[]
  },
): DistinctExecutiveHighlights {
  const allFindings = flattenFindings(sections.filter((s) => s.id !== "action_plan"))

  const urgent = sortUrgent(
    allFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  )
  const positive = allFindings.filter((f) => f.severity === "good" || f.severity === "low")

  const usedKeys = new Set<string>()

  const criticalFinding =
    urgent.find(
      (f) => f.sectionId === "search_footprint" && isCustomerFacingFinding(f.value),
    ) ?? urgent.find((f) => isCustomerFacingFinding(f.value))

  const criticalIssue = polishCustomerFindingCopy(
    criticalFinding?.value ??
      (options?.criticalIssue && isCustomerFacingFinding(options.criticalIssue)
        ? options.criticalIssue
        : undefined) ??
      "Review search footprint first.",
  )
  if (criticalIssue) usedKeys.add(normalizeFindingKey(criticalIssue))

  const leveragePool = sortUrgent(
    allFindings.filter(
      (f) =>
        (f.severity === "critical" || f.severity === "high") &&
        LEVERAGE_SECTION_PRIORITY.includes(
          f.sectionId as (typeof LEVERAGE_SECTION_PRIORITY)[number],
        ) &&
        f.sectionId !== criticalFinding?.sectionId,
    ),
  )

  let leveragePicked = pickDistinctFindings(leveragePool, usedKeys, 1)
  if (leveragePicked.length === 0) {
    leveragePicked = pickDistinctFindings(urgent, usedKeys, 1)
  }
  const highestLeverageOpportunity = polishCustomerFindingCopy(
    leveragePicked[0] ??
      (options?.highlights?.highestLeverageOpportunity &&
      isCustomerFacingFinding(options.highlights.highestLeverageOpportunity)
        ? options.highlights.highestLeverageOpportunity
        : undefined) ??
      (positive.find((f) => isCustomerFacingFinding(f.value))?.value ??
        `Improve ${sectionLabel(
          [...sections]
            .filter(
              (s) =>
                typeof s.score === "number" && Number.isFinite(s.score),
            )
            .sort((a, b) => (a.score as number) - (b.score as number))[0]
            ?.id ?? "search_footprint",
        )} to strengthen how prospects evaluate ${businessName}.`),
  )

  if (highestLeverageOpportunity) {
    usedKeys.add(normalizeFindingKey(highestLeverageOpportunity))
  }

  const businessImpact = buildBusinessImpact(
    criticalFinding,
    businessName,
    options?.primaryService,
    options?.highlights?.businessImpact,
  )

  const curatedStrengths = options?.strengths
  const strengthsSource =
    curatedStrengths ?? pickDistinctFindings(positive, new Set(), 3)

  const strengths = strengthsSource
    .map(polishCustomerFindingCopy)
    .filter((s) => {
      if (isInternalLimitation(s)) return false
      if (!curatedStrengths && !isCustomerFacingFinding(s)) return false
      const key = normalizeFindingKey(s)
      if (usedKeys.has(key)) return false
      usedKeys.add(key)
      return true
    })

  const curatedOpportunities = options?.topOpportunities
  const opportunitiesSource =
    curatedOpportunities ?? pickDistinctFindings(urgent, new Set(), 3)

  const topOpportunities = opportunitiesSource
    .map(polishCustomerFindingCopy)
    .filter((s) => {
      if (isInternalLimitation(s)) return false
      if (!curatedOpportunities && !isCustomerFacingFinding(s)) return false
      const key = normalizeFindingKey(s)
      if (usedKeys.has(key)) return false
      usedKeys.add(key)
      return true
    })

  if (strengths.length === 0) {
    const mediumWins = allFindings.filter(
      (f) =>
        f.severity === "medium" &&
        isCustomerFacingFinding(f.value) &&
        /position #?\d|listing found|indexed|verified|complete|rating|ranks|appears on page/i.test(
          f.value,
        ),
    )
    for (const text of pickDistinctFindings(mediumWins, usedKeys, 2)) {
      strengths.push(polishCustomerFindingCopy(text))
    }
  }

  if (strengths.length === 0) {
    const bestSection = [...sections]
      .filter(
        (s) =>
          s.id !== "action_plan" &&
          typeof s.score === "number" &&
          Number.isFinite(s.score),
      )
      .sort((a, b) => (b.score as number) - (a.score as number))[0]
    if (bestSection && (bestSection.score as number) >= 50) {
      const fallback = `${bestSection.label} scored ${bestSection.score}/100 — your strongest area in this snapshot.`
      const key = normalizeFindingKey(fallback)
      if (!usedKeys.has(key)) {
        usedKeys.add(key)
        strengths.push(fallback)
      }
    }
  }

  if (topOpportunities.length === 0) {
    const mediumPool = allFindings.filter(
      (f) => f.severity === "medium" && isCustomerFacingFinding(f.value),
    )
    for (const text of pickDistinctFindings(mediumPool, usedKeys, 3)) {
      topOpportunities.push(polishCustomerFindingCopy(text))
    }
  }

  if (topOpportunities.length === 0) {
    const weakerSections = [...sections]
      .filter(
        (s) =>
          s.id !== "action_plan" &&
          typeof s.score === "number" &&
          Number.isFinite(s.score),
      )
      .sort((a, b) => (a.score as number) - (b.score as number))
    for (const section of weakerSections) {
      const finding = section.findings.find((f) => isCustomerFacingFinding(f.value))
      if (!finding) continue
      const picked = pickDistinctFindings(
        [{ ...finding, sectionId: section.id, sectionScore: section.score }],
        usedKeys,
        1,
      )
      if (picked[0]) {
        topOpportunities.push(polishCustomerFindingCopy(picked[0]))
      }
      if (topOpportunities.length >= 2) break
    }
  }

  if (topOpportunities.length === 0) {
    const weakest = [...sections]
      .filter(
        (s) =>
          s.id !== "action_plan" &&
          typeof s.score === "number" &&
          Number.isFinite(s.score),
      )
      .sort((a, b) => (a.score as number) - (b.score as number))[0]
    if (weakest) {
      const fallback = `Focus next on ${sectionLabel(weakest.id)} (${weakest.score}/100) — your lowest-scoring area in this snapshot.`
      const key = normalizeFindingKey(fallback)
      if (!usedKeys.has(key)) {
        usedKeys.add(key)
        topOpportunities.push(fallback)
      }
    }
  }

  return {
    criticalIssue,
    businessImpact,
    highestLeverageOpportunity,
    strengths,
    topOpportunities,
  }
}

export function resolveDistinctHighlights(
  report: LevelstackReportJson,
): DistinctExecutiveHighlights {
  const { executiveSummary: summary, sections, meta } = report
  return computeDistinctHighlightsFromSections(sections, meta.businessName, {
    criticalIssue: summary.criticalIssue,
    highlights: summary.highlights,
    strengths: summary.strengths,
    topOpportunities: summary.topOpportunities,
  })
}

export function filterDistinctActionTasks(
  tasks: { task: string }[],
  excludeTexts: string[],
): { task: string }[] {
  const excludeKeys = new Set(excludeTexts.map(normalizeFindingKey))
  return tasks
    .map((item) => ({ task: polishCustomerFindingCopy(item.task) }))
    .filter((item) => !excludeKeys.has(normalizeFindingKey(item.task)))
}
