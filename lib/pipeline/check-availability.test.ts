import { describe, expect, it } from "vitest"

import {
  classifyLimitationAvailability,
  isNotFetchedYet,
  isUnavailableSearchCheck,
  scoreSectionFromChecks,
  shouldMarkInsufficient,
} from "@/lib/pipeline/check-availability"

describe("check-availability", () => {
  it("classifies Not fetched yet as not_checked", () => {
    expect(isNotFetchedYet("Not fetched yet.")).toBe(true)
    expect(classifyLimitationAvailability("Not fetched yet.")).toBe("not_checked")
    expect(classifyLimitationAvailability("Internal SE Server Error.")).toBe(
      "unavailable",
    )
  })

  it("marks a search unavailable when results empty and limitation is internal", () => {
    expect(
      isUnavailableSearchCheck({
        results: [],
        limitation: "Internal SE Server Error.",
      }),
    ).toBe(true)
    expect(
      isUnavailableSearchCheck({
        results: [],
        limitation: null,
      }),
    ).toBe(false)
    expect(
      isUnavailableSearchCheck({
        results: [{ position: 1 }],
        limitation: "Internal SE Server Error.",
      }),
    ).toBe(false)
  })

  it("marks insufficient at ≥50% blocked checks", () => {
    expect(
      shouldMarkInsufficient([
        { availability: "unavailable" },
        { availability: "unavailable" },
        { availability: "negative" },
        { availability: "ok" },
      ]),
    ).toBe(true)
    expect(
      shouldMarkInsufficient([
        { availability: "unavailable" },
        { availability: "negative" },
        { availability: "negative" },
        { availability: "ok" },
      ]),
    ).toBe(false)
  })

  it("returns insufficient_data instead of scoring when half of checks failed", () => {
    const result = scoreSectionFromChecks([
      { availability: "unavailable", severity: "medium" },
      { availability: "unavailable", severity: "medium" },
      { availability: "negative", severity: "high" },
      { availability: "ok", severity: "good" },
    ])
    expect(result).toEqual({ score: null, status: "insufficient_data" })
  })

  it("scores only ok/negative findings when below the threshold", () => {
    const result = scoreSectionFromChecks([
      { availability: "unavailable", severity: "medium" },
      { availability: "negative", severity: "high" },
      { availability: "ok", severity: "good" },
      { availability: "ok", severity: "good" },
    ])
    // One high among scoreable → attention / 62; unavailable ignored
    expect(result).toEqual({ score: 62, status: "attention" })
  })
})
