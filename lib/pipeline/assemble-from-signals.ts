import type { AuditScoreBundle, SignalStatus } from "@/lib/audit/types"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
import { marketLabelFromIntake } from "@/lib/pipeline/context"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"
import type { ReportTier } from "@/lib/levelstack-plans"
import { PAID_ONLY_SECTION_IDS } from "@/lib/pipeline/constants"

const AUTOMATOR_KEYWORDS =
  /index|snippet|meta|google business|gbp|social|local seo|schema|visibility/i

function severityFromStatus(status: SignalStatus) {
  if (status === "fail") return "critical" as const
  if (status === "warning") return "high" as const
  return "good" as const
}

function sectionStatus(signals: { status: SignalStatus }[]) {
  if (signals.some((s) => s.status === "fail")) return "critical" as const
  if (signals.some((s) => s.status === "warning")) return "attention" as const
  return "good" as const
}

function scoreFromSignals(signals: { status: SignalStatus }[]): number {
  if (signals.length === 0) return 70
  const pts = signals.map((s) =>
    s.status === "pass" ? 100 : s.status === "warning" ? 60 : 35,
  )
  return Math.round(pts.reduce((a, b) => a + b, 0) / pts.length)
}

function signalRows(signals: AuditScoreBundle["signals"]) {
  return signals.map((s) => ({
    label: s.label,
    value: s.status.toUpperCase(),
    percent: s.status === "pass" ? 100 : s.status === "warning" ? 50 : 0,
    tone: s.status === "pass" ? ("green" as const) : s.status === "warning" ? ("amber" as const) : ("red" as const),
  }))
}

export function buildSectionsFromSignals(
  intake: LevelstackIntakeFormValues,
  audit: AuditScoreBundle,
  reportTier: ReportTier,
  options?: { searchFootprintOverride?: ReportSection },
): ReportSection[] {
  const searchSignals = audit.signals.filter((s) =>
    ["google_indexing", "search_snippet_accuracy", "meta_og_completeness", "name_collision"].includes(
      s.id,
    ),
  )
  const offsiteSignals = audit.signals.filter((s) =>
    ["social_platform_coverage", "directory_presence", "third_party_mentions"].includes(s.id),
  )
  const infraSignals = audit.signals.filter((s) =>
    ["subdomain_exposure", "infrastructure_leakage"].includes(s.id),
  )
  const positioningSignals = audit.signals.filter((s) =>
    ["positioning_consistency"].includes(s.id),
  )

  const sections: ReportSection[] = [
    options?.searchFootprintOverride ?? {
      id: "search_footprint",
      label: "Search footprint",
      status: sectionStatus(searchSignals),
      score: scoreFromSignals(searchSignals),
      findings: searchSignals.map((s) => ({
        label: s.label,
        value: s.finding,
        detail: s.evidence.join(" · ") || "Based on automated search research.",
        severity: severityFromStatus(s.status),
      })),
      scoreRows: signalRows(searchSignals),
    },
    {
      id: "social_offsite",
      label: "Social & off-site presence",
      status: sectionStatus(offsiteSignals),
      score: scoreFromSignals(offsiteSignals),
      findings: offsiteSignals.map((s) => ({
        label: s.label,
        value: s.finding,
        detail: s.evidence.join(" · ") || "Directory and social scan.",
        severity: severityFromStatus(s.status),
      })),
      scoreRows: signalRows(offsiteSignals),
    },
  ]

  if (reportTier !== "free_snapshot") {
    sections.push(
      {
        id: "infrastructure_security",
        label: "Infrastructure & security",
        status: sectionStatus(infraSignals),
        score: scoreFromSignals(infraSignals),
        findings: [
          ...infraSignals.map((s) => ({
            label: s.label,
            value: s.finding,
            detail: s.evidence.join(" · "),
            severity: severityFromStatus(s.status),
          })),
          ...audit.insights
            .filter((i) =>
              ["subdomain_exposure", "infrastructure_leakage"].includes(i.id),
            )
            .map((i) => ({
              label: i.label,
              value: i.summary,
              detail: i.details.join("\n"),
              severity:
                i.severity === "high"
                  ? ("critical" as const)
                  : i.severity === "medium"
                    ? ("high" as const)
                    : ("medium" as const),
            })),
        ],
      },
      {
        id: "positioning_consistency",
        label: "Positioning consistency",
        status: sectionStatus(positioningSignals),
        score: scoreFromSignals(positioningSignals),
        findings: [
          ...positioningSignals.map((s) => ({
            label: s.label,
            value: s.finding,
            detail: s.evidence.join(" · "),
            severity: severityFromStatus(s.status),
          })),
          ...audit.insights
            .filter((i) => ["snippet_staleness", "name_collision"].includes(i.id))
            .map((i) => ({
              label: i.label,
              value: i.summary,
              detail: i.details.join("\n"),
              severity:
                i.severity === "high"
                  ? ("critical" as const)
                  : i.severity === "medium"
                    ? ("high" as const)
                    : ("medium" as const),
            })),
        ],
      },
      {
        id: "revenue_funnel",
        label: "Revenue funnel diagnosis",
        status: "attention",
        score: 62,
        findings: [
          {
            label: "Offer clarity",
            value: `${intake.primaryService} at ${intake.pricePoint}`,
            detail: intake.purchaseMotivation,
            severity: "medium",
          },
        ],
      },
      {
        id: "competitive_context",
        label: "Competitive context",
        status: "attention",
        score: 65,
        findings: [
          {
            label: "Market positioning",
            value: `Competing in a ${intake.geoMarket} market.`,
            detail: "Full competitive grid available in paid report synthesis.",
            severity: "medium",
          },
        ],
      },
    )
  }

  return sections
}

export function assembleReportFromSignals(
  intake: LevelstackIntakeFormValues,
  audit: AuditScoreBundle,
  planId: string | null,
  reportTier: ReportTier,
  options?: { searchFootprintOverride?: ReportSection },
): LevelstackReportJson {
  const sections = buildSectionsFromSignals(intake, audit, reportTier, options)
  const failCount = audit.signals.filter((s) => s.status === "fail").length
  const warnCount = audit.signals.filter((s) => s.status === "warning").length

  const topFinding =
    audit.signals.find((s) => s.status === "fail") ??
    audit.signals.find((s) => s.status === "warning")

  const actionPlanSource = sections.filter((s) => s.id !== "action_plan")
  const rawPlan = buildActionPlanFromSections(actionPlanSource, intake)

  const actionPlan =
    reportTier === "free_snapshot"
      ? rawPlan
      : {
          ...rawPlan,
          thisWeek: rawPlan.thisWeek.map((item) => ({
            ...item,
            automatorFlag: AUTOMATOR_KEYWORDS.test(`${item.task} ${item.sub ?? ""}`),
          })),
          thisMonth: rawPlan.thisMonth.map((item) => ({
            ...item,
            automatorFlag: AUTOMATOR_KEYWORDS.test(`${item.task} ${item.sub ?? ""}`),
          })),
          thisQuarter: rawPlan.thisQuarter.map((item) => ({
            ...item,
            automatorFlag: AUTOMATOR_KEYWORDS.test(`${item.task} ${item.sub ?? ""}`),
          })),
        }

  const lockedSectionCount = [...PAID_ONLY_SECTION_IDS].length

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
      reportTier,
      overallScore: audit.overallScore,
      letterGrade: audit.letterGrade,
      totalFindings: audit.signals.length + audit.insights.length,
      criticalCount: failCount,
      highCount: warnCount,
      mediumCount: 0,
      lowCount: audit.signals.filter((s) => s.status === "pass").length,
      issueCountForUpgrade: failCount + warnCount,
      lockedSectionCount:
        reportTier === "free_snapshot" ? lockedSectionCount : 0,
    },
    executiveSummary: {
      paragraphs: [
        `Your overall digital presence score is ${audit.overallScore}/100 (${audit.letterGrade}). This snapshot reflects what prospects find when they search for ${intake.primaryBusinessName}.`,
        topFinding
          ? `Top finding: ${topFinding.finding}`
          : "Your public presence signals are generally aligned.",
      ],
      criticalIssue:
        topFinding?.finding ??
        "No critical issues detected in the free snapshot scope.",
      firstSteps: actionPlan.thisWeek.map((a) => a.task),
      strengths: audit.signals
        .filter((s) => s.status === "pass")
        .slice(0, 3)
        .map((s) => s.label),
      topOpportunities: audit.signals
        .filter((s) => s.status !== "pass")
        .slice(0, 3)
        .map((s) => s.finding),
    },
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
