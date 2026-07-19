import type { AuditScoreBundle } from "@/lib/audit/types"
import { deriveOverallFromSections } from "@/lib/audit/derive-overall-from-sections"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
import {
  attachAiOverviewPreview,
  buildAiOverviewCheck,
} from "@/lib/pipeline/ai-overview-check"
import { marketLabelFromIntake } from "@/lib/pipeline/context"
import {
  FREE_TIER_SECTION_IDS,
  PAID_ONLY_SECTION_IDS,
} from "@/lib/pipeline/constants"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import {
  buildExecutiveSummaryFromResearch,
  buildSectionsFromResearch,
} from "@/lib/pipeline/serp-backed-sections"
import {
  extractPreviewCompetitor,
  parseSerpRowsFromDetail,
  resolvePreviewCompetitorFromBundle,
  serpDetailFromSections,
} from "@/lib/report/parse-serp-rows"
import type { CompetitorComparisonSource } from "@/lib/research/serp/competitor-resolve"
import { hostnameFromUrl } from "@/lib/research/serp"

function signalRows(signals: AuditScoreBundle["signals"]) {
  return signals.map((s) => ({
    label: s.label,
    value: s.status.toUpperCase(),
    percent:
      s.status === "pass"
        ? 100
        : s.status === "warning"
          ? 50
          : s.status === "unavailable"
            ? 50
            : 0,
    tone:
      s.status === "pass"
        ? ("green" as const)
        : s.status === "warning" || s.status === "unavailable"
          ? ("amber" as const)
          : ("red" as const),
  }))
}

const STRONG_TEASER_SOURCES = new Set<CompetitorComparisonSource>([
  "service_peer",
  "namesake",
  "intake",
])

/** Category peers for vague service queries are not credible free-teaser rivals. */
const WEAK_CATEGORY_TEASER_QUERY =
  /general business services|^business services$|^services$/i

function previewFromResolvedColumn(
  column: { domain: string; title?: string },
  detailSource: string,
): NonNullable<ReturnType<typeof extractPreviewCompetitor>> {
  const serpRows = parseSerpRowsFromDetail(detailSource, 20)
  const matched = serpRows.find((r) => r.domain === column.domain)
  return {
    rank: matched?.serpPosition ?? 1,
    domain: column.domain,
    title: column.title,
  }
}

export function extractUpgradeTeasers(
  allSections: ReportSection[],
  bundle: ResearchBundle,
  buyerHost?: string | null,
  brandName?: string,
): NonNullable<LevelstackReportJson["meta"]["upgradeTeasers"]> {
  const competitive = allSections.find((s) => s.id === "competitive_context")
  const search = allSections.find((s) => s.id === "search_footprint")

  const serviceFinding =
    competitive?.findings.find((f) => /service search/i.test(f.label)) ??
    competitive?.findings[0]

  const searchQuery =
    serviceFinding?.label.replace(/^Service search\s*—\s*/i, "").replace(/"/g, "") ??
    search?.findings[0]?.label.replace(/^Google\s*—\s*/i, "").replace(/"/g, "") ??
    "your primary service"

  const grid = competitive?.competitiveGrid
  const pageRow = grid?.rows.find((r) => /page 1/i.test(r.label))
  const youCell =
    pageRow?.youColumnIndex != null ? pageRow.cells[pageRow.youColumnIndex] : null

  let competitivePositionAlert = "Your position: See Competitive Context tab"
  if (youCell) {
    if (/not in top|not on page|—/i.test(youCell)) {
      competitivePositionAlert = "Your position: Not on Page 1"
    } else if (/^#\d+/.test(youCell)) {
      competitivePositionAlert = `Your position: ${youCell} on service search`
    } else {
      competitivePositionAlert = `Your position: ${youCell}`
    }
  } else if (search?.findings[0]?.value.match(/not in the top|not on page/i)) {
    competitivePositionAlert = "Your position: Not on Page 1"
  }

  const serpDomainCount = bundle.competitiveContext.competitorDomains.length
  const hashCount = serviceFinding?.detail.match(/#\d+/g)?.length ?? 0
  const rawCount = Math.max(serpDomainCount, hashCount)
  const competitorCount = rawCount > 0 ? Math.min(rawCount, 10) : undefined

  const detailSource = serpDetailFromSections(competitive, search)

  // P1.8.1 — prefer resolved grid rivals; never tease a weak category peer for
  // vague queries, and never fall back to unrelated brand-SERP co-rankers.
  const columns = bundle.competitiveContext.competitorColumns
  const strongColumn = columns.find((c) => STRONG_TEASER_SOURCES.has(c.source))
  const categoryColumn = columns.find((c) => c.source === "category_peer")
  const usableCategory =
    categoryColumn && !WEAK_CATEGORY_TEASER_QUERY.test(searchQuery)
      ? categoryColumn
      : undefined
  const resolvedColumn = strongColumn ?? usableCategory

  let previewCompetitor: ReturnType<typeof extractPreviewCompetitor>

  if (resolvedColumn) {
    previewCompetitor = previewFromResolvedColumn(resolvedColumn, detailSource)
  } else {
    previewCompetitor = resolvePreviewCompetitorFromBundle(
      bundle,
      buyerHost,
      brandName,
    )
    // Avoid re-introducing junk from competitive SERP detail when the category
    // query itself is too vague to name a credible rival.
    if (
      !previewCompetitor &&
      detailSource &&
      !WEAK_CATEGORY_TEASER_QUERY.test(searchQuery)
    ) {
      previewCompetitor = extractPreviewCompetitor(detailSource, buyerHost)
    }
  }

  return {
    competitivePositionAlert,
    competitiveSearchQuery: searchQuery,
    competitorCount: competitorCount ?? 0,
    previewCompetitor,
  }
}

export function assembleFreeReportFromResearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  audit: AuditScoreBundle,
  planId: string | null,
  searchFootprintOverride: ReportSection,
): LevelstackReportJson {
  const searchWithAi = attachAiOverviewPreview(
    searchFootprintOverride,
    buildAiOverviewCheck(intake, bundle),
  )
  const allSections = buildSectionsFromResearch(intake, bundle).map((s) =>
    s.id === "search_footprint" ? searchWithAi : s,
  )

  const sections = allSections.filter((s) => FREE_TIER_SECTION_IDS.has(s.id))
  const upgradeTeasers = extractUpgradeTeasers(
    allSections,
    bundle,
    hostnameFromUrl(intake.websiteUrl),
    intake.primaryBusinessName,
  )

  const executiveSummary = buildExecutiveSummaryFromResearch(
    intake,
    bundle,
    sections,
  )

  const rawPlan = buildActionPlanFromSections(sections, intake)
  const teaserActionCount =
    rawPlan.thisWeek.length + rawPlan.thisMonth.length + rawPlan.thisQuarter.length

  const actionPlan = {
    thisWeek: rawPlan.thisWeek.slice(0, 4),
    thisMonth: [] as typeof rawPlan.thisMonth,
    thisQuarter: [] as typeof rawPlan.thisQuarter,
  }
  executiveSummary.firstSteps = actionPlan.thisWeek.map((a) => a.task)

  const failCount = audit.signals.filter((s) => s.status === "fail").length
  const warnCount = audit.signals.filter((s) => s.status === "warning").length
  const findingCount = sections.reduce((n, s) => n + s.findings.length, 0)
  const { overallScore, letterGrade } = deriveOverallFromSections(sections)

  return {
    meta: {
      businessName: intake.primaryBusinessName,
      ownerName: intake.ownerName,
      marketLabel: marketLabelFromIntake(intake),
      reportDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      planId,
      reportTier: "free_snapshot",
      overallScore,
      letterGrade,
      totalFindings: findingCount + audit.insights.length,
      criticalCount: failCount,
      highCount: warnCount,
      mediumCount: 0,
      lowCount: audit.signals.filter((s) => s.status === "pass").length,
      issueCountForUpgrade: failCount + warnCount,
      lockedSectionCount: PAID_ONLY_SECTION_IDS.size,
      upgradeTeasers,
      teaserActionCount,
    },
    executiveSummary,
    sections,
    actionPlan,
    signalRows: signalRows(audit.signals),
    insights: audit.insights.map((i) => ({
      id: i.id,
      label: i.label,
      severity: i.severity,
      summary: i.summary,
      details: i.details,
    })),
  }
}
