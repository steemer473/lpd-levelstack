import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { resolveDistinctHighlights } from "@/lib/report/executive-dedup"
import type { StructuredExecutiveInsights } from "@/lib/report/executive-insight-parts"
import {
  applyFreeTierExecutiveInsights,
  buildFreeTierStructuredExecutiveInsights,
} from "@/lib/report/free-tier-insights"
import {
  resolvePriorityFinding,
  type PriorityFinding,
} from "@/lib/report/free-executive-copy"
import {
  deriveBuyerHostFromReport,
  extractBusinessSearchRank,
  parseSerpRowsFromDetail,
  resolvePreviewCompetitorForReport,
  serpDetailFromSections,
} from "@/lib/report/parse-serp-rows"

export type ResolvedExecutiveContent = {
  insights: {
    whatProspectsSee: string
    reputationGap: string
    revenueRisk: string
  }
  structuredInsights?: StructuredExecutiveInsights
  highlights: {
    /** Null when no failed check / urgent adverse finding exists (clean scan). */
    criticalIssue: string | null
    priorityFinding: PriorityFinding | null
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
  businessRank?: number | null
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

/**
 * Resolve an adverse priority finding only.
 * Failed audit signals first, then urgent (critical/high) findings.
 * Never promotes a positive finding. Returns null on clean scans.
 */
export function ensureCriticalIssue(
  report: LevelstackReportJson,
  distinct: ReturnType<typeof resolveDistinctHighlights>,
): PriorityFinding | null {
  const urgent = report.sections
    .flatMap((section) =>
      section.findings.map((finding) => ({ ...finding, sectionId: section.id })),
    )
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .sort((a, b) => {
      const rank = (s: string) =>
        s === "critical" ? 0 : s === "high" ? 1 : 2
      return rank(a.severity) - rank(b.severity)
    })

  const fromUrgent = urgent.find((f) => f.value.trim())?.value.trim() ?? null

  const distinctIssue = distinct.criticalIssue?.trim()
  const distinctIsGeneric =
    !distinctIssue ||
    distinctIssue === "Review search footprint first." ||
    /\brank(?:s|ed)?\s*#?1\b/i.test(distinctIssue)

  return resolvePriorityFinding(report, {
    urgentFinding: fromUrgent ?? (distinctIsGeneric ? null : distinctIssue),
  })
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
            "Review the Search Visibility section for what prospects likely see today.",
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
  const priorityFinding = ensureCriticalIssue(report, distinct)

  return {
    insights,
    structuredInsights: buildFreeTierStructuredExecutiveInsights(report),
    highlights: {
      criticalIssue: priorityFinding?.fullText ?? null,
      priorityFinding,
      businessImpact: priorityFinding?.consequence ?? distinct.businessImpact,
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

  const buyerHost = deriveBuyerHostFromReport(report)

  const detailSource = serpDetailFromSections(competitive, search)
  const rows = parseSerpRowsFromDetail(detailSource, 3, buyerHost)
  const competitorCount = teasers?.competitorCount ?? rows.length

  const previewCompetitor = resolvePreviewCompetitorForReport(report)
  const previewRow: CompetitiveSnapshotRow | undefined = previewCompetitor
    ? {
        rank: 1,
        domain: previewCompetitor.domain,
        serpPosition: previewCompetitor.rank,
      }
    : rows[0]
      ? { rank: 1, domain: rows[0].domain, serpPosition: rows[0].serpPosition }
      : undefined

  const previewTitle = previewCompetitor?.title ?? rows[0]?.title
  const businessRank = extractBusinessSearchRank(report)

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
    businessRank,
  }
}
