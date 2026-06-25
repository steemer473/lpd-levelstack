import { describe, expect, it } from "vitest"

import {
  filterCompetitorDomains,
  isBotInterstitialTitle,
  isDirectoryListingTitle,
  isNonCompetitorHost,
  isQualifiedPeerResult,
  qualifiedPeerDomains,
  topCompetitorDomains,
} from "@/lib/research/serp/competitor-domains"

describe("isNonCompetitorHost", () => {
  it("flags major platforms and directories", () => {
    expect(isNonCompetitorHost("google.com")).toBe(true)
    expect(isNonCompetitorHost("www.google.com")).toBe(true)
    expect(isNonCompetitorHost("maps.google.com")).toBe(true)
    expect(isNonCompetitorHost("yelp.com")).toBe(true)
    expect(isNonCompetitorHost("facebook.com")).toBe(true)
    expect(isNonCompetitorHost("clutch.co")).toBe(true)
  })

  it("allows real business domains", () => {
    expect(isNonCompetitorHost("rival-agency.com")).toBe(false)
    expect(isNonCompetitorHost("levelagency.com")).toBe(false)
  })
})

describe("topCompetitorDomains", () => {
  it("excludes buyer hostname and returns up to three competitors", () => {
    const results = [
      {
        query: "test",
        position: 1,
        title: "Comp A",
        link: "https://comp-a.com/page",
        snippet: "",
      },
      {
        query: "test",
        position: 2,
        title: "Buyer",
        link: "https://buyer.com/home",
        snippet: "",
      },
      {
        query: "test",
        position: 3,
        title: "Comp B",
        link: "https://comp-b.com",
        snippet: "",
      },
      {
        query: "test",
        position: 4,
        title: "Comp C",
        link: "https://comp-c.org",
        snippet: "",
      },
    ]

    expect(topCompetitorDomains(results, "buyer.com", 3)).toEqual([
      "comp-a.com",
      "comp-b.com",
      "comp-c.org",
    ])
  })

  it("skips google.com and other platforms even when they rank first", () => {
    const results = [
      {
        query: "test",
        position: 1,
        title: "Google",
        link: "https://www.google.com/search?q=test",
        snippet: "",
      },
      {
        query: "test",
        position: 2,
        title: "Rival",
        link: "https://rival-agency.com/",
        snippet: "",
      },
      {
        query: "test",
        position: 3,
        title: "Yelp list",
        link: "https://www.yelp.com/biz/something",
        snippet: "",
      },
      {
        query: "test",
        position: 4,
        title: "Another rival",
        link: "https://another-rival.io",
        snippet: "",
      },
    ]

    expect(topCompetitorDomains(results, "levelplaydigital.com", 3)).toEqual([
      "rival-agency.com",
      "another-rival.io",
    ])
  })

  it("returns empty when only platform domains appear", () => {
    const results = [
      {
        query: "test",
        position: 1,
        title: "Google",
        link: "https://google.com/",
        snippet: "",
      },
      {
        query: "test",
        position: 2,
        title: "Google support",
        link: "https://support.google.com/business",
        snippet: "",
      },
    ]

    expect(topCompetitorDomains(results, "buyer.com", 3)).toEqual([])
  })
})

describe("filterCompetitorDomains", () => {
  it("removes platforms and buyer host from stored domain lists", () => {
    expect(
      filterCompetitorDomains(
        ["google.com", "levelplaydigital.com", "rival.com", "yelp.com"],
        "levelplaydigital.com",
      ),
    ).toEqual(["rival.com"])
  })

  it("treats software/startup directories as non-competitors (P1.7)", () => {
    expect(isNonCompetitorHost("gregslist.com")).toBe(true)
    expect(isNonCompetitorHost("f6s.com")).toBe(true)
    expect(isNonCompetitorHost("getlatka.com")).toBe(true)
    expect(isNonCompetitorHost("builtin.com")).toBe(true)
    expect(isNonCompetitorHost("crunchbase.com")).toBe(true)
  })
})

describe("isDirectoryListingTitle", () => {
  it("flags listicle / directory titles", () => {
    expect(isDirectoryListingTitle("B2B SaaS Software Companies in Atlanta, GA")).toBe(true)
    expect(isDirectoryListingTitle("SaaS Development Company in Atlanta")).toBe(true)
    expect(isDirectoryListingTitle("72 top SaaS companies and startups in Atlanta")).toBe(true)
    expect(isDirectoryListingTitle("Top 10 Marketing Agencies")).toBe(true)
    expect(isDirectoryListingTitle("38 Software Companies Helping Atlanta")).toBe(true)
    expect(isDirectoryListingTitle("Best digital agencies near you")).toBe(true)
  })

  it("allows real business homepage titles", () => {
    expect(isDirectoryListingTitle("Level Agency: Full-service digital marketing")).toBe(false)
    expect(isDirectoryListingTitle("Operational Systems for Agencies & Marketers")).toBe(false)
    expect(isDirectoryListingTitle("Acme Plumbing — Atlanta Emergency Plumber")).toBe(false)
    expect(isDirectoryListingTitle(null)).toBe(false)
  })
})

describe("isBotInterstitialTitle", () => {
  it("flags bot walls and interstitials", () => {
    expect(isBotInterstitialTitle("Checking your browser")).toBe(true)
    expect(isBotInterstitialTitle("Just a moment...")).toBe(true)
    expect(isBotInterstitialTitle("Attention Required! | Cloudflare")).toBe(true)
    expect(isBotInterstitialTitle("Access denied")).toBe(true)
  })

  it("allows real titles", () => {
    expect(isBotInterstitialTitle("Level Agency: Full-service digital")).toBe(false)
    expect(isBotInterstitialTitle(undefined)).toBe(false)
  })
})

describe("qualifiedPeerDomains", () => {
  it("excludes directory hosts and listicle-titled results", () => {
    const results = [
      {
        query: "q",
        position: 1,
        title: "B2B SaaS Software Companies in Atlanta, GA",
        link: "https://gregslist.com/atlanta/b2b-saas",
        snippet: "",
      },
      {
        query: "q",
        position: 2,
        title: "72 top SaaS companies and startups in Atlanta",
        link: "https://www.f6s.com/companies/saas/atlanta",
        snippet: "",
      },
      {
        query: "q",
        position: 3,
        title: "SaaS Development Company in Atlanta, GA",
        link: "https://realvendor.com/atlanta",
        snippet: "",
      },
      {
        query: "q",
        position: 4,
        title: "Acme Marketing Automation",
        link: "https://acme-automation.com/",
        snippet: "",
      },
    ]

    expect(qualifiedPeerDomains(results, "buyer.com", 3)).toEqual([
      "acme-automation.com",
    ])
  })

  it("returns empty when page 1 is entirely directories/listicles", () => {
    const results = [
      {
        query: "q",
        position: 1,
        title: "B2B SaaS Software Companies in Atlanta, GA",
        link: "https://gregslist.com/atlanta/b2b-saas",
        snippet: "",
      },
      {
        query: "q",
        position: 2,
        title: "72 top SaaS companies in Atlanta",
        link: "https://www.f6s.com/atlanta",
        snippet: "",
      },
    ]

    expect(qualifiedPeerDomains(results, "buyer.com", 3)).toEqual([])
  })
})

describe("isQualifiedPeerResult", () => {
  it("keeps a real business result", () => {
    expect(
      isQualifiedPeerResult(
        {
          query: "q",
          position: 1,
          title: "Acme Marketing Automation",
          link: "https://acme-automation.com/",
          snippet: "",
        },
        "buyer.com",
      ),
    ).toBe(true)
  })
})
