import { describe, expect, it } from "vitest"

import { levelstackIntakeSchema } from "@/lib/intake/schema"

const validPayload = {
  primaryBusinessName: "Acme Coaching",
  priorBusinessNames: ["None"],
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

describe("levelstackIntakeSchema", () => {
  it("accepts a valid payload", () => {
    const result = levelstackIntakeSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it("rejects missing business name", () => {
    const result = levelstackIntakeSchema.safeParse({
      ...validPayload,
      primaryBusinessName: "",
    })
    expect(result.success).toBe(false)
  })

  it("requires market city for local businesses", () => {
    const result = levelstackIntakeSchema.safeParse({
      ...validPayload,
      geoMarket: "local",
      marketCity: "",
    })
    expect(result.success).toBe(false)
  })

  it("accepts local business with city", () => {
    const result = levelstackIntakeSchema.safeParse({
      ...validPayload,
      geoMarket: "local",
      marketCity: "Atlanta",
      marketState: "GA",
    })
    expect(result.success).toBe(true)
  })
})
