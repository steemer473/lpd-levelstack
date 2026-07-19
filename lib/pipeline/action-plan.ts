import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { TERMS } from "@/lib/report/customer-terms"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"

export type ActionPlan = LevelstackReportJson["actionPlan"]

function findingRef(f: { label: string; value: string }): string {
  return f.label.length > 60 ? `${f.label.slice(0, 57)}…` : f.label
}

const SKIP_ACTION_FINDING =
  /unable to verify|not checked for this report|no platform-specific review|not fetched yet|insufficient data/i

function isActionableFinding(f: {
  value: string
  detail: string
  severity: string
}): boolean {
  if (SKIP_ACTION_FINDING.test(`${f.value} ${f.detail}`)) return false
  if (f.severity === "good" || f.severity === "low") return false
  return true
}

function nextStepForFinding(
  finding: { label: string; value: string; detail: string },
  sectionId: string,
): string {
  const blob = `${finding.label} ${finding.value} ${finding.detail}`.toLowerCase()

  if (sectionId === "social_offsite" || /facebook|linkedin|instagram|social/i.test(blob)) {
    if (/facebook/.test(blob)) {
      return "Next step: Create or claim a branded Facebook Page and link it from your website footer."
    }
    if (/linkedin/.test(blob) && /no clear|not found|missing/.test(blob)) {
      return "Next step: Publish a LinkedIn Company Page that matches your brand name and link it from your site."
    }
    return "Next step: Make sure each social profile uses your brand name and is linked from your website."
  }

  if (/ai overview/.test(blob)) {
    return "Next step: Add clear entity details (name, location, services) on your site and Google Business Profile."
  }

  if (/snippet|meta description|what google shows/.test(blob)) {
    return "Next step: Rewrite your homepage title and meta description so Google's snippet matches your offer."
  }

  if (/not in the top|was not in the top|visibility/.test(blob)) {
    return "Next step: Strengthen branded and local pages so your domain owns page 1 for your business name."
  }

  return `Next step: Fix this before spending more on ads or outreach — ${finding.detail.slice(0, 120)}`
}

/** Finding-linked fallback when LLM action plan is unavailable. */
export function buildActionPlanFromSections(
  sections: ReportSection[],
  intake?: LevelstackIntakeFormValues,
): ActionPlan {
  const ranked = sections
    .filter((s) => s.id !== "action_plan")
    .flatMap((s) =>
      s.findings
        .filter((f) => isActionableFinding(f))
        .map((f) => ({
          sectionId: s.id,
          finding: f,
          weight:
            f.severity === "critical"
              ? 4
              : f.severity === "high"
                ? 3
                : f.severity === "medium"
                  ? 2
                  : 1,
        })),
    )
    .sort((a, b) => b.weight - a.weight)

  const top = ranked.slice(0, 6)
  const funnelSection = sections.find((s) => s.id === "revenue_funnel")
  const runsAds = intake?.hasActiveAdSpend === "yes"

  const thisWeek: ActionPlan["thisWeek"] = []

  if (top[0]) {
    thisWeek.push({
      task: `Decide: ${top[0].finding.value.slice(0, 110)}`,
      sub: nextStepForFinding(top[0].finding, top[0].sectionId),
      who: "You",
      time: "30–60 min",
      findingRef: findingRef(top[0].finding),
    })
  }

  if (runsAds && funnelSection?.findings[0]) {
    const f = funnelSection.findings[0]
    thisWeek.push({
      task: "Decide: Pause or reduce paid traffic until landing page trust signals match your offer",
      sub: `Next step: Check message match on ${intake?.websiteUrl ?? "your site"} against your funnel finding.`,
      who: "You",
      time: "1 hr",
      findingRef: findingRef(f),
    })
  } else if (top[1]) {
    thisWeek.push({
      task: `Decide: ${top[1].finding.value.slice(0, 110)}`,
      sub: nextStepForFinding(top[1].finding, top[1].sectionId),
      who: "You",
      time: "1–2 hrs",
      findingRef: findingRef(top[1].finding),
    })
  }

  thisWeek.push({
    task: `Decide: Confirm what strangers see for "${intake?.primaryBusinessName ?? "your business"}"`,
    sub: `Next step: Search in a private/incognito browser for "${intake?.ownerName ?? "your name"}" and "${intake?.primaryBusinessName ?? "business"}" — no personal history.`,
    who: "You",
    time: "20 min",
  })

  const searchFinding = sections
    .find((s) => s.id === "search_footprint")
    ?.findings.find(
      (f) =>
        isActionableFinding(f) &&
        (f.severity === "critical" || f.severity === "high"),
    )

  const thisMonth: ActionPlan["thisMonth"] = [
    {
      task: searchFinding
        ? `Decide: Resolve search footprint issue — ${searchFinding.value.slice(0, 70)}`
        : "Decide: Claim and complete Google Business Profile",
      sub: searchFinding
        ? nextStepForFinding(searchFinding, "search_footprint")
        : "Next step: Set categories, photos, services, and a review request link.",
      who: "Freelancer",
      time: "2–3 hrs",
      findingRef: searchFinding ? findingRef(searchFinding) : "Google Business Profile",
    },
    {
      task: `Decide: Align homepage headline and primary ${TERMS.cta} with your stated offer`,
      sub: intake
        ? `Next step: Match ${intake.primaryService} · ${intake.pricePoint} above the fold.`
        : "Next step: Match service and price from intake above the fold.",
      who: "You or freelancer",
      time: "2–4 hrs",
      findingRef: "Offer clarity",
    },
  ]

  const priorNames = intake?.priorBusinessNames.filter(
    (n) => n.trim() && n.trim().toLowerCase() !== "none",
  )

  const thisQuarter: ActionPlan["thisQuarter"] = [
    ...(priorNames && priorNames.length > 0
      ? [
          {
            task: "Decide: Sweep search results for prior business names and brands",
            sub: `Next step: Review page-1 results for: ${priorNames.join(", ").slice(0, 120)}`,
            who: "Freelancer",
            time: "4–6 hrs",
            findingRef: "Prior business names",
          },
        ]
      : []),
    {
      task: runsAds
        ? `Decide: Re-enable ads only after landing trust, ${TERMS.cta}, and offer clarity pass a five-second test`
        : "Decide: Publish one FAQ-style page for who you help, where, and credentials",
      sub: runsAds
        ? "Next step: Protect ad spend from trust gaps documented in the funnel section."
        : "Next step: Support AI/search snippets and comparison shoppers with clear entity pages.",
      who: runsAds ? "You" : "Freelancer",
      time: runsAds ? "2 hrs" : "3–4 hrs",
      findingRef: runsAds ? "Paid traffic readiness" : "Search footprint",
    },
  ]

  return {
    thisWeek: thisWeek.slice(0, 4),
    thisMonth: thisMonth.slice(0, 4),
    thisQuarter: thisQuarter.slice(0, 4),
  }
}

/** @deprecated Use buildActionPlanFromSections — kept for tests. */
export const buildActionPlan = buildActionPlanFromSections

export function normalizeLlmActionPlan(
  plan: ActionPlan,
): ActionPlan {
  const trim = (items: ActionPlan["thisWeek"]) =>
    items.map((item) => ({
      task: item.task.trim(),
      sub: item.sub?.trim(),
      who: item.who?.trim() || "You",
      time: item.time?.trim() || "1 hr",
      findingRef: item.findingRef?.trim(),
    }))

  return {
    thisWeek: trim(plan.thisWeek).slice(0, 4),
    thisMonth: trim(plan.thisMonth).slice(0, 4),
    thisQuarter: trim(plan.thisQuarter).slice(0, 4),
  }
}
