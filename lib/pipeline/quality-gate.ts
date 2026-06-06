import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

const BOILERPLATE_PATTERNS = [
  /improve your seo/i,
  /boost (your )?visibility/i,
  /enhance (your )?online presence/i,
  /leverage social media/i,
  /optimize your funnel/i,
  /in today's digital landscape/i,
]

const EVIDENCE_PATTERNS = [
  /https?:\/\//i,
  /#\d+/,
  /position\s*#?\d+/i,
  /page\s*1/i,
  /\.com|\.org|\.net/i,
]

export type QualityGateResult = {
  passed: boolean
  warnings: string[]
}

export function runQualityGate(
  report: LevelstackReportJson,
  intake: LevelstackIntakeFormValues,
): QualityGateResult {
  const warnings: string[] = []
  const findings = report.sections.flatMap((s) => s.findings)
  const textBlob = [
    ...report.executiveSummary.paragraphs,
    report.executiveSummary.criticalIssue,
    ...findings.map((f) => `${f.value} ${f.detail}`),
    ...report.actionPlan.thisWeek.map((a) => `${a.task} ${a.sub ?? ""}`),
  ].join("\n")

  const evidenceCount = findings.filter(
    (f) =>
      EVIDENCE_PATTERNS.some((p) => p.test(f.detail) || p.test(f.value)),
  ).length

  if (evidenceCount < 3) {
    warnings.push(
      `Only ${evidenceCount} finding(s) cite URLs, positions, or domains (target ≥3).`,
    )
  }

  if (report.executiveSummary.paragraphs.length < 2) {
    warnings.push("Executive summary has fewer than 2 paragraphs.")
  }

  if (report.actionPlan.thisWeek.length > 4) {
    warnings.push("Action plan thisWeek exceeds 4 items.")
  }

  if (report.actionPlan.thisWeek.length === 0) {
    warnings.push("Action plan thisWeek is empty.")
  }

  const valueCounts = new Map<string, number>()
  for (const f of findings) {
    const key = f.value.trim().toLowerCase()
    valueCounts.set(key, (valueCounts.get(key) ?? 0) + 1)
  }
  const dupes = [...valueCounts.entries()].filter(([, n]) => n > 1)
  if (dupes.length > 2) {
    warnings.push(
      `${dupes.length} duplicate finding headline(s) across sections.`,
    )
  }

  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(textBlob)) {
      warnings.push(`Boilerplate phrase detected: ${pattern.source}`)
    }
  }

  if (intake.hasActiveAdSpend === "yes") {
    const funnelText =
      report.sections
        .find((s) => s.id === "revenue_funnel")
        ?.findings.map((f) => `${f.value} ${f.detail}`)
        .join(" ") ?? ""
    const execText = report.executiveSummary.paragraphs.join(" ")
    const mentionsAds =
      /ad\s|paid\s|spend|landing|traffic/i.test(funnelText) ||
      /ad\s|paid\s|spend|landing/i.test(execText)
    if (!mentionsAds) {
      warnings.push(
        "Intake reports active ad spend but funnel/exec copy does not address paid traffic.",
      )
    }
  }

  const linkedWeek = report.actionPlan.thisWeek.filter((a) => a.findingRef?.trim())
  if (linkedWeek.length < Math.min(2, report.actionPlan.thisWeek.length)) {
    warnings.push(
      "Fewer than 2 this-week actions include findingRef (finding linkage weak).",
    )
  }

  const businessNamed =
    report.executiveSummary.paragraphs.some(
      (p) =>
        p.includes(intake.primaryBusinessName) || p.includes(intake.ownerName),
    ) ||
    report.executiveSummary.criticalIssue.includes(intake.primaryBusinessName) ||
    (report.executiveSummary.insights?.whatProspectsSee.includes(
      intake.primaryBusinessName,
    ) ??
      false)

  if (!businessNamed) {
    warnings.push(
      "Executive summary does not mention business or owner name from intake.",
    )
  }

  const insights = report.executiveSummary.insights
  if (insights) {
    const insightBlob = [
      insights.whatProspectsSee,
      insights.reputationGap,
      insights.revenueRisk,
    ].join("\n")
    const insightEvidence = EVIDENCE_PATTERNS.filter((p) => p.test(insightBlob)).length
    if (insightEvidence < 2) {
      warnings.push(
        "Structured exec insights cite fewer than 2 evidence types (URL, position, domain).",
      )
    }
    for (const pattern of BOILERPLATE_PATTERNS) {
      if (pattern.test(insightBlob)) {
        warnings.push(`Exec insight boilerplate detected: ${pattern.source}`)
      }
    }
    if (intake.hasActiveAdSpend === "yes" && !/ad|paid|spend|landing/i.test(insights.revenueRisk)) {
      warnings.push(
        "Intake reports active ad spend but insights.revenueRisk does not address paid traffic.",
      )
    }
  } else {
    warnings.push(
      "Executive summary missing structured insights object (whatProspectsSee, reputationGap, revenueRisk).",
    )
  }

  const highlights = report.executiveSummary.highlights
  if (highlights) {
    if (!highlights.businessImpact.trim() || !highlights.highestLeverageOpportunity.trim()) {
      warnings.push("Executive highlights missing businessImpact or highestLeverageOpportunity.")
    }
  } else {
    warnings.push(
      "Executive summary missing highlights object (businessImpact, highestLeverageOpportunity).",
    )
  }

  return {
    passed: warnings.length === 0,
    warnings,
  }
}
