import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  priorNamesForSearch,
  brandNameSearchQueries,
  directoryReviewQueries,
  normalizeServiceQuery,
  reputationQueries,
  searchFootprintQueries,
  serviceMarketQuery,
} from "@/lib/pipeline/research-queries"

describe("normalizeServiceQuery", () => {
  it("keeps short service phrases unchanged", () => {
    expect(normalizeServiceQuery("Real estate agent")).toBe("Real estate agent")
  })

  it("takes the first clause of a multi-clause service description", () => {
    expect(
      normalizeServiceQuery(
        "SAAS and stand alone products, operational efficiency products",
      ),
    ).toBe("SAAS and stand alone products")
  })

  it("caps very long single clauses to six words", () => {
    expect(
      normalizeServiceQuery("one two three four five six seven eight"),
    ).toBe("one two three four five six")
  })
})

describe("research-queries", () => {
  it("normalizes verbose primary service in market query", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryService:
        "SAAS and stand alone products, operational efficiency products",
      marketCity: "Atlanta",
      marketState: "GA",
      geoMarket: "local" as const,
      priorBusinessNames: ["None"],
    }
    expect(serviceMarketQuery(intake)).toBe(
      "SAAS and stand alone products Atlanta, GA",
    )
  })

  it("filters None from prior name searches", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      priorBusinessNames: ["None", "Old Studio LLC"],
    }
    expect(priorNamesForSearch(intake)).toEqual(["Old Studio LLC"])
  })

  it("builds footprint queries for business, owner, and service", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Acme Co",
      ownerName: "Jane Doe",
      primaryService: "Fitness coaching",
      geoMarket: "local" as const,
      priorBusinessNames: ["None"],
    }
    const queries = searchFootprintQueries(intake)
    expect(queries).toContain("Acme Co")
    expect(queries).toContain("Jane Doe")
    expect(queries.some((q) => q.includes("Fitness coaching"))).toBe(true)
  })

  it("includes platform-specific reputation queries", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Acme Co",
      ownerName: "Jane",
      priorBusinessNames: ["None"],
    }
    const queries = reputationQueries(intake)
    expect(queries.some((q) => q.includes("yelp.com"))).toBe(true)
    expect(queries.some((q) => q.includes("bbb.org"))).toBe(true)
  })

  it("scopes local service and business queries with city", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Platinum Real Estate",
      primaryService: "Real estate agent",
      marketCity: "Atlanta",
      marketState: "GA",
      geoMarket: "local" as const,
      priorBusinessNames: ["None"],
      ownerName: "Luther Ragsdale",
    }
    const footprint = searchFootprintQueries(intake)
    expect(footprint[0]).toContain("Atlanta")
    expect(serviceMarketQuery(intake)).toBe("Real estate agent Atlanta, GA")
  })

  it("trims brand and directory queries for free snapshot tier", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Acme Co",
      websiteUrl: "https://acme.example.com",
      marketCity: "Atlanta",
      marketState: "GA",
      geoMarket: "local" as const,
      priorBusinessNames: ["Old Acme"],
    }

    expect(brandNameSearchQueries(intake, "free_snapshot")).toHaveLength(1)
    expect(directoryReviewQueries(intake, "free_snapshot")).toHaveLength(4)
    expect(brandNameSearchQueries(intake, "full_report").length).toBeGreaterThan(1)
    expect(directoryReviewQueries(intake, "full_report")).toHaveLength(9)
  })
})
