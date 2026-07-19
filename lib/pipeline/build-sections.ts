import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { deriveOverallFromSections } from "@/lib/audit/derive-overall-from-sections"
import { TERMS } from "@/lib/report/customer-terms"

import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
import { marketLabelFromIntake } from "@/lib/pipeline/context"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"

export { buildActionPlanFromSections as buildActionPlan } from "@/lib/pipeline/action-plan"

function scoreFromFindings(
  findings: { severity: string }[],
): { score: number; status: "critical" | "attention" | "good" } {
  if (findings.some((f) => f.severity === "critical")) {
    return { score: 42, status: "critical" }
  }
  if (findings.some((f) => f.severity === "high" || f.severity === "medium")) {
    return { score: 62, status: "attention" }
  }
  return { score: 78, status: "good" }
}

async function fetchWebsiteSnippet(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
    })
    const html = await res.text()
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    return title ?? null
  } catch {
    return null
  }
}

/**
 * @deprecated OD-2 / P1-1: intake-only section builder. Not used by
 * `synthesizeReportSections` or the production pipeline. Prefer
 * `buildSectionsFromResearch`. Kept for isolated unit tests only.
 */
export async function buildReportSections(
  intake: LevelstackIntakeFormValues,
): Promise<ReportSection[]> {
  const priorNames = intake.priorBusinessNames.filter(Boolean)
  const market = marketLabelFromIntake(intake)

  const searchFindings = [
    {
      label: `Google visibility — "${intake.primaryBusinessName}"`,
      value: "Prospects searching your business name may see mixed signals.",
      detail: `Your intake lists ${priorNames.length} prior name(s) or brand(s). Search engines often keep indexing older entities for 12–24 months, which can surface reviews, listings, or press tied to a prior DBA unless actively managed.`,
      severity: priorNames.some(
        (n) => n.trim() !== "" && n.trim().toLowerCase() !== "none",
      )
        ? ("critical" as const)
        : ("medium" as const),
    },
    {
      label: `Service + market query — "${intake.primaryService}"`,
      value: `Competing for attention in a ${intake.geoMarket} market.`,
      detail: `At a ${intake.pricePoint} price point, buyers comparing options will search category + location before they book. Clear differentiation on your site and listings determines whether you earn the click.`,
      severity: "high" as const,
    },
  ]

  const reputationFindings = [
    {
      label: "Reputation signals you flagged",
      value: intake.complaintsAwareness.slice(0, 120),
      detail: `You rated reputation ${intake.reputationScale}/10. Research will weight: ${intake.reputationSelfAssessment}. Unresolved complaints or stale negative results disproportionately affect trust for high-ticket offers.`,
      severity:
        intake.reputationScale <= 5
          ? ("critical" as const)
          : intake.reputationScale <= 7
            ? ("high" as const)
            : ("medium" as const),
    },
  ]

  const siteTitle = await fetchWebsiteSnippet(intake.websiteUrl)
  const digitalFindings = [
    {
      label: "Website first impression",
      value: siteTitle ? `Page title: “${siteTitle}”` : "Could not read public page title.",
      detail: siteTitle
        ? "The title is often the first line prospects see in search. It should state who you help, where, and the outcome — not a generic welcome line."
        : "We could not fetch your homepage title. Confirm the URL is public and not blocked by bot protection.",
      severity: siteTitle ? ("medium" as const) : ("high" as const),
    },
    {
      label: "Social footprint vs intake",
      value: intake.socialProfiles.split("\n")[0]?.slice(0, 80) ?? "Profiles listed in intake",
      detail: `Active profiles: ${intake.socialProfiles.replace(/\n/g, ", ").slice(0, 300)}. Inconsistent naming across platforms dilutes search authority for ${intake.ownerName} and ${intake.primaryBusinessName}.`,
      severity: "medium" as const,
    },
  ]

  const funnelFindings = [
    {
      label: "Offer clarity",
      value: `${intake.primaryService} at ${intake.pricePoint}`,
      detail: `Purchase motivation noted: “${intake.purchaseMotivation}”. The offer should be obvious above the fold within 5 seconds of landing.`,
      severity: "medium" as const,
    },
    {
      label: "Paid traffic readiness",
      value:
        intake.hasActiveAdSpend === "yes"
          ? `Active spend on ${intake.adPlatforms ?? "paid channels"} (~${intake.adBudget ?? "budget not specified"})`
          : "No active paid spend reported",
      detail:
        intake.hasActiveAdSpend === "yes"
          ? `Sending paid traffic to a page that does not match ad promise is a common leak. Message match and a single ${TERMS.cta} should be verified before scaling spend.`
          : "Organic and referral traffic still hit the same trust gaps — ads amplify whatever prospects already suspect.",
      severity:
        intake.hasActiveAdSpend === "yes" ? ("high" as const) : ("low" as const),
    },
    {
      label: "Email list leverage",
      value: `~${intake.emailListSize} on list`,
      detail: "List size is only valuable when the site and offer convert cold traffic; otherwise growth work stays in the inbox, not on the site.",
      severity: "low" as const,
    },
  ]

  const competitiveFindings = [
    {
      label: "Positioning snapshot",
      value: `Competitors likely rank for “${intake.primaryService}” in your ${intake.geoMarket} market.`,
      detail: `Without a named competitor list in intake, we infer top results are businesses with stronger review volume, clearer ${TERMS.gbp} categories, or older domains. Your report highlights gaps to close before prospects compare options.`,
      severity: "medium" as const,
    },
  ]

  const sections: ReportSection[] = [
    {
      id: "search_footprint",
      label: "Search footprint review",
      ...scoreFromFindings(searchFindings),
      findings: searchFindings,
    },
    {
      id: "online_reputation",
      label: "Online reputation review",
      ...scoreFromFindings(reputationFindings),
      findings: reputationFindings,
    },
    {
      id: "digital_presence",
      label: "Digital presence gap analysis",
      ...scoreFromFindings(digitalFindings),
      findings: digitalFindings,
    },
    {
      id: "revenue_funnel",
      label: "Revenue funnel diagnosis",
      ...scoreFromFindings(funnelFindings),
      findings: funnelFindings,
    },
    {
      id: "competitive_context",
      label: "Competitive context snapshot",
      ...scoreFromFindings(competitiveFindings),
      findings: competitiveFindings,
    },
    {
      id: "action_plan",
      label: "Prioritized action plan",
      score: 55,
      status: "attention",
      findings: [
        {
          label: "Plan compiled",
          value: "See prioritized tasks below",
          detail: "Action items are generated from findings above, ordered by revenue impact and speed to implement.",
          severity: "good",
        },
      ],
    },
  ]

  void market
  return sections
}

export type AssembleReportOverrides = {
  executiveSummary?: LevelstackReportJson["executiveSummary"]
  actionPlan?: LevelstackReportJson["actionPlan"]
}

export function assembleReportJson(
  intake: LevelstackIntakeFormValues,
  sections: ReportSection[],
  planId: string | null,
  overrides?: AssembleReportOverrides,
): LevelstackReportJson {
  const allFindings = sections.flatMap((s) => s.findings)
  const count = (sev: string) =>
    allFindings.filter((f) => f.severity === sev).length

  const { overallScore, letterGrade } = deriveOverallFromSections(sections)

  const criticalFinding =
    allFindings.find((f) => f.severity === "critical") ??
    allFindings.find((f) => f.severity === "high")

  const planSource = sections.filter((s) => s.id !== "action_plan")
  const actionPlan =
    overrides?.actionPlan ?? buildActionPlanFromSections(planSource, intake)
  const executiveSummary = overrides?.executiveSummary ?? {
    paragraphs: [
      `When prospects search for ${intake.ownerName} or ${intake.primaryBusinessName}, they are deciding whether to trust you before they book at ${intake.pricePoint}. This report compares what you believe prospects see with what your intake and public signals suggest is visible today.`,
      `You described your reputation as ${intake.reputationScale}/10 while flagging: ${intake.complaintsAwareness.slice(0, 200)}. Closing the gap between perception and search results is the fastest path to better conversion from ${intake.hasActiveAdSpend === "yes" ? "paid and organic" : "organic and referral"} traffic.`,
    ],
    criticalIssue:
      criticalFinding?.value ??
      "No single critical issue was isolated — focus on search footprint and offer clarity first.",
    firstSteps: actionPlan.thisWeek.map((a) => a.task),
  }

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
      overallScore,
      letterGrade,
      totalFindings: allFindings.length,
      criticalCount: count("critical"),
      highCount: count("high"),
      mediumCount: count("medium"),
      lowCount: count("low"),
    },
    executiveSummary,
    sections,
    actionPlan,
  }
}
