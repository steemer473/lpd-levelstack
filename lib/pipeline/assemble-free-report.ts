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
import { extractPreviewCompetitor } from "@/lib/report/parse-serp-rows"

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

  const competitorCount =
    bundle.competitiveContext.competitorDomains.length ||
    (serviceFinding?.detail.match(/#\d+/g)?.length ?? 0) ||
    3

  const competitiveDetail = serviceFinding?.detail?.trim()
  const detailSource =
    competitiveDetail ||
    search?.findings.find((f) => f.detail.includes("http"))?.detail ||
    ""

  const previewCompetitor = detailSource
    ? extractPreviewCompetitor(detailSource)
    : undefined

  return {
    competitivePositionAlert,
    competitiveSearchQuery: searchQuery,
    competitorCount: Math.min(competitorCount, 10),
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
  const upgradeTeasers = extractUpgradeTeasers(allSections, bundle)

  const executiveSummary = buildExecutiveSummaryFromResearch(
    intake,
    bundle,
    sections,
  )

  const rawPlan = buildActionPlanFromSections(sections, intake)
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
