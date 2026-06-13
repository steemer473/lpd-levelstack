import { describe, expect, it } from "vitest"

import {
  customerGbpFindingDetail,
  customerGbpFindingValue,
  GBP_NOT_FOUND_VALUE,
  isCustomerFacingFinding,
  isInternalLimitation,
  polishCustomerFindingCopy,
} from "@/lib/report/customer-copy"

describe("customer-copy", () => {
  it("detects internal limitation placeholders", () => {
    expect(isInternalLimitation("Not fetched yet.")).toBe(true)
    expect(isInternalLimitation("SerpAPI is not configured (SERPAPI_KEY missing).")).toBe(
      true,
    )
    expect(isInternalLimitation("No Google Maps listing found for query.")).toBe(false)
  })

  it("never returns Not fetched yet as GBP finding value", () => {
    const value = customerGbpFindingValue(
      {
        found: false,
        title: null,
        rating: null,
        reviewCount: null,
        limitation: "Not fetched yet.",
      },
      "Test Co",
    )
    expect(value).toBe(GBP_NOT_FOUND_VALUE)
    expect(value).not.toContain("Not fetched yet")
  })

  it("uses actionable detail when limitation is internal", () => {
    const detail = customerGbpFindingDetail(
      { found: false, limitation: "Not fetched yet." },
      "Google Business Profile (GBP)",
    )
    expect(detail).toContain("Claim and complete your Google Business Profile")
    expect(detail).not.toContain("Not fetched yet")
  })

  it("rejects placeholder strings from executive summary selection", () => {
    expect(isCustomerFacingFinding("Not fetched yet.")).toBe(false)
    expect(
      isCustomerFacingFinding(
        "Could not compare snippets for the unqualified brand search — your site did not rank in top results.",
      ),
    ).toBe(true)
  })

  it("rewrites legacy snippet jargon for executive summary", () => {
    const polished = polishCustomerFindingCopy(
      "Could not compare snippets for the unqualified brand search — your site did not rank in top results.",
    )
    expect(polished).not.toContain("unqualified")
    expect(polished).not.toContain("snippet")
    expect(polished).toContain("business name without a city")
  })
})
