import { describe, expect, it } from "vitest"

import {
  classifyBusinessCategory,
  displayCategoryLabel,
  normalizeGbpCategory,
  resolveGbpCategoryAlias,
  shouldIncludeBbbReputationCheck,
  prefersB2bReviewDirectories,
} from "@/lib/taxonomy/business-category"

describe("normalizeGbpCategory", () => {
  it("coerces SerpAPI string[] type to first string", () => {
    expect(normalizeGbpCategory(["Marketing agency", "Consultant"])).toBe(
      "Marketing agency",
    )
  })
})

describe("classifyBusinessCategory", () => {
  it("classifies Level Play Digital away from General business services", () => {
    const result = classifyBusinessCategory({
      primaryService: "marketing automation platform",
      primaryServiceKeywords: "marketing operations software",
      gbpCategory: "Marketing agency",
      websiteTitle: "Level Play Digital — Marketing Systems & Automation",
      businessName: "Level Play Digital",
    })

    expect(result.id).not.toBe("general_business")
    expect(result.label).not.toMatch(/general business services/i)
    expect(["marketing_agency", "b2b_saas", "consulting_b2b"]).toContain(result.id)
  })

  it("classifies local HVAC from intake", () => {
    const result = classifyBusinessCategory({
      primaryService: "HVAC repair and installation",
      gbpCategory: null,
    })
    expect(result.id).toBe("local_home_services")
    expect(result.label).toBe("Local home services")
  })

  it("classifies real estate from GBP", () => {
    const result = classifyBusinessCategory({
      primaryService: "General business services",
      gbpCategory: "Real estate agency",
    })
    expect(result.id).toBe("real_estate")
    expect(result.source).toBe("gbp")
  })

  it("returns pending label for free-snapshot placeholder without signals", () => {
    const result = classifyBusinessCategory({
      primaryService: "General business services",
    })
    expect(result.id).toBe("general_business")
    expect(result.label).toBe("Business category pending")
  })

  it("honors paid intake businessVertical over GBP inference", () => {
    const result = classifyBusinessCategory({
      businessVertical: "consulting_b2b",
      primaryService: "Marketing agency retainer",
      gbpCategory: "Marketing agency",
    })
    expect(result.id).toBe("consulting_b2b")
    expect(result.label).toBe("B2B consulting & systems")
    expect(result.source).toBe("intake")
  })

  it("maps Internet marketing service to agency when offer is generic", () => {
    expect(
      resolveGbpCategoryAlias("Internet marketing service", "local seo packages"),
    ).toBe("marketing_agency")
    const result = classifyBusinessCategory({
      primaryService: "Local SEO packages",
      gbpCategory: "Internet marketing service",
    })
    expect(result.id).toBe("marketing_agency")
  })

  it("maps Internet marketing service to consulting when offer is systems/automation", () => {
    const result = classifyBusinessCategory({
      primaryService: "marketing automation platform",
      primaryServiceKeywords: "marketing operations software",
      gbpCategory: "Internet marketing service",
    })
    expect(result.id).toBe("consulting_b2b")
  })
})

describe("category-dependent reputation logic", () => {
  it("skips BBB for B2B consultancies and agencies", () => {
    expect(shouldIncludeBbbReputationCheck("consulting_b2b")).toBe(false)
    expect(shouldIncludeBbbReputationCheck("marketing_agency")).toBe(false)
    expect(shouldIncludeBbbReputationCheck("b2b_saas")).toBe(false)
  })

  it("includes BBB for local service verticals", () => {
    expect(shouldIncludeBbbReputationCheck("local_home_services")).toBe(true)
    expect(shouldIncludeBbbReputationCheck("real_estate")).toBe(true)
  })

  it("prefers B2B directories for agency/SaaS categories", () => {
    expect(prefersB2bReviewDirectories("marketing_agency")).toBe(true)
    expect(prefersB2bReviewDirectories("local_home_services")).toBe(false)
  })
})

describe("displayCategoryLabel", () => {
  it("prefers taxonomy label over raw GBP passthrough", () => {
    expect(
      displayCategoryLabel(
        {
          id: "marketing_agency",
          label: "Marketing & digital agency",
          source: "gbp",
          gbpCategoryRaw: "Marketing agency",
        },
        "Marketing agency",
      ),
    ).toBe("Marketing & digital agency")
  })
})
