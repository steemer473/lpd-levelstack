import { describe, expect, it } from "vitest"

import { scoreAllSignals } from "@/lib/audit/score-all-signals"
import { levelstackIntakeTestDefaults } from "@/lib/intake/schema"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"

describe("scoreSnippetAccuracy", () => {
  const intake = {
    ...levelstackIntakeTestDefaults,
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

  it("returns warning when owner domain is absent from brand SERP", () => {
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
            snippet:
              "Our team is dedicated to putting our experience and local knowledge to work for you.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.digitalPresence.website.metaDescription =
      "Atlanta real estate brokerage established 1996."

    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const snippet = audit.signals.find((s) => s.id === "search_snippet_accuracy")

    expect(snippet?.status).toBe("warning")
    expect(snippet?.finding).toContain("business name without a city")
  })

  it("compares snippet when owner domain ranks in SERP", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Platinum Real Estate",
        results: [
          {
            query: "Platinum Real Estate",
            position: 2,
            title: "Platinum Real Estate",
            link: "https://www.platinumrealestate.com/",
            snippet: "Atlanta real estate brokerage established 1996 serving Metro Atlanta.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.digitalPresence.website.metaDescription =
      "Atlanta real estate brokerage established 1996 serving Metro Atlanta."

    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const snippet = audit.signals.find((s) => s.id === "search_snippet_accuracy")

    expect(snippet?.status).toBe("pass")
  })
})

describe("scoreDirectories", () => {
  const intake = {
    ...levelstackIntakeTestDefaults,
    primaryBusinessName: "MC Fitness & Wellness",
    ownerName: "Marcus Carter",
    priorBusinessNames: ["None"],
    primaryService: "online fitness coaching",
    pricePoint: "$197",
    websiteUrl: "https://mcfitness.example",
    socialProfiles: "Instagram",
    emailListSize: "340",
    marketCity: "Atlanta",
    marketState: "GA",
    geoMarket: "local" as const,
    complaintsAwareness: "none",
    reputationSelfAssessment: "medium",
    reputationScale: 5,
    purchaseMotivation: "audit",
  }

  it("returns unavailable when directory searches never ran", () => {
    const bundle = emptyResearchBundle()
    // Free tier skips directory_review_search — reputation.searches stays [].
    expect(bundle.reputation.searches).toHaveLength(0)

    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const directory = audit.signals.find((s) => s.id === "directory_presence")

    expect(directory?.status).toBe("unavailable")
    expect(directory?.finding).toMatch(/could not be verified/i)
    expect(directory?.finding).not.toMatch(/Present on 0\/6/)
  })

  it("does not count an unrun directory check as a failed signal in the score pool", () => {
    const bundle = emptyResearchBundle()
    const audit = scoreAllSignals(intake, bundle, "free_snapshot")
    const directory = audit.signals.find((s) => s.id === "directory_presence")

    expect(directory?.status).toBe("unavailable")
    // Unavailable signals are skipped in the weighted average — overall should
    // not be dragged to 0 by a check that never ran.
    expect(audit.overallScore).toBeGreaterThan(0)
  })
})
