import { describe, expect, it } from "vitest"

import { expandAcronymsInCustomerCopy, TERMS } from "./customer-terms"

describe("expandAcronymsInCustomerCopy", () => {
  it("expands NAP so it is not mistaken for an unknown acronym", () => {
    expect(expandAcronymsInCustomerCopy("Match NAP to your website")).toBe(
      `Match ${TERMS.nap} to your website`,
    )
  })

  it("expands GBP, CTA, and SERP", () => {
    const out = expandAcronymsInCustomerCopy("Update GBP and CTA on the SERP")
    expect(out).toContain(TERMS.gbp)
    expect(out).toContain(TERMS.cta)
    expect(out).toContain(TERMS.serp)
  })

  it("leaves already-expanded NAP phrasing readable", () => {
    const once = expandAcronymsInCustomerCopy(TERMS.nap)
    expect(once).toBe(TERMS.nap)
  })
})
