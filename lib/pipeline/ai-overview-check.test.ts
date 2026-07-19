import { describe, expect, it } from "vitest"

import {
  aiOverviewMentionsBrand,
  buildAiOverviewCheck,
} from "@/lib/pipeline/ai-overview-check"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { TERMS } from "@/lib/report/customer-terms"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Acme Dental",
  ownerName: "Jane Doe",
  websiteUrl: "https://www.acmedental.com",
  priorBusinessNames: ["None"],
  primaryService: "dental care",
  pricePoint: "$200",
  reputationScale: 7,
  complaintsAwareness: "none",
  marketCity: "Atlanta",
  marketState: "GA",
}

function bundleWithSearch(
  overrides: Partial<ResearchBundle["searchFootprint"]["searches"][number]> = {},
): ResearchBundle {
  const bundle = emptyResearchBundle()
  bundle.searchFootprint.searches = [
    {
      query: "Acme Dental Atlanta, GA",
      results: [
        {
          query: "Acme Dental Atlanta, GA",
          position: 1,
          title: "Acme Dental",
          link: "https://www.acmedental.com",
          snippet: "Family dental care",
        },
      ],
      aiOverview: null,
      limitation: null,
      ...overrides,
    },
  ]
  return bundle
}

describe("aiOverviewMentionsBrand", () => {
  it("matches business name case-insensitively", () => {
    expect(
      aiOverviewMentionsBrand("ACME DENTAL is a clinic in Atlanta", "Acme Dental", null),
    ).toBe(true)
  })

  it("matches buyer hostname", () => {
    expect(
      aiOverviewMentionsBrand(
        "See more at acmedental.com for hours",
        "Other Name",
        "www.acmedental.com",
      ),
    ).toBe(true)
  })

  it("returns false when neither brand nor domain appears", () => {
    expect(
      aiOverviewMentionsBrand("General dental tips for adults", "Acme Dental", "acmedental.com"),
    ).toBe(false)
  })
})

describe("buildAiOverviewCheck", () => {
  it("returns ok when overview cites the brand", () => {
    const result = buildAiOverviewCheck(
      intake,
      bundleWithSearch({
        aiOverview: "Acme Dental offers family dentistry in Atlanta.",
      }),
    )
    expect(result.check.availability).toBe("ok")
    expect(result.check.severity).toBe("low")
    expect(result.aiPreview).toHaveLength(1)
    expect(result.aiPreview[0]?.platform).toBe(TERMS.aiOverview)
    expect(result.aiPreview[0]?.result).toMatch(/mentions your business/i)
    expect(result.finding.label).toBe(TERMS.aiOverview)
  })

  it("returns negative when overview omits the brand", () => {
    const result = buildAiOverviewCheck(
      intake,
      bundleWithSearch({
        aiOverview: "Dental care tips for Atlanta residents.",
      }),
    )
    expect(result.check.availability).toBe("negative")
    expect(result.check.severity).toBe("medium")
    expect(result.aiPreview[0]?.result).toMatch(/not clearly cited/i)
  })

  it("returns negative when no overview on a successful SERP", () => {
    const result = buildAiOverviewCheck(intake, bundleWithSearch({ aiOverview: null }))
    expect(result.check.availability).toBe("negative")
    expect(result.aiPreview[0]?.result).toMatch(/No Google AI Overview/i)
    expect(JSON.stringify(result)).not.toMatch(/not automated in v1/i)
    expect(JSON.stringify(result)).not.toMatch(/ChatGPT/i)
  })

  it("returns unavailable when brand SERP failed", () => {
    const result = buildAiOverviewCheck(
      intake,
      bundleWithSearch({
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error",
      }),
    )
    expect(result.check.availability).toBe("unavailable")
    expect(result.aiPreview[0]?.result).toMatch(/Unable to verify/i)
  })

  it("returns not_checked when no footprint searches exist", () => {
    const result = buildAiOverviewCheck(intake, emptyResearchBundle())
    expect(result.check.availability).toBe("not_checked")
  })
})
