import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"

describe("buildActionPlanFromSections", () => {
  it("links this-week tasks to findings and caps at 4", () => {
    const sections = [
      {
        id: "search_footprint",
        label: "Search",
        status: "critical" as const,
        score: 40,
        findings: [
          {
            label: "Google — business",
            value: "Not in top 10",
            detail: "https://competitor.com ranks #1",
            severity: "critical" as const,
          },
        ],
      },
      {
        id: "revenue_funnel",
        label: "Funnel",
        status: "critical" as const,
        score: 35,
        findings: [
          {
            label: "Paid traffic",
            value: "Ads active",
            detail: "Landing weak",
            severity: "high" as const,
          },
        ],
      },
    ]
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex",
      hasActiveAdSpend: "yes" as const,
      websiteUrl: "https://example.com",
    }
    const plan = buildActionPlanFromSections(sections, intake)
    expect(plan.thisWeek.length).toBeLessThanOrEqual(4)
    expect(plan.thisWeek[0]?.findingRef).toBeTruthy()
    expect(
      plan.thisWeek.some((a) => /paid|traffic|pause/i.test(a.task)),
    ).toBe(true)
  })
})
