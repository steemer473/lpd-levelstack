import { describe, expect, it } from "vitest"

import { scoreAllSignals } from "@/lib/audit/score-all-signals"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { buildDeterministicSearchFootprintSection } from "@/lib/pipeline/search-footprint-synthesis"
import { reportSectionSchema } from "@/lib/pipeline/report-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"

describe("buildDeterministicSearchFootprintSection", () => {
  const intake = {
    ...levelstackIntakeDefaults,
    primaryBusinessName: "Platinum Real Estate",
    ownerName: "Luther Ragsdale",
    priorBusinessNames: ["None"],
    primaryService: "brokerage",
    pricePoint: "$1000",
    websiteUrl: "https://platinumrealestate.com",
    socialProfiles: "Facebook",
    emailListSize: "3000",
    marketCity: "Atlanta",
    marketState: "GA",
    geoMarket: "local" as const,
    complaintsAwareness: "none",
    reputationSelfAssessment: "high",
    reputationScale: 10,
    purchaseMotivation: "audit",
  }

  it("produces ≥3 narrative findings with SERP evidence", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Platinum Real Estate",
        results: [
          {
            query: "Platinum Real Estate",
            position: 1,
            title: "Contact Platinum",
            link: "https://contactplatinum.com/",
            snippet: "Our team is dedicated to putting our experience to work for you.",
          },
          {
            query: "Platinum Real Estate",
            position: 2,
            title: "Platinum NJ",
            link: "https://www.platinumrealestatenj.com/",
            snippet: "New Jersey real estate.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "Platinum Real Estate Atlanta, GA",
        results: [
          {
            query: "Platinum Real Estate Atlanta, GA",
            position: 2,
            title: "Platinum Real Estate",
            link: "https://www.platinumrealestate.com/",
            snippet: "Atlanta real estate brokerage established 1996.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.digitalPresence.website.metaDescription =
      "Atlanta real estate brokerage established 1996. Modern platform serving Metro Atlanta."

    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const section = buildDeterministicSearchFootprintSection(intake, bundle, audit)

    expect(section.id).toBe("search_footprint")
    expect(section.findings.length).toBeGreaterThanOrEqual(3)

    const detailBlob = section.findings.map((f) => `${f.value} ${f.detail}`).join(" ")
    expect(detailBlob).toMatch(/contactplatinum\.com|#1/)
    expect(detailBlob).toMatch(/platinumrealestate\.com|#2/)

    const snippetFinding = section.findings.find((f) =>
      f.label.includes("What your site says"),
    )
    expect(snippetFinding?.value).toMatch(/website's short description|business name without a city/i)

    expect(section.scoreRows?.length).toBeGreaterThan(0)

    const parsed = reportSectionSchema.safeParse(section)
    expect(parsed.success).toBe(true)
  })

  it("returns limitation finding when no SERP data", () => {
    const bundle = emptyResearchBundle()
    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const section = buildDeterministicSearchFootprintSection(intake, bundle, audit)

    expect(section.findings).toHaveLength(1)
    expect(section.findings[0]?.value).toMatch(/not available/i)
  })
})
