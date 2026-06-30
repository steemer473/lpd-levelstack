import type { LevelstackReportJson, ReportFinding } from "@/lib/pipeline/report-types"
import {
  isGenericDirectoryListing,
  isSubjectReputationText,
} from "@/lib/research/reputation-parse"
import { isCustomerFacingFinding } from "@/lib/report/customer-copy"
import type {
  ExecutiveInsightPart,
  StructuredExecutiveInsights,
} from "@/lib/report/executive-insight-parts"
import { flattenExecutiveInsight } from "@/lib/report/executive-insight-parts"
import { PRODUCT_NAMES } from "@/lib/report/outcome-copy"

export { isGenericDirectoryListing } from "@/lib/research/reputation-parse"

/** Intake fields the Action Roadmap collects but the free snapshot form does not. */
export const FREE_SNAPSHOT_INTAKE_GAP = {
  reputation:
    "how you rate your reputation (1–10) and any complaints or negative reviews you're aware of",
  revenue:
    "ad spend, monthly budget, primary offer, and price positioning",
} as const

const PLACEHOLDER_REPUTATION_GAP =
  /You rated reputation \d+\/10\.\s*Intake note:\s*Not specified/i

const PLACEHOLDER_WHAT_PROSPECTS_SEE =
  /General business services at Not specified|at Not specified/i

const REPUTATION_SIGNAL_PATTERN =
  /★|review|complaint|negative|rating|trust|star|unclaimed|mixed|not captured/i

const REVENUE_SIGNAL_PATTERN =
  /cta|conversion|trust|title|speed|landing|offer|funnel|page speed|homepage|ad spend|message/i

export function isPlaceholderReputationGap(text: string): boolean {
  return PLACEHOLDER_REPUTATION_GAP.test(text)
}

/** True when a reputation finding reflects the subject business, not unrelated SERP noise. */
export function isAboutSubjectReputationFinding(
  finding: ReportFinding,
  businessName: string,
  ownerName: string,
): boolean {
  if (finding.value.includes("★")) return true

  return isSubjectReputationText(
    `${finding.label} ${finding.value} ${finding.detail}`,
    businessName,
    ownerName,
  )
}

function isBareNameFinding(
  value: string,
  businessName: string,
  ownerName: string,
): boolean {
  const trimmed = value.trim()
  if (!trimmed || REPUTATION_SIGNAL_PATTERN.test(trimmed)) return false

  const normalized = trimmed.toLowerCase()
  const names = [businessName, ownerName]
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)

  if (names.some((name) => normalized === name)) return true
  if (trimmed.length <= 48 && names.some((name) => normalized.includes(name))) {
    return !trimmed.includes("—")
  }
  return false
}

function severityRank(severity: ReportFinding["severity"]): number {
  if (severity === "critical") return 0
  if (severity === "high") return 1
  if (severity === "medium") return 2
  if (severity === "low") return 3
  return 4
}

function scoreReputationFinding(
  finding: ReportFinding,
  businessName: string,
  ownerName: string,
): number {
  const text = `${finding.value} ${finding.detail}`
  let score = 0

  if (REPUTATION_SIGNAL_PATTERN.test(text)) score += 12
  if (finding.value.includes("★")) score += 6
  if (/complaint|negative|unclaimed/i.test(text)) score += 4
  score += Math.max(0, 4 - severityRank(finding.severity))

  if (!isCustomerFacingFinding(finding.value)) score -= 20
  if (isBareNameFinding(finding.value, businessName, ownerName)) score -= 15
  if (isGenericDirectoryListing(finding.value)) score -= 25
  if (!isAboutSubjectReputationFinding(finding, businessName, ownerName)) score -= 25
  if (/no platform-specific review snippets captured/i.test(finding.value)) score -= 3

  return score
}

function reputationSectionSummary(report: LevelstackReportJson): string {
  const section = report.sections.find((s) => s.id === "online_reputation")
  if (!section) {
    return "Open the Reputation tab for review and trust signals we found in public search."
  }
  return `Your Reputation section scored ${section.score}/100 in this snapshot. Open the Reputation tab for platform-by-platform findings about ${report.meta.businessName}.`
}

/** Best customer-facing reputation finding for exec teaser (subject business only). */
export function pickReputationPublicSignal(
  report: LevelstackReportJson,
): string | undefined {
  const section = report.sections.find((s) => s.id === "online_reputation")
  if (!section?.findings.length) return undefined

  const { businessName, ownerName } = report.meta
  const ranked = [...section.findings].sort(
    (a, b) =>
      scoreReputationFinding(b, businessName, ownerName) -
      scoreReputationFinding(a, businessName, ownerName),
  )

  const best = ranked.find(
    (f) =>
      isCustomerFacingFinding(f.value) &&
      !isGenericDirectoryListing(f.value) &&
      isAboutSubjectReputationFinding(f, businessName, ownerName) &&
      scoreReputationFinding(f, businessName, ownerName) > 0,
  )

  return best?.value
}

function pickRevenuePublicSignal(report: LevelstackReportJson): string | undefined {
  const pools = [
    ...(report.sections.find((s) => s.id === "digital_presence")?.findings ?? []),
    ...(report.sections.find((s) => s.id === "search_footprint")?.findings ?? []),
  ]

  const match = pools.find(
    (f) =>
      isCustomerFacingFinding(f.value) &&
      REVENUE_SIGNAL_PATTERN.test(`${f.label} ${f.value} ${f.detail}`),
  )

  return match?.value ?? pools.find((f) => isCustomerFacingFinding(f.value))?.value
}

export function buildFreeTierWhatProspectsSeeParts(
  report: LevelstackReportJson,
): ExecutiveInsightPart[] {
  const { meta } = report
  const searchSection = report.sections.find((s) => s.id === "search_footprint")
  const publicSignal = searchSection?.findings.find((f) =>
    isCustomerFacingFinding(f.value),
  )?.value

  const parts: ExecutiveInsightPart[] = [
    {
      kind: "highlight",
      text: `When prospects search for ${meta.ownerName} or ${meta.businessName} in ${meta.marketLabel}, the first screen shapes trust before they book your services.`,
    },
    {
      kind: "text",
      text: "Findings are based on live Google search results and your website signals as of this report date.",
    },
  ]

  if (publicSignal) {
    parts.push({
      kind: "finding",
      prefix: "From public research:",
      text: publicSignal,
      suffix: "Open the Search footprint tab for the full read.",
    })
  } else {
    parts.push({
      kind: "text",
      text: "Open the Search footprint tab for what we found in live Google results.",
    })
  }

  return parts
}

export function buildFreeTierReputationGapParts(
  report: LevelstackReportJson,
): ExecutiveInsightPart[] {
  const publicSignal = pickReputationPublicSignal(report)

  const parts: ExecutiveInsightPart[] = [
    {
      kind: "text",
      text: "Reputation gap compares how you see your reputation with what prospects find in public search — review ratings, complaint patterns, and trust cues.",
    },
  ]

  if (publicSignal) {
    parts.push({
      kind: "finding",
      prefix: "From public research:",
      text: publicSignal,
      suffix: "Open the Reputation tab for all findings in this snapshot.",
    })
  } else {
    parts.push({
      kind: "highlight",
      text: reputationSectionSummary(report),
    })
  }

  parts.push(
    {
      kind: "muted",
      text: `This free snapshot includes public reputation research but does not ask about ${FREE_SNAPSHOT_INTAKE_GAP.reputation}.`,
    },
    {
      kind: "muted",
      text: `Upgrade to ${PRODUCT_NAMES.paid} ($97) to add your self-assessment and get a side-by-side reputation gap analysis.`,
    },
  )

  return parts
}

export function buildFreeTierRevenueRiskParts(
  report: LevelstackReportJson,
): ExecutiveInsightPart[] {
  const publicSignal = pickRevenuePublicSignal(report)

  const parts: ExecutiveInsightPart[] = [
    {
      kind: "text",
      text: "Revenue risk asks whether traffic and ad spend convert when trust signals, offer clarity, or landing-page experience do not match what prospects find online.",
    },
  ]

  if (publicSignal) {
    parts.push({
      kind: "finding",
      prefix: "From public research:",
      text: publicSignal,
      suffix: "See Search footprint and Digital presence for the full read.",
    })
  } else {
    parts.push({
      kind: "text",
      text: "See Search footprint and Digital presence for conversion-related signals from public research.",
    })
  }

  parts.push(
    {
      kind: "muted",
      text: `This free snapshot does not ask about ${FREE_SNAPSHOT_INTAKE_GAP.revenue}.`,
    },
    {
      kind: "muted",
      text: `Upgrade to ${PRODUCT_NAMES.paid} ($97) for funnel and ad-spend intake plus a prioritized revenue-risk diagnosis.`,
    },
  )

  return parts
}

export function buildFreeTierStructuredExecutiveInsights(
  report: LevelstackReportJson,
): StructuredExecutiveInsights | null {
  if (report.meta.reportTier !== "free_snapshot") return null

  return {
    whatProspectsSee: buildFreeTierWhatProspectsSeeParts(report),
    reputationGap: buildFreeTierReputationGapParts(report),
    revenueRisk: buildFreeTierRevenueRiskParts(report),
  }
}

export function buildFreeTierReputationGap(
  report: LevelstackReportJson,
): string {
  return flattenExecutiveInsight(buildFreeTierReputationGapParts(report))
}

export function buildFreeTierRevenueRisk(report: LevelstackReportJson): string {
  return flattenExecutiveInsight(buildFreeTierRevenueRiskParts(report))
}

export function buildFreeTierWhatProspectsSee(
  report: LevelstackReportJson,
): string {
  return flattenExecutiveInsight(buildFreeTierWhatProspectsSeeParts(report))
}

export function polishFreeTierWhatProspectsSee(text: string): string {
  if (!PLACEHOLDER_WHAT_PROSPECTS_SEE.test(text)) return text

  return text
    .replace(/\s+at Not specified\.?/gi, ".")
    .replace(/General business services/gi, "your services")
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function applyFreeTierExecutiveInsights(
  report: LevelstackReportJson,
  insights: {
    whatProspectsSee: string
    reputationGap: string
    revenueRisk: string
  },
): typeof insights {
  if (report.meta.reportTier !== "free_snapshot") return insights

  return {
    whatProspectsSee: buildFreeTierWhatProspectsSee(report),
    reputationGap: buildFreeTierReputationGap(report),
    revenueRisk: buildFreeTierRevenueRisk(report),
  }
}
