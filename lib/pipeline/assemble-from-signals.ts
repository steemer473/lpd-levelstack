import type { AuditScoreBundle, SignalStatus } from "@/lib/audit/types"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
import { marketLabelFromIntake } from "@/lib/pipeline/context"
import {
  PAID_ONLY_SECTION_IDS,
} from "@/lib/pipeline/constants"
import { extractUpgradeTeasers } from "@/lib/pipeline/assemble-free-report"
import { hostnameFromUrl } from "@/lib/research/serp"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"
import type { ReportTier } from "@/lib/levelstack-plans"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"

const SEO_AUTOMATOR_KEYWORDS =
  /index|snippet|meta|google business|gbp|social|local seo|schema|visibility|search|seo|ai search/i
const WORKFLOW_AUTOMATOR_KEYWORDS =
  /workflow|process|handoff|follow-up|crm|pipeline|onboard|intake|automation|deliverable|ops/i

function automatorMatch(text: string): { flag: boolean; product?: "seo" | "workflow" } {
  if (WORKFLOW_AUTOMATOR_KEYWORDS.test(text)) {
    return { flag: true, product: "workflow" }
  }
  if (SEO_AUTOMATOR_KEYWORDS.test(text)) {
    return { flag: true, product: "seo" }
  }
  return { flag: false }
}

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
    tone:
      s.status === "pass" ? ("green" as const) : s.status === "warning" ? ("amber" as const) : ("red" as const),
  }))
}

function mapFinding(s: AuditScoreBundle["signals"][number]) {
  return {
    label: s.label,
    value: s.finding,
    detail: s.evidence.join(" · ") || "Based on automated audit signals.",
    severity: severityFromStatus(s.status),
  }
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
  const socialSignals = audit.signals.filter((s) =>
    ["social_platform_coverage"].includes(s.id),
  )
  const reputationSignals = audit.signals.filter((s) =>
    ["directory_presence", "third_party_mentions"].includes(s.id),
  )
  const digitalSignals = audit.signals.filter((s) =>
    [
      "subdomain_exposure",
      "infrastructure_leakage",
      "positioning_consistency",
    ].includes(s.id),
  )

  const reputationInsights = audit.insights
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
    }))

  const digitalInsights = audit.insights
    .filter((i) => ["subdomain_exposure", "infrastructure_leakage"].includes(i.id))
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
    }))

  const sections: ReportSection[] = [
    options?.searchFootprintOverride ?? {
      id: "search_footprint",
      label: "Search footprint",
      status: sectionStatus(searchSignals),
      score: scoreFromSignals(searchSignals),
      findings: searchSignals.map(mapFinding),
      scoreRows: signalRows(searchSignals),
    },
    {
      id: "social_offsite",
      label: "Social & off-site presence",
      status: sectionStatus(socialSignals),
      score: scoreFromSignals(socialSignals),
      findings:
        socialSignals.length > 0
          ? socialSignals.map(mapFinding)
          : [
              {
                label: "Social platforms",
                value: "Social coverage not scored from signals",
                detail: "Run live research for LinkedIn and Facebook search presence.",
                severity: "medium" as const,
              },
            ],
    },
  ]

  if (reportTier !== "free_snapshot") {
    sections.push(
      {
        id: "online_reputation",
        label: "Reputation",
        status: sectionStatus(reputationSignals),
        score: scoreFromSignals(reputationSignals),
        findings: [
          ...reputationSignals.map(mapFinding),
          ...reputationInsights,
          ...(reputationSignals.length === 0 && reputationInsights.length === 0
            ? [
                {
                  label: "Reputation self-assessment",
                  value: `You rated reputation ${intake.reputationScale}/10`,
                  detail: intake.complaintsAwareness.slice(0, 300),
                  severity:
                    intake.reputationScale <= 6
                      ? ("high" as const)
                      : ("medium" as const),
                },
              ]
            : []),
        ],
      },
      {
        id: "digital_presence",
        label: "Digital presence",
        status: sectionStatus(digitalSignals),
        score: scoreFromSignals(digitalSignals),
        findings: [...digitalSignals.map(mapFinding), ...digitalInsights],
        scoreRows: signalRows(digitalSignals),
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
  const allSections = buildSectionsFromSignals(intake, audit, "full_report", options)
  const sections =
    reportTier === "free_snapshot"
      ? buildSectionsFromSignals(intake, audit, reportTier, options)
      : allSections

  const failCount = audit.signals.filter((s) => s.status === "fail").length
  const warnCount = audit.signals.filter((s) => s.status === "warning").length

  const topFinding =
    audit.signals.find((s) => s.status === "fail") ??
    audit.signals.find((s) => s.status === "warning")

  const actionPlanSource = sections.filter((s) => s.id !== "action_plan")
  const rawPlan = buildActionPlanFromSections(actionPlanSource, intake)

  const actionPlan =
    reportTier === "free_snapshot"
      ? {
          thisWeek: rawPlan.thisWeek.slice(0, 4),
          thisMonth: [] as typeof rawPlan.thisMonth,
          thisQuarter: [] as typeof rawPlan.thisQuarter,
        }
      : {
          ...rawPlan,
          thisWeek: rawPlan.thisWeek.map((item) => {
            const m = automatorMatch(`${item.task} ${item.sub ?? ""}`)
            return {
              ...item,
              automatorFlag: m.flag,
              ...(m.product ? { automatorProduct: m.product } : {}),
            }
          }),
          thisMonth: rawPlan.thisMonth.map((item) => {
            const m = automatorMatch(`${item.task} ${item.sub ?? ""}`)
            return {
              ...item,
              automatorFlag: m.flag,
              ...(m.product ? { automatorProduct: m.product } : {}),
            }
          }),
          thisQuarter: rawPlan.thisQuarter.map((item) => {
            const m = automatorMatch(`${item.task} ${item.sub ?? ""}`)
            return {
              ...item,
              automatorFlag: m.flag,
              ...(m.product ? { automatorProduct: m.product } : {}),
            }
          }),
        }

  const upgradeTeasers =
    reportTier === "free_snapshot"
      ? extractUpgradeTeasers(allSections, emptyResearchBundle(), hostnameFromUrl(intake.websiteUrl))
      : undefined

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
        reportTier === "free_snapshot" ? PAID_ONLY_SECTION_IDS.size : 0,
      upgradeTeasers,
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
