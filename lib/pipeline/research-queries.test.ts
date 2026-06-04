import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  priorNamesForSearch,
  reputationQueries,
  searchFootprintQueries,
  serviceMarketQuery,
} from "@/lib/pipeline/research-queries"

describe("research-queries", () => {
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
})
