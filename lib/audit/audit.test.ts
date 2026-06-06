import { describe, expect, it } from "vitest"

import { letterGradeFromScore, statusToPercent } from "@/lib/audit/types"
import { freeSnapshotToIntake } from "@/lib/intake/free-snapshot-schema"

describe("audit types", () => {
  it("maps signal status to percent", () => {
    expect(statusToPercent("pass")).toBe(100)
    expect(statusToPercent("warning")).toBe(50)
    expect(statusToPercent("fail")).toBe(0)
  })

  it("assigns letter grades", () => {
    expect(letterGradeFromScore(92)).toBe("A")
    expect(letterGradeFromScore(55)).toBe("F")
  })
})

describe("freeSnapshotToIntake", () => {
  it("maps free form to pipeline intake", () => {
    const intake = freeSnapshotToIntake({
      email: "test@example.com",
      businessName: "Acme Co",
      websiteUrl: "https://acme.com",
      marketCity: "Atlanta",
    })
    expect(intake.primaryBusinessName).toBe("Acme Co")
    expect(intake.websiteUrl).toBe("https://acme.com")
    expect(intake.geoMarket).toBe("local")
  })
})
