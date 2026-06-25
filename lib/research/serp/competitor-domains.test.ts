import { describe, expect, it } from "vitest"

import {
  filterCompetitorDomains,
  isNonCompetitorHost,
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
})
