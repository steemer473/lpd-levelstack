import { describe, expect, it } from "vitest"

import { normalizePriorBusinessNames } from "@/lib/intake/prior-names"
import { levelstackIntakeSchema } from "@/lib/intake/schema"

describe("normalizePriorBusinessNames", () => {
  it("keeps None sentinel and trims whitespace", () => {
    expect(normalizePriorBusinessNames(["  None  ", ""])).toEqual(["None"])
  })

  it("drops blank rows only", () => {
    expect(normalizePriorBusinessNames(["Acme LLC", "   ", "Old Brand"])).toEqual([
      "Acme LLC",
      "Old Brand",
    ])
  })
})

describe("levelstackIntakeSchema priorBusinessNames", () => {
  const base = {
    primaryBusinessName: "Acme Coaching",
    ownerName: "Jane Doe",
    primaryService: "Executive coaching",
    pricePoint: "$3,000",
    hasActiveAdSpend: "no" as const,
    websiteUrl: "https://example.com",
    socialProfiles: "LinkedIn: jane",
    emailListSize: "500",
    geoMarket: "national" as const,
    complaintsAwareness: "None known",
    reputationSelfAssessment: "Generally positive",
    reputationScale: 7,
    purchaseMotivation: "Low conversion from ads",
  }

  it("accepts None sentinel with blank sibling rows", () => {
    const result = levelstackIntakeSchema.safeParse({
      ...base,
      priorBusinessNames: ["None", ""],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priorBusinessNames).toEqual(["None"])
    }
  })

  it("rejects all-blank prior name rows", () => {
    const result = levelstackIntakeSchema.safeParse({
      ...base,
      priorBusinessNames: [""],
    })
    expect(result.success).toBe(false)
  })
})
