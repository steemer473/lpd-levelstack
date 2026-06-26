import type { AuditScoreBundle } from "@/lib/audit/types"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
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
import { hostnameFromUrl } from "@/lib/research/serp"

function signalRows(signals: AuditScoreBundle["signals"]) {
  return signals.map((s) => ({
    label: s.label,
    value: s.status.toUpperCase(),
    percent: s.status === "pass" ? 100 : s.status === "warning" ? 50 : 0,
    tone:
      s.status === "pass"
        ? ("green" as const)
        : s.status === "warning"
          ? ("amber" as const)
          : ("red" as const),
  }))
}

export function extractUpgradeTeasers(
  allSections: ReportSection[],
  bundle: ResearchBundle,
  buyerHost?: string | null,
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

  // P1.8.1 — align the conversion trigger to the resolved grid rival.
  // competitor shown in the grid, not raw SERP #1 (which can be a directory or
  // unrelated brand after P1.7–P1.8 filtering).
  const resolvedColumn = bundle.competitiveContext.competitorColumns[0]
  let previewCompetitor: ReturnType<typeof extractPreviewCompetitor>

  if (resolvedColumn) {
    // Try to find the resolved rival's SERP position in the stored detail string
    // (service SERP). Category peers won't appear there, so rank defaults to 1
    // — they are #1 for the category + market query, which is what the tease copy conveys.
    const serpRows = parseSerpRowsFromDetail(detailSource, 20)
    const matched = serpRows.find((r) => r.domain === resolvedColumn.domain)
    previewCompetitor = {
      rank: matched?.serpPosition ?? 1,
      domain: resolvedColumn.domain,
      title: resolvedColumn.title,
    }
  } else {
    previewCompetitor =
      resolvePreviewCompetitorFromBundle(bundle, buyerHost) ??
      (detailSource ? extractPreviewCompetitor(detailSource, buyerHost) : undefined)
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
  const allSections = buildSectionsFromResearch(intake, bundle).map((s) =>
    s.id === "search_footprint" ? searchFootprintOverride : s,
  )

  const sections = allSections.filter((s) => FREE_TIER_SECTION_IDS.has(s.id))
  const upgradeTeasers = extractUpgradeTeasers(
    allSections,
    bundle,
    hostnameFromUrl(intake.websiteUrl),
  )

  const executiveSummary = buildExecutiveSummaryFromResearch(
    intake,
    bundle,
    sections,
  )

  const rawPlan = buildActionPlanFromSections(allSections, intake)
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
      overallScore: audit.overallScore,
      letterGrade: audit.letterGrade,
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
