import { describe, expect, it } from "vitest"

import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { validateResearchQuality } from "@/lib/pipeline/research-quality"

describe("validateResearchQuality", () => {
  it("passes when SERP and website signals are present", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Test Co",
        results: [
          {
            query: "Test Co",
            position: 1,
            title: "Test Co",
            link: "https://example.com",
            snippet: "Example",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.primaryDomain.website = {
      ...bundle.primaryDomain.website,
      url: "https://example.com",
      title: "Test Co — Home",
      limitation: null,
    }

    expect(validateResearchQuality(bundle, "free_snapshot").ok).toBe(true)
  })

  it("fails when SERP data is missing", () => {
    const bundle = emptyResearchBundle()
    bundle.primaryDomain.website.title = "Test Co"

    const result = validateResearchQuality(bundle, "free_snapshot")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.userMessage).toContain("live research")
    }
  })
})
