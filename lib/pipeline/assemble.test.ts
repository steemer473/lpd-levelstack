import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { buildActionPlanFromSections } from "@/lib/pipeline/action-plan"
import { assembleReportJson } from "@/lib/pipeline/build-sections"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"

describe("assembleReportJson", () => {
  it("produces valid report JSON from intake-shaped sections", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex Owner",
      priorBusinessNames: ["None"],
      primaryService: "Coaching",
      pricePoint: "$500/mo",
      websiteUrl: "https://example.com",
      socialProfiles: "Instagram: @test",
      emailListSize: "200",
      complaintsAwareness: "None known",
      reputationSelfAssessment: "Generally positive",
      reputationScale: 7,
      purchaseMotivation: "Grow leads",
    }

    const sections = [
      {
        id: "search_footprint",
        label: "Search footprint review",
        status: "attention" as const,
        score: 60,
        findings: [
          {
            label: "Test",
            value: "Value",
            detail: "Detail",
            severity: "medium" as const,
          },
        ],
      },
    ]

    const json = assembleReportJson(intake, sections, "levelstack-standard")
    const parsed = levelstackReportJsonSchema.safeParse(json)
    expect(parsed.success).toBe(true)
    expect(json.meta.businessName).toBe("Test Co")
    expect(buildActionPlanFromSections(sections, intake).thisWeek.length).toBeGreaterThan(0)
    expect(json.actionPlan.thisWeek[0]?.findingRef).toBeDefined()
  })
})
