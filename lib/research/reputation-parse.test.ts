import { describe, expect, it } from "vitest"

import { parseRatingFromText } from "@/lib/research/reputation-parse"

describe("parseRatingFromText", () => {
  it("extracts rating and review count from snippet", () => {
    const parsed = parseRatingFromText(
      "4.5 out of 5 stars · 128 reviews on Yelp",
    )
    expect(parsed.rating).toBe(4.5)
    expect(parsed.reviewCount).toBe(128)
    expect(parsed.platform).toBe("Yelp")
  })

  it("parses star characters", () => {
    const parsed = parseRatingFromText("★★★★☆ 12 reviews")
    expect(parsed.rating).toBe(4)
    expect(parsed.reviewCount).toBe(12)
  })
})
