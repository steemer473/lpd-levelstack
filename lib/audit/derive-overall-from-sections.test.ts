import { describe, expect, it } from "vitest"

import { deriveOverallFromSections } from "@/lib/audit/derive-overall-from-sections"

describe("deriveOverallFromSections", () => {
  it("uses equal-weight rounded mean of diagnostic sections", () => {
    const derived = deriveOverallFromSections([
      { id: "search_footprint", score: 87 },
      { id: "online_reputation", score: 62 },
      { id: "digital_presence", score: 62 },
    ])
    // (87+62+62)/3 = 70.333… → 70, grade C
    expect(derived.overallScore).toBe(70)
    expect(derived.letterGrade).toBe("C")
    expect(derived.includedSectionIds).toEqual([
      "search_footprint",
      "online_reputation",
      "digital_presence",
    ])
  })

  it("excludes action_plan from the mean", () => {
    const derived = deriveOverallFromSections([
      { id: "search_footprint", score: 80 },
      { id: "online_reputation", score: 60 },
      { id: "action_plan", score: 55 },
    ])
    expect(derived.overallScore).toBe(70)
    expect(derived.includedSectionIds).not.toContain("action_plan")
  })

  it("uses letterGradeFromScore thresholds (A at 90)", () => {
    expect(deriveOverallFromSections([{ id: "search_footprint", score: 90 }]).letterGrade).toBe(
      "A",
    )
    expect(deriveOverallFromSections([{ id: "search_footprint", score: 59 }]).letterGrade).toBe(
      "F",
    )
  })

  it("returns 0 / F when no diagnostic sections", () => {
    const derived = deriveOverallFromSections([{ id: "action_plan", score: 55 }])
    expect(derived.overallScore).toBe(0)
    expect(derived.letterGrade).toBe("F")
  })
})
