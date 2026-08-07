import { describe, expect, it } from "vitest"

import {
  ACTION_NUMBER_HINT,
  CONFIDENCE_HINT,
  EFFORT_HINT,
  IMPACT_HINT,
  OWNER_HINT,
  ROI_HINT,
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
