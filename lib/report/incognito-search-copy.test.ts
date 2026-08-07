import { describe, expect, it } from "vitest"

import { buildIncognitoSearchNextStep } from "@/lib/report/incognito-search-copy"

describe("buildIncognitoSearchNextStep", () => {
  it("uses a single query when owner matches business and service is placeholder", () => {
    const sub = buildIncognitoSearchNextStep({
      businessName: "LT Printing & Promotion",
      ownerName: "LT Printing & Promotion",
      primaryService: "General business services",
    })
    expect(sub).toBe(
      'Next step: Search in a private/incognito browser for "LT Printing & Promotion" — no personal history.',
    )
    expect(sub).not.toMatch(/"LT Printing & Promotion" and "LT Printing/)
  })

  it("uses distinct ownerName as the second query", () => {
    const sub = buildIncognitoSearchNextStep({
      businessName: "Test Co",
      ownerName: "Alex",
      primaryService: "General business services",
    })
    expect(sub).toBe(
      'Next step: Search in a private/incognito browser for "Test Co" and "Alex" — no personal history.',
    )
  })

  it("prefers businessName + primaryService when service is meaningful", () => {
    const sub = buildIncognitoSearchNextStep({
      businessName: "Test Co",
      ownerName: "Alex",
      primaryService: "Plumbing repair",
    })
    expect(sub).toBe(
      'Next step: Search in a private/incognito browser for "Test Co" and "Test Co Plumbing repair" — no personal history.',
    )
  })

  it("uses category label when service is placeholder and owner matches", () => {
    const sub = buildIncognitoSearchNextStep({
      businessName: "Test Co",
      ownerName: "Test Co",
      primaryService: "General business services",
      categoryLabel: "Printing",
    })
    expect(sub).toBe(
      'Next step: Search in a private/incognito browser for "Test Co" and "Test Co Printing" — no personal history.',
    )
  })
})
