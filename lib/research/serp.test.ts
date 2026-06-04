import { describe, expect, it } from "vitest"

import { topCompetitorDomains } from "@/lib/research/serp"

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
})
