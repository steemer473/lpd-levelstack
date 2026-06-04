import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  businessNameForSearch,
  mapsLocationHint,
  scopedSearchPhrase,
} from "@/lib/intake/location"

describe("market location helpers", () => {
  it("scopes business name with city and state", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Platinum Real Estate",
      marketCity: "Atlanta",
      marketState: "GA",
      geoMarket: "local" as const,
    }
    expect(businessNameForSearch(intake)).toBe("Platinum Real Estate Atlanta, GA")
    expect(mapsLocationHint(intake)).toBe("Atlanta, GA")
  })

  it("falls back to near me for local without city", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Platinum Real Estate",
      geoMarket: "local" as const,
    }
    expect(mapsLocationHint(intake)).toBe("near me")
    expect(scopedSearchPhrase("Platinum Real Estate", intake)).toBe(
      "Platinum Real Estate",
    )
  })
})
