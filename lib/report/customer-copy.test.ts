import { describe, expect, it } from "vitest"

import {
  customerGbpFindingDetail,
  customerGbpFindingValue,
  customerLimitationText,
  GBP_NOT_CHECKED_DETAIL,
  GBP_NOT_CHECKED_VALUE,
  GBP_NOT_FOUND_VALUE,
  isCustomerFacingFinding,
  isInternalLimitation,
  isSafeCustomerLimitation,
  polishCustomerFindingCopy,
  UNABLE_TO_VERIFY_DETAIL,
  UNABLE_TO_VERIFY_VALUE,
} from "@/lib/report/customer-copy"

describe("customer-copy", () => {
  it("detects internal limitation placeholders", () => {
    expect(isInternalLimitation("Not fetched yet.")).toBe(true)
    expect(isInternalLimitation("SerpAPI is not configured (SERPAPI_KEY missing).")).toBe(
      true,
    )
    expect(isInternalLimitation("No Google Maps listing found for query.")).toBe(false)
  })

  it("treats provider passthrough errors without vendor tokens as internal", () => {
    expect(isInternalLimitation("Internal SE Server Error.")).toBe(true)
    expect(isInternalLimitation("Internal Server Error")).toBe(true)
    expect(isInternalLimitation("The operation was aborted due to timeout")).toBe(true)
    expect(isInternalLimitation("Unexpected token < in JSON at position 0")).toBe(true)
  })

  it("allowlists only known customer-safe limitation phrases", () => {
    expect(isSafeCustomerLimitation("No Google Maps listing found for \"Acme\".")).toBe(
      true,
    )
    expect(isSafeCustomerLimitation("Website returned HTTP 404.")).toBe(true)
    expect(isSafeCustomerLimitation("Internal SE Server Error.")).toBe(false)
    expect(isSafeCustomerLimitation("Some unknown provider blurb")).toBe(false)
    expect(isSafeCustomerLimitation("Not fetched yet.")).toBe(false)
  })

  it("rewrites unsafe limitations to unable-to-verify", () => {
    expect(customerLimitationText("Internal SE Server Error.")).toBe(
      UNABLE_TO_VERIFY_VALUE,
    )
    expect(
      customerLimitationText('No Google Maps listing found for "Acme".'),
    ).toContain("No Google Maps listing found")
  })

  it("uses distinct not-checked copy for tier-skipped GBP (P1-2)", () => {
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
    expect(value).toBe(GBP_NOT_CHECKED_VALUE)
    expect(value).not.toContain("Not fetched yet")
    expect(value).not.toBe(GBP_NOT_FOUND_VALUE)
  })

  it("uses not-checked detail when GBP was never fetched", () => {
    const detail = customerGbpFindingDetail(
      { found: false, limitation: "Not fetched yet." },
      "Google Business Profile (GBP)",
    )
    expect(detail).toBe(GBP_NOT_CHECKED_DETAIL)
    expect(detail).not.toContain("Not fetched yet")
  })

  it("uses unable-to-verify for GBP provider errors", () => {
    const detail = customerGbpFindingDetail(
      { found: false, limitation: "Internal SE Server Error." },
      "Google Business Profile (GBP)",
    )
    expect(detail).not.toContain("Internal SE Server Error")
    expect(detail).toBe(UNABLE_TO_VERIFY_DETAIL)
  })

  it("uses not-found copy when GBP was checked and missing", () => {
    const value = customerGbpFindingValue(
      {
        found: false,
        title: null,
        rating: null,
        reviewCount: null,
        limitation: 'No Google Maps listing found for "Test Co".',
      },
      "Test Co",
    )
    expect(value).toBe(GBP_NOT_FOUND_VALUE)
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
