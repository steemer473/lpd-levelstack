import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { resolveDistinctHighlights } from "@/lib/report/executive-dedup"
import type { StructuredExecutiveInsights } from "@/lib/report/executive-insight-parts"
import {
  applyFreeTierExecutiveInsights,
  buildFreeTierStructuredExecutiveInsights,
} from "@/lib/report/free-tier-insights"
import {
  parseSerpRowsFromDetail,
} from "@/lib/report/parse-serp-rows"

export type ResolvedExecutiveContent = {
  insights: {
    whatProspectsSee: string
    reputationGap: string
    revenueRisk: string
  }
  structuredInsights?: StructuredExecutiveInsights
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
  competitorCount?: number
  previewTitle?: string
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
  const { executiveSummary: summary } = report

  const insights = applyFreeTierExecutiveInsights(
    report,
    hasStructuredInsights(summary)
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
        },
  )

  const distinct = resolveDistinctHighlights(report)

  return {
    insights,
    structuredInsights: buildFreeTierStructuredExecutiveInsights(report) ?? undefined,
    highlights: {
      criticalIssue: distinct.criticalIssue,
      businessImpact: distinct.businessImpact,
      highestLeverageOpportunity: distinct.highestLeverageOpportunity,
    },
    strengths: distinct.strengths,
    topOpportunities: distinct.topOpportunities,
  }
}

export function resolveCompetitiveSnapshot(
  report: LevelstackReportJson,
): CompetitiveSnapshot | null {
  const teasers = report.meta.upgradeTeasers
  const competitive = report.sections.find((s) => s.id === "competitive_context")
  const search = report.sections.find((s) => s.id === "search_footprint")

  if (!competitive && !search && !teasers) return null

  const serviceFinding =
    competitive?.findings.find((f) => /service search/i.test(f.label)) ??
    competitive?.findings[0]

  const searchQuery =
    teasers?.competitiveSearchQuery ??
    serviceFinding?.label.replace(/^Service search\s*—\s*/i, "").replace(/"/g, "") ??
    search?.findings[0]?.label.replace(/^Google\s*—\s*/i, "").replace(/"/g, "") ??
    "your primary service"

  const grid = competitive?.competitiveGrid
  const pageRow = grid?.rows.find((r) => /page 1/i.test(r.label))
  const youCell =
    pageRow?.youColumnIndex != null ? pageRow.cells[pageRow.youColumnIndex] : null

  let positionAlert = teasers?.competitivePositionAlert ?? "Your position: See Competitive Context tab"
  if (!teasers && youCell) {
    if (/not in top|not on page|—/i.test(youCell)) {
      positionAlert = "Your position: Not on Page 1"
    } else if (/^#\d+/.test(youCell)) {
      positionAlert = `Your position: ${youCell} on service search`
    } else {
      positionAlert = `Your position: ${youCell}`
    }
  } else if (!teasers && search?.findings[0]?.value.match(/not in the top|not on page/i)) {
    positionAlert = "Your position: Not on Page 1"
  }

  const competitiveDetail = serviceFinding?.detail?.trim()
  const detailSource =
    competitiveDetail ||
    search?.findings.find((f) => f.detail.includes("http"))?.detail ||
    ""

  const rows = parseSerpRowsFromDetail(detailSource)
  const competitorCount = teasers?.competitorCount ?? rows.length

  const previewFromMeta = teasers?.previewCompetitor
  const previewRow: CompetitiveSnapshotRow | undefined = previewFromMeta
    ? {
        rank: 1,
        domain: previewFromMeta.domain,
        serpPosition: previewFromMeta.rank,
      }
    : rows[0]
      ? { rank: 1, domain: rows[0].domain, serpPosition: rows[0].serpPosition }
      : undefined

  const previewTitle = previewFromMeta?.title ?? rows[0]?.title

  return {
    searchQuery,
    positionAlert,
    rows:
      report.meta.reportTier === "free_snapshot"
        ? previewRow
          ? [previewRow]
          : []
        : rows,
    competitorCount,
    previewTitle,
  }
}
