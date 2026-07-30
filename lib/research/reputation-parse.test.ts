import { describe, expect, it } from "vitest"

import type { SerpOrganicResult } from "@/lib/research/serp"
import {
  bestReputationHit,
  findOwnSiteReputationResult,
  formatReputationQueryLabel,
  isComplaintOrientedQuery,
  isGenericComplaintPortalResult,
  isGenericDirectoryListing,
  isOwnDomainResult,
  isPlatformSearchResultsPage,
  isReviewPlatformUrl,
  isSubjectComplaintSerpResult,
  isSubjectReputationSerpResult,
  isSubjectReputationText,
  linkedInProfileMatchesOwner,
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

  it("rejects Yelp search result pages (not /biz/ listings)", () => {
    const url =
      "https://m.m.yelp.com/search?find_desc=Digital+Marketing+Agency&find_loc=Franklin%2C+GA"
    expect(isPlatformSearchResultsPage(url)).toBe(true)

    const result: SerpOrganicResult = {
      query: "site:yelp.com Level Play Digital Atlanta",
      position: 1,
      title: "TOP 10 BEST Digital Marketing Agency in Franklin, GA",
      link: url,
      snippet: "Reviews on digital marketing agencies in Franklin.",
    }

    expect(
      reviewPlatformListingMatchesBusiness(
        result,
        "Level Play Digital",
        "levelplaydigital.com",
        "Stephanie Dragsdale",
      ),
    ).toBe(false)
    expect(
      isSubjectReputationSerpResult(
        result,
        "Level Play Digital",
        "Stephanie Dragsdale",
        "levelplaydigital.com",
      ),
    ).toBe(false)
  })

  it("rejects unrelated LinkedIn /in/ profiles in reputation search", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital Atlanta reviews",
      position: 2,
      title: "Jason Fleury - Publicis Digital Experience | LinkedIn",
      link: "https://www.linkedin.com/in/jasonfleury",
      snippet: "Hickory, North Carolina · Publicis Digital Experience",
    }

    expect(
      linkedInProfileMatchesOwner(
        result.link,
        "Stephanie Dragsdale",
        "Level Play Digital",
      ),
    ).toBe(false)
    expect(
      isSubjectReputationSerpResult(
        result,
        "Level Play Digital",
        "Stephanie Dragsdale",
        "levelplaydigital.com",
      ),
    ).toBe(false)
  })

  it("rejects LinkedIn /in/ when owner name was never collected (business name only)", () => {
    expect(
      linkedInProfileMatchesOwner(
        "https://www.linkedin.com/in/jasonfleury",
        "Level Play Digital",
        "Level Play Digital",
      ),
    ).toBe(false)
  })

  it("rejects Georgia AG consumer complaint form as an LPD complaint", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital complaints Atlanta, GA",
      position: 1,
      title: "Consumer Complaint Form | Georgia Attorney General's Consumer Protection Division",
      link: "https://consumer.georgia.gov/resolve-your-dispute/how-do-i-file-complaint/consumer-complaint-form",
      snippet:
        "Use this form to provide information about suspicious or improper business practices.",
    }

    expect(isGenericComplaintPortalResult(result)).toBe(true)
    expect(
      isSubjectComplaintSerpResult(
        result,
        "Level Play Digital",
        "Stephanie Danielle Ragsdale",
        "levelplaydigital.com",
      ),
    ).toBe(false)

    const hit = bestReputationHit(
      [result],
      "Level Play Digital complaints Atlanta, GA",
      {
        businessName: "Level Play Digital",
        ownerName: "Stephanie Danielle Ragsdale",
        buyerHost: "levelplaydigital.com",
      },
    )
    expect(hit).toBeNull()
  })

  it("accepts a complaint listing that names the subject business", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital complaints",
      position: 1,
      title: "Complaints against Level Play Digital — ConsumerAffairs",
      link: "https://www.consumeraffairs.com/business/level-play-digital/complaints",
      snippet: "3 complaints filed against Level Play Digital in the last year.",
    }

    expect(
      isSubjectComplaintSerpResult(
        result,
        "Level Play Digital",
        "Stephanie Danielle Ragsdale",
        "levelplaydigital.com",
      ),
    ).toBe(true)
  })

  it("rejects namesake pages that only share loose tokens with the business name", () => {
    const result: SerpOrganicResult = {
      query: "Level Play Digital complaints Atlanta, GA",
      position: 2,
      title: "LEVEL Studios — employee complaint thread",
      link: "https://example.com/level-studios-complaint",
      snippet: "Discussion about level pay and play policies at a creative agency.",
    }

    expect(
      isSubjectComplaintSerpResult(
        result,
        "Level Play Digital",
        "Stephanie Danielle Ragsdale",
        "levelplaydigital.com",
      ),
    ).toBe(false)
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
