import { describe, expect, it } from "vitest"

import {
  isProviderQuotaError,
  isRetryableProviderError,
  shouldFailoverOrganic,
} from "@/lib/research/serp/quota-errors"

describe("isProviderQuotaError", () => {
  it("detects quota-related HTTP status codes", () => {
    expect(isProviderQuotaError(null, 402)).toBe(true)
    expect(isProviderQuotaError(null, 429)).toBe(true)
    expect(isProviderQuotaError(null, 500)).toBe(false)
  })

  it("detects quota-related error messages", () => {
    expect(isProviderQuotaError("Your account has run out of searches")).toBe(true)
    expect(isProviderQuotaError("Monthly quota exceeded")).toBe(true)
    expect(isProviderQuotaError("Insufficient credits")).toBe(true)
    expect(isProviderQuotaError("Rate limit exceeded")).toBe(true)
    expect(isProviderQuotaError("No Google Maps listing found")).toBe(false)
  })
})

describe("isRetryableProviderError", () => {
  it("detects transient non-quota failures", () => {
    expect(isRetryableProviderError("Internal SE Server Error.")).toBe(true)
    expect(isRetryableProviderError("request timed out")).toBe(true)
    expect(isRetryableProviderError(null, 500)).toBe(true)
    expect(isRetryableProviderError("Unexpected token < in JSON")).toBe(true)
  })

  it("does not retry quota or genuine empty results", () => {
    expect(isRetryableProviderError("Your account has run out of searches")).toBe(false)
    expect(isRetryableProviderError("No Google Maps listing found for query.")).toBe(
      false,
    )
    expect(isRetryableProviderError(null, 429)).toBe(false)
  })
})

describe("shouldFailoverOrganic", () => {
  it("returns true for quota errors even with empty results", () => {
    expect(
      shouldFailoverOrganic(
        { results: [], limitation: "Your account has run out of searches" },
        200,
      ),
    ).toBe(true)
  })

  it("returns false for successful empty results", () => {
    expect(
      shouldFailoverOrganic(
        { results: [], limitation: "No Google Maps listing found for query." },
        200,
      ),
    ).toBe(false)
  })
})

