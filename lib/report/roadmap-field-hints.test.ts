import { describe, expect, it } from "vitest"

import {
  ACTION_NUMBER_HINT,
  CONFIDENCE_HINT,
  EFFORT_HINT,
  IMPACT_HINT,
  OWNER_HINT,
  ROI_HINT,
  ROADMAP_HOW_TO_READ,
  TIME_HINT,
  TIMEFRAME_HINT,
} from "@/lib/report/roadmap-field-hints"

describe("roadmap field hints", () => {
  it("has non-empty Impact and Effort hints", () => {
    expect(IMPACT_HINT.length).toBeGreaterThan(20)
    expect(EFFORT_HINT.length).toBeGreaterThan(20)
  })

  it("has non-empty supporting element hints", () => {
    for (const hint of [
      CONFIDENCE_HINT,
      ROI_HINT,
      OWNER_HINT,
      TIME_HINT,
      ACTION_NUMBER_HINT,
      TIMEFRAME_HINT,
    ]) {
      expect(hint.length).toBeGreaterThan(10)
    }
  })
})

describe("ROADMAP_HOW_TO_READ", () => {
  it("covers core legend terms for both variants", () => {
    expect(ROADMAP_HOW_TO_READ.title).toMatch(/How to read/i)
    const sharedTerms = ROADMAP_HOW_TO_READ.shared.map((i) => i.term)
    expect(sharedTerms).toEqual(
      expect.arrayContaining([
        "Timeframes",
        "Action number",
        "Priority (P0–P3)",
        "Impact",
        "Effort",
        "Owner / Who",
        "Time",
      ]),
    )
    for (const item of ROADMAP_HOW_TO_READ.shared) {
      expect(item.body.length).toBeGreaterThan(10)
    }
  })

  it("adds Confidence and ROI for recommendations-only bullets", () => {
    const terms = ROADMAP_HOW_TO_READ.recommendationsOnly.map((i) => i.term)
    expect(terms).toEqual(["Confidence", "ROI"])
  })
})
