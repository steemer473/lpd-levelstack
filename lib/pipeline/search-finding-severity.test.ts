import { describe, expect, it } from "vitest"

import {
  businessSearchSeverity,
  ownerSearchSeverity,
} from "./search-finding-severity"
import type { SerpOrganicResult } from "@/lib/research/serp"

function row(position: number, title = "Result", link = "https://example.com/"): SerpOrganicResult {
  return { query: "q", position, title, link, snippet: "" }
}

describe("businessSearchSeverity", () => {
  it("rates position 1–3 as good", () => {
    expect(businessSearchSeverity(row(1), true)).toBe("good")
    expect(businessSearchSeverity(row(3), true)).toBe("good")
  })

  it("rates mid page 1 as low", () => {
    expect(businessSearchSeverity(row(5), true)).toBe("low")
  })

  it("rates bottom of page 1 as medium", () => {
    expect(businessSearchSeverity(row(8), true)).toBe("medium")
  })

  it("rates missing from top 10 as high when results exist", () => {
    expect(businessSearchSeverity(null, true)).toBe("high")
  })
})

describe("ownerSearchSeverity", () => {
  it("rates owner site in top 3 as good", () => {
    const results = [
      row(1, "Owner", "https://example.com/about"),
      row(2, "Other", "https://other.com"),
    ]
    expect(ownerSearchSeverity(results, "example.com")).toBe("good")
  })

  it("flags negative top results as high", () => {
    const results = [
      row(1, "Complaint on ConsumerAffairs", "https://consumeraffairs.com/x"),
    ]
    expect(ownerSearchSeverity(results, "example.com")).toBe("high")
  })
})
