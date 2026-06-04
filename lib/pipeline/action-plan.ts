import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"

export type ActionPlan = LevelstackReportJson["actionPlan"]

function findingRef(f: { label: string; value: string }): string {
  return f.label.length > 60 ? `${f.label.slice(0, 57)}…` : f.label
}

/** Finding-linked fallback when LLM action plan is unavailable. */
export function buildActionPlanFromSections(
  sections: ReportSection[],
  intake?: LevelstackIntakeFormValues,
): ActionPlan {
  const ranked = sections
    .filter((s) => s.id !== "action_plan")
    .flatMap((s) =>
      s.findings.map((f) => ({
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

  const top = ranked.slice(0, 6).map((r) => r.finding)
  const funnelSection = sections.find((s) => s.id === "revenue_funnel")
  const runsAds = intake?.hasActiveAdSpend === "yes"

  const thisWeek: ActionPlan["thisWeek"] = []

  if (top[0]) {
    thisWeek.push({
      task: top[0].value.slice(0, 120),
      sub: `Why now: ${top[0].detail.slice(0, 160)}`,
      who: "You",
      time: "30–60 min",
      findingRef: findingRef(top[0]),
    })
  }

  if (runsAds && funnelSection?.findings[0]) {
    const f = funnelSection.findings[0]
    thisWeek.push({
      task: "Pause or reduce paid traffic until landing page trust signals match your offer",
      sub: `Tied to funnel finding: ${f.value.slice(0, 80)}. Check message match on ${intake?.websiteUrl ?? "your site"}.`,
      who: "You",
      time: "1 hr",
      findingRef: findingRef(f),
    })
  } else if (top[1]) {
    thisWeek.push({
      task: top[1].value.slice(0, 120),
      sub: `From research: ${top[1].detail.slice(0, 140)}`,
      who: "You",
      time: "1–2 hrs",
      findingRef: findingRef(top[1]),
    })
  }

  thisWeek.push({
    task: `Private-window search: "${intake?.ownerName ?? "your name"}" and "${intake?.primaryBusinessName ?? "business"}"`,
    sub: "Screenshot page 1; compare to what this report documents.",
    who: "You",
    time: "20 min",
  })

  const searchFinding = sections
    .find((s) => s.id === "search_footprint")
    ?.findings.find((f) => f.severity === "critical" || f.severity === "high")

  const thisMonth: ActionPlan["thisMonth"] = [
    {
      task: searchFinding
        ? `Resolve search footprint issue: ${searchFinding.value.slice(0, 70)}`
        : "Claim and complete Google Business Profile",
      sub: searchFinding
        ? searchFinding.detail.slice(0, 160)
        : "Categories, photos, services, review request link",
      who: "Freelancer",
      time: "2–3 hrs",
      findingRef: searchFinding ? findingRef(searchFinding) : "Google Business Profile",
    },
    {
      task: "Align homepage headline and primary CTA with your stated offer",
      sub: intake
        ? `${intake.primaryService} · ${intake.pricePoint}`
        : "Match service and price from intake",
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
            task: "Sweep search results for prior business names and brands",
            sub: `Names from intake: ${priorNames.join(", ").slice(0, 120)}`,
            who: "Freelancer",
            time: "4–6 hrs",
            findingRef: "Prior business names",
          },
        ]
      : []),
    {
      task: runsAds
        ? "Re-enable ads only after landing trust, CTA, and offer clarity pass a five-second test"
        : "Publish one FAQ-style page for who you help, where, and credentials",
      sub: runsAds
        ? "Protects ad spend from trust gaps documented in the funnel section."
        : "Supports AI/search snippets and comparison shoppers.",
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
