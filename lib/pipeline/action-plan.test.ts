import { describe, expect, it } from "vitest"

import { levelstackIntakeTestDefaults } from "@/lib/intake/schema"
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
      ...levelstackIntakeTestDefaults,
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

  it("maps AI Overview findings to entity next steps, not meta rewrites", () => {
    const plan = buildActionPlanFromSections(
      [
        {
          id: "search_footprint",
          label: "Search footprint",
          status: "attention" as const,
          score: 70,
          findings: [
            {
              label: "Google AI Overview",
              value: "No Google AI Overview snippet returned for footprint queries.",
              detail:
                "Google did not show an AI Overview for these brand queries.",
              severity: "medium" as const,
            },
          ],
        },
      ],
      {
        ...levelstackIntakeTestDefaults,
        primaryBusinessName: "Test Co",
        ownerName: "Alex",
      },
    )
    expect(plan.thisWeek[0]?.sub).toMatch(/entity details|Business Profile/i)
    expect(plan.thisWeek[0]?.sub).not.toMatch(/meta description/i)
  })

  it("incognito step uses a single query when owner matches business (free-style)", () => {
    const plan = buildActionPlanFromSections([], {
      ...levelstackIntakeTestDefaults,
      primaryBusinessName: "LT Printing & Promotion",
      ownerName: "LT Printing & Promotion",
      primaryService: "General business services",
    })
    const incognito = plan.thisWeek.find((a) =>
      a.task.includes("Confirm what strangers see"),
    )
    expect(incognito?.sub).toBe(
      'Next step: Search in a private/incognito browser for "LT Printing & Promotion" — no personal history.',
    )
  })

  it("incognito step uses name + service when service is distinct", () => {
    const plan = buildActionPlanFromSections([], {
      ...levelstackIntakeTestDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex",
      primaryService: "Plumbing repair",
    })
    const incognito = plan.thisWeek.find((a) =>
      a.task.includes("Confirm what strangers see"),
    )
    expect(incognito?.sub).toContain('"Test Co" and "Test Co Plumbing repair"')
  })

  it("incognito step uses distinct ownerName when service is placeholder", () => {
    const plan = buildActionPlanFromSections([], {
      ...levelstackIntakeTestDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex",
      primaryService: "General business services",
    })
    const incognito = plan.thisWeek.find((a) =>
      a.task.includes("Confirm what strangers see"),
    )
    expect(incognito?.sub).toContain('"Test Co" and "Alex"')
  })
})
