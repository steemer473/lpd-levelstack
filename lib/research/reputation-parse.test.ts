import { describe, expect, it } from "vitest"

import type { SerpOrganicResult } from "@/lib/research/serp"
import {
  bestReputationHit,
  isGenericDirectoryListing,
  isSubjectReputationSerpResult,
  isSubjectReputationText,
  parseRatingFromText,
} from "@/lib/research/reputation-parse"

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

describe("reputation relevance", () => {
  it("detects generic directory listings", () => {
    expect(
      isGenericDirectoryListing(
        "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
      ),
    ).toBe(true)
  })

  it("matches subject business tokens in SERP text", () => {
    expect(
      isSubjectReputationText(
        "Level Play Digital — Atlanta marketing agency · 4.2★",
        "Level Play Digital",
        "Stephanie Dragsdale",
      ),
    ).toBe(true)
  })

  it("rejects unrelated directory results", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital reviews",
      position: 1,
      title: "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
      link: "https://example.com/best-agencies",
      snippet: "Compare top-rated agencies in Atlanta.",
    }

    expect(
      isSubjectReputationSerpResult(result, "Level Play Digital", "Stephanie"),
    ).toBe(false)
  })

  it("skips unrelated top results and picks the next relevant hit", () => {
    const results: SerpOrganicResult[] = [
      {
        query: "Level Play Digital yelp",
        position: 1,
        title: "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
        link: "https://example.com/list",
        snippet: "Directory listing",
      },
      {
        query: "Level Play Digital yelp",
        position: 2,
        title: "Level Play Digital - Atlanta, GA",
        link: "https://www.yelp.com/biz/level-play-digital-atlanta",
        snippet: "4.2 out of 5 stars · 18 reviews",
      },
    ]

    const hit = bestReputationHit(results, "Level Play Digital yelp", {
      businessName: "Level Play Digital",
      ownerName: "Stephanie",
    })

    expect(hit?.result.position).toBe(2)
    expect(hit?.parsed.rating).toBe(4.2)
    expect(hit?.result.title).toContain("Level Play Digital")
  })

  it("keeps legacy behavior without subject context", () => {
    const results: SerpOrganicResult[] = [
      {
        query: "rival.com reviews",
        position: 1,
        title: "Rival Co Reviews",
        link: "https://example.com/reviews",
        snippet: "4.0 out of 5 · 50 reviews",
      },
    ]

    expect(bestReputationHit(results, "rival.com reviews")?.result.position).toBe(1)
  })
})
