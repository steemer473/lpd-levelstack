import { describe, expect, it } from "vitest"

import { sanitizeFreeSnapshotPrefill } from "@/lib/intake/upgrade-prefill"

describe("sanitizeFreeSnapshotPrefill", () => {
  it("keeps real business fields and clears placeholder intake values", () => {
    const result = sanitizeFreeSnapshotPrefill({
      primaryBusinessName: "Level Play Digital",
      websiteUrl: "https://levelplaydigital.com",
      marketCity: "Atlanta",
      ownerName: "Level Play Digital",
      primaryService: "General business services",
      pricePoint: "Not specified",
      emailListSize: "Unknown",
      purchaseMotivation: "Free snapshot audit",
      priorBusinessNames: ["None"],
    })

    expect(result.primaryBusinessName).toBe("Level Play Digital")
    expect(result.websiteUrl).toBe("https://levelplaydigital.com")
    expect(result.marketCity).toBe("Atlanta")
    expect(result.ownerName).toBe("")
    expect(result.primaryService).toBe("")
    expect(result.purchaseMotivation).toBe("")
    expect(result.priorBusinessNames).toEqual(["None"])
  })
})
