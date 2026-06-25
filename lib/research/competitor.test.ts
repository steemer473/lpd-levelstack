import { describe, expect, it } from "vitest"

import {
  cleanCompetitorHomepageTitle,
  reviewHitMatchesDomain,
} from "@/lib/research/competitor"

describe("reviewHitMatchesDomain", () => {
  it("accepts a review hit that references the competitor brand root", () => {
    const hit = {
      query: "levelagency.com reviews",
      position: 1,
      title: "Level Agency Reviews",
      link: "https://www.trustpilot.com/review/levelagency.com",
      snippet: "Read customer reviews of Level Agency.",
    }
    expect(reviewHitMatchesDomain(hit, "levelagency.com")).toBe(true)
  })

  it("rejects an unrelated namesake review page", () => {
    const hit = {
      query: "levelplaydigital.cloud reviews",
      position: 1,
      title: "Read Customer Service Reviews of trueplan.io",
      link: "https://www.trustpilot.com/review/trueplan.io",
      snippet: "trueplan has 5 stars.",
    }
    expect(reviewHitMatchesDomain(hit, "levelplaydigital.cloud")).toBe(false)
  })

  it("rejects when the brand root is too short to be meaningful", () => {
    const hit = {
      query: "ab.com reviews",
      position: 1,
      title: "AB reviews",
      link: "https://example.com/ab",
      snippet: "",
    }
    expect(reviewHitMatchesDomain(hit, "ab.com")).toBe(false)
  })
})

describe("cleanCompetitorHomepageTitle", () => {
  it("keeps a real homepage title", () => {
    expect(
      cleanCompetitorHomepageTitle("Level Agency: Full-service digital marketing"),
    ).toBe("Level Agency: Full-service digital marketing")
  })

  it("suppresses bot interstitial titles (P1.7)", () => {
    expect(cleanCompetitorHomepageTitle("Checking your browser")).toBeNull()
    expect(cleanCompetitorHomepageTitle("Just a moment...")).toBeNull()
  })

  it("suppresses directory listicle titles", () => {
    expect(
      cleanCompetitorHomepageTitle("72 top SaaS companies and startups in Atlanta"),
    ).toBeNull()
    expect(cleanCompetitorHomepageTitle(null)).toBeNull()
  })
})
