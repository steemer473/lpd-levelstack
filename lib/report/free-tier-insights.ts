import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { joinReportCopyParagraphs } from "@/lib/report/format-report-copy"

/** Intake fields the full report collects but the free snapshot form does not. */
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

export function isPlaceholderReputationGap(text: string): boolean {
  return PLACEHOLDER_REPUTATION_GAP.test(text)
}

export function buildFreeTierReputationGap(
  report: LevelstackReportJson,
): string {
  const reputationSection = report.sections.find((s) => s.id === "online_reputation")
  const publicSignal = reputationSection?.findings[0]?.value

  const researchLine = publicSignal
    ? `From public research so far: ${publicSignal}`
    : "Open the Reputation tab for signals we found from public search."

  return joinReportCopyParagraphs([
    "Reputation Gap compares your self-assessment with what prospects see publicly — review ratings, complaint patterns, and trust cues in search results.",
    `The free snapshot only collects your business name, website, and market. It does not ask about ${FREE_SNAPSHOT_INTAKE_GAP.reputation}, so that comparison is not shown here.`,
    `${researchLine} Upgrade to the Full Report ($97) to add those intake answers and a complete reputation gap analysis.`,
  ])
}

export function buildFreeTierRevenueRisk(): string {
  return joinReportCopyParagraphs([
    "Revenue Risk looks at whether paid or organic traffic may underperform when trust signals, offer clarity, or landing-page experience do not match what prospects find online.",
    `The free snapshot does not ask about ${FREE_SNAPSHOT_INTAKE_GAP.revenue}, so this card stays limited to high-level conversion signals from public research.`,
    "See Search footprint and Digital presence for what we measured. The Full Report ($97) adds funnel and ad-spend intake for a full revenue-risk read.",
  ])
}

export function buildFreeTierWhatProspectsSee(
  report: LevelstackReportJson,
): string {
  const { meta } = report
  const searchSection = report.sections.find((s) => s.id === "search_footprint")
  const publicSignal = searchSection?.findings[0]?.value

  return joinReportCopyParagraphs([
    `When prospects search for ${meta.ownerName} or ${meta.businessName} in ${meta.marketLabel}, the first screen shapes trust before they book your services.`,
    "Findings are based on live Google search results and your website signals as of this report date.",
    publicSignal
      ? `From public research so far: ${publicSignal}`
      : "Open the Search footprint tab for what we found in live Google results.",
  ])
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
    revenueRisk: buildFreeTierRevenueRisk(),
  }
}
