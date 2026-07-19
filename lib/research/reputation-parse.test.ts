import { describe, expect, it } from "vitest"

import type { SerpOrganicResult } from "@/lib/research/serp"
import {
  bestReputationHit,
  findOwnSiteReputationResult,
  formatReputationQueryLabel,
  isGenericDirectoryListing,
  isOwnDomainResult,
  isReviewPlatformUrl,
  isSubjectReputationSerpResult,
  isSubjectReputationText,
  parseRatingFromText,
  reviewPlatformListingMatchesBusiness,
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

  it("rejects namesake Trustpilot listing for a different company", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital Atlanta reviews",
      position: 1,
      title: "Play Digital Signage Reviews 155",
      link: "https://www.trustpilot.com/review/playsignage.com",
      snippet:
        "Play Digital Signage has 5 stars! Check out what 155 people have written so far.",
    }

    expect(
      isSubjectReputationSerpResult(
        result,
        "Level Play Digital",
        "Stephanie",
        "levelplaydigital.com",
      ),
    ).toBe(false)
    expect(
      reviewPlatformListingMatchesBusiness(
        result,
        "Level Play Digital",
        "levelplaydigital.com",
      ),
    ).toBe(false)

    const hit = bestReputationHit(resultsFromPlaySignageFalsePositive(), "Level Play Digital Atlanta reviews", {
      businessName: "Level Play Digital",
      ownerName: "Stephanie",
      buyerHost: "levelplaydigital.com",
    })

    expect(hit).toBeNull()
  })

  it("accepts Trustpilot listing when reviewed domain matches buyer host", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital reviews",
      position: 1,
      title: "Level Play Digital Reviews",
      link: "https://www.trustpilot.com/review/levelplaydigital.com",
      snippet: "4.8 out of 5 · 12 reviews",
    }

    expect(
      reviewPlatformListingMatchesBusiness(
        result,
        "Level Play Digital",
        "levelplaydigital.com",
      ),
    ).toBe(true)
    expect(
      isSubjectReputationSerpResult(
        result,
        "Level Play Digital",
        "Stephanie",
        "levelplaydigital.com",
      ),
    ).toBe(true)
  })

  it("does not match a single shared token like play", () => {
    expect(
      isSubjectReputationText(
        "Play Digital Signage has 5 stars on Trustpilot",
        "Level Play Digital",
        "",
      ),
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

  it("detects review platform URLs", () => {
    expect(isReviewPlatformUrl("https://www.yelp.com/biz/acme")).toBe(true)
    expect(isReviewPlatformUrl("https://levelplaydigital.com/")).toBe(false)
  })

  it("detects own-domain results", () => {
    const result: SerpOrganicResult = {
      query: "Acme reviews",
      position: 1,
      title: "Acme Plumbing",
      link: "https://www.acmeplumbing.com/about",
      snippet: "Family owned since 1990",
    }
    expect(isOwnDomainResult(result, "acmeplumbing.com")).toBe(true)
  })

  it("excludes own-domain hits when buyer host is provided", () => {
    const results: SerpOrganicResult[] = [
      {
        query: "Level Play Digital reviews",
        position: 1,
        title: "Level Play Digital",
        link: "https://levelplaydigital.com/",
        snippet: "We build workflow products.",
      },
      {
        query: "Level Play Digital reviews",
        position: 2,
        title: "Level Play Digital - Atlanta, GA",
        link: "https://www.yelp.com/biz/level-play-digital-atlanta",
        snippet: "4.1 out of 5 stars · 9 reviews",
      },
    ]

    const hit = bestReputationHit(results, "Level Play Digital reviews", {
      businessName: "Level Play Digital",
      ownerName: "Stephanie",
      buyerHost: "levelplaydigital.com",
    })

    expect(hit?.result.link).toContain("yelp.com")
    expect(hit?.parsed.rating).toBe(4.1)
  })

  it("finds own-site result when no review listing exists", () => {
    const results: SerpOrganicResult[] = [
      {
        query: "Level Play Digital reviews",
        position: 1,
        title: "Level Play Digital",
        link: "https://levelplaydigital.com/",
        snippet: "Platform company.",
      },
    ]

    const own = findOwnSiteReputationResult(results, {
      businessName: "Level Play Digital",
      ownerName: "Stephanie",
      buyerHost: "levelplaydigital.com",
    })

    expect(own?.link).toContain("levelplaydigital.com")
  })

  it("formats reputation query labels", () => {
    expect(formatReputationQueryLabel("Level Play Digital yelp")).toBe("Yelp visibility")
    expect(formatReputationQueryLabel("site:clutch.co Level Play Digital")).toBe(
      "Clutch visibility",
    )
    expect(formatReputationQueryLabel("Level Play Digital Atlanta reviews")).toBe(
      "Review search: Level Play Digital Atlanta",
    )
  })
})

function resultsFromPlaySignageFalsePositive(): SerpOrganicResult[] {
  return [
    {
      query: "Level Play Digital Atlanta reviews",
      position: 1,
      title: "Play Digital Signage Reviews 155",
      link: "https://www.trustpilot.com/review/playsignage.com",
      snippet:
        "Play Digital Signage has 5 stars! Check out what 155 people have written so far.",
    },
  ]
}
