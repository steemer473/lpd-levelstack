import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { hostnameFromUrl } from "@/lib/research/serp"

export type ResolvedExecutiveContent = {
  insights: {
    whatProspectsSee: string
    reputationGap: string
    revenueRisk: string
  }
  highlights: {
    criticalIssue: string
    businessImpact: string
    highestLeverageOpportunity: string
  }
  strengths: string[]
  topOpportunities: string[]
}

export type CompetitiveSnapshotRow = {
  rank: number
  domain: string
  serpPosition: number
}

export type CompetitiveSnapshot = {
  searchQuery: string
  positionAlert: string
  rows: CompetitiveSnapshotRow[]
}

function hasStructuredInsights(
  summary: LevelstackReportJson["executiveSummary"],
): boolean {
  return Boolean(
    summary.insights?.whatProspectsSee &&
      summary.insights.reputationGap &&
      summary.insights.revenueRisk,
  )
}

export function resolveExecutiveContent(
  report: LevelstackReportJson,
): ResolvedExecutiveContent {
  const { executiveSummary: summary, sections } = report
  const allFindings = sections.flatMap((s) => s.findings)

  const insights = hasStructuredInsights(summary)
    ? summary.insights!
    : {
        whatProspectsSee:
          summary.paragraphs[0] ??
          "Review the Search footprint section for what prospects likely see today.",
        reputationGap:
          summary.paragraphs[1] ??
          "Compare your self-assessment with reputation findings in this report.",
        revenueRisk:
          summary.paragraphs[2] ??
          summary.paragraphs[summary.paragraphs.length - 1] ??
          "See Revenue funnel for conversion and ad-spend risks.",
      }

  const highlights = summary.highlights ?? {
    businessImpact:
      summary.paragraphs.find((p) => /marketing|convert|trust|spend/i.test(p)) ??
      `Unresolved gaps can reduce trust and marketing efficiency for ${report.meta.businessName}.`,
    highestLeverageOpportunity:
      allFindings.find((f) => f.severity === "high" || f.severity === "critical")
        ?.value ??
      sections
        .filter((s) => s.id !== "action_plan")
        .sort((a, b) => a.score - b.score)[0]?.label ??
      "Review section scores and prioritize the lowest-scoring area first.",
  }

  const strengths =
    summary.strengths ??
    allFindings
      .filter((f) => f.severity === "good" || f.severity === "low")
      .slice(0, 3)
      .map((f) => f.value)

  const topOpportunities =
    summary.topOpportunities ??
    allFindings
      .filter((f) => f.severity === "critical" || f.severity === "high")
      .slice(0, 3)
      .map((f) => f.value)

  return {
    insights,
    highlights: {
      criticalIssue: summary.criticalIssue,
      businessImpact: highlights.businessImpact,
      highestLeverageOpportunity: highlights.highestLeverageOpportunity,
    },
    strengths,
    topOpportunities,
  }
}

function parseSerpRowsFromDetail(detail: string): CompetitiveSnapshotRow[] {
  const rows: CompetitiveSnapshotRow[] = []
  const pattern = /#(\d+)\s+[^(;]+?\((https?:\/\/[^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(detail)) !== null && rows.length < 3) {
    const position = Number.parseInt(match[1]!, 10)
    const domain = hostnameFromUrl(match[2]!) ?? match[2]!
    if (!Number.isNaN(position) && domain) {
      rows.push({ rank: rows.length + 1, domain, serpPosition: position })
    }
  }
  return rows
}

export function resolveCompetitiveSnapshot(
  report: LevelstackReportJson,
): CompetitiveSnapshot | null {
  const competitive = report.sections.find((s) => s.id === "competitive_context")
  const search = report.sections.find((s) => s.id === "search_footprint")
  if (!competitive && !search) return null

  const serviceFinding =
    competitive?.findings.find((f) => /service search/i.test(f.label)) ??
    competitive?.findings[0]
  const searchQuery =
    serviceFinding?.label.replace(/^Service search\s*—\s*/i, "").replace(/"/g, "") ??
    search?.findings[0]?.label.replace(/^Google\s*—\s*/i, "").replace(/"/g, "") ??
    "your primary service"

  const grid = competitive?.competitiveGrid
  const pageRow = grid?.rows.find((r) => /page 1/i.test(r.label))
  const youCell = pageRow?.youColumnIndex != null ? pageRow.cells[pageRow.youColumnIndex] : null

  let positionAlert = "Your position: See Competitive Context tab"
  if (youCell) {
    if (/not in top|not on page|—/i.test(youCell)) {
      positionAlert = "Your position: Not on Page 1"
    } else if (/^#\d+/.test(youCell)) {
      positionAlert = `Your position: ${youCell} on service search`
    } else {
      positionAlert = `Your position: ${youCell}`
    }
  } else if (search?.findings[0]?.value.match(/not in the top|not on page/i)) {
    positionAlert = "Your position: Not on Page 1"
  }

  const detailSource =
    serviceFinding?.detail ??
    search?.findings.find((f) => f.detail.includes("http"))?.detail ??
    ""
  const rows = parseSerpRowsFromDetail(detailSource)

  return {
    searchQuery,
    positionAlert,
    rows,
  }
}
