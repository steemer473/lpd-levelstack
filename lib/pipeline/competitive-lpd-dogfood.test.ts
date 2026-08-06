import { describe, expect, it } from "vitest"

import { deriveOverallFromSections } from "@/lib/audit/derive-overall-from-sections"
import { levelstackIntakeTestDefaults } from "@/lib/intake/schema"
import { directoryReviewQueries } from "@/lib/pipeline/research-queries"
import { resolveCompetitorColumns } from "@/lib/research/serp/competitor-resolve"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"
import { classifyBusinessCategory } from "@/lib/taxonomy/business-category"

/**
 * Dogfood scenario: Level Play Digital report 031e84ed — thin service SERP,
 * namesake brands on brand search, GBP category "Marketing agency".
 */
const lpdIntake = {
  ...levelstackIntakeTestDefaults,
  primaryBusinessName: "Level Play Digital",
  businessVertical: "consulting_b2b" as const,
  primaryService: "marketing automation platform",
  marketCity: "Atlanta",
  marketState: "GA",
  geoMarket: "local" as const,
  websiteUrl: "https://levelplaydigital.com",
  ownerName: "Stephanie Dragsdale",
  complaintsAwareness: "None known",
  reputationScale: 7,
}

describe("LPD dogfood competitive section", () => {
  it("surfaces namesake competitor with evidence when service SERP is platform-only", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "marketing automation platform Atlanta, GA",
          position: 1,
          title: "Google",
          link: "https://www.google.com/search?q=marketing",
          snippet: "",
        },
        {
          query: "marketing automation platform Atlanta, GA",
          position: 2,
          title: "Best platforms list",
          link: "https://www.g2.com/categories/marketing-automation",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const brandSearches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com/",
            snippet: "Platform company",
          },
          {
            query: "Level Play Digital",
            position: 3,
            title: "Level Agency — Full Service Marketing",
            link: "https://levelagency.com/",
            snippet: "Atlanta marketing agency",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake: lpdIntake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
    })

    expect(resolved.mode).toBe("namesake")
    expect(resolved.columns[0]?.domain).toBe("levelagency.com")

    const bundle = emptyResearchBundle()
    bundle.competitiveContext.serviceSearch = serviceSearch
    bundle.competitiveContext.competitorColumns = resolved.columns
    bundle.competitiveContext.comparisonMode = resolved.mode
    bundle.competitiveContext.competitorDomains = []
    bundle.digitalPresence.website.url = lpdIntake.websiteUrl
    bundle.digitalPresence.gbp.category = "Marketing agency"
    bundle.digitalPresence.gbp.found = true

    const sections = buildSectionsFromResearch(lpdIntake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!

    expect(competitive.competitiveGrid).toBeDefined()
    expect(competitive.findings[0]?.value).toContain("levelagency.com")
    expect(competitive.findings[0]?.detail).toContain("https://")
    expect(competitive.findings[0]?.detail).toContain("[directory/platform]")
    expect(competitive.competitiveGrid?.columnHeaders).not.toContain("google.com")
    expect(competitive.competitiveGrid?.rows[0]?.cells[1]).toContain("Namesake")
  })

  it("excludes buyer squat and prefers collision brands (production failure case)", () => {
    const serviceSearch = {
      query: "SAAS and stand alone products Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "B2B SaaS Software Companies in Atlanta, GA",
          link: "https://www.google.com/goto?url=abc",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    // Production brand search surfaced the buyer's own .cloud squat and an
    // unrelated Unity product before any real namesake.
    const brandSearches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital Cloud",
            link: "https://levelplaydigital.cloud/index.php",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake: lpdIntake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
      nameCollisions: [
        {
          title: "Level Agency",
          link: "https://levelagency.com/",
          type: "direct_competitor",
        },
        {
          title: "Level Workforce",
          link: "https://levelworkforce.com/",
          type: "direct_competitor",
        },
      ],
    })

    const domains = resolved.columns.map((c) => c.domain)
    expect(domains).not.toContain("levelplaydigital.cloud")
    expect(domains).toContain("levelagency.com")
    expect(domains).toContain("levelworkforce.com")
  })
})

describe("LPD dogfood paid taxonomy + scoring (P1-4 / P1-1)", () => {
  it("classifies LPD away from General business services", () => {
    const withPicker = classifyBusinessCategory({
      businessVertical: lpdIntake.businessVertical,
      primaryService: lpdIntake.primaryService,
      gbpCategory: "Internet marketing service",
      businessName: lpdIntake.primaryBusinessName,
    })
    expect(withPicker.id).toBe("consulting_b2b")
    expect(withPicker.source).toBe("intake")

    const inferred = classifyBusinessCategory({
      primaryService: lpdIntake.primaryService,
      primaryServiceKeywords: "marketing operations software",
      gbpCategory: "Internet marketing service",
      businessName: lpdIntake.primaryBusinessName,
    })
    expect(inferred.id).toBe("consulting_b2b")
    expect(inferred.label).not.toMatch(/general business services/i)
  })

  it("skips BBB reputation queries for LPD paid intake", () => {
    const queries = directoryReviewQueries(lpdIntake, "full_report", {
      gbpCategory: "Marketing agency",
    })
    expect(queries.some((q) => q.includes("bbb.org"))).toBe(false)
  })

  it("derives Overall from displayed section scores (closes 87/62/62 → 57 gap)", () => {
    const derived = deriveOverallFromSections([
      { id: "search_footprint", score: 87, status: "good" },
      { id: "online_reputation", score: 62, status: "attention" },
      { id: "digital_presence", score: 62, status: "attention" },
    ])
    expect(derived.overallScore).toBe(70)
    expect(derived.letterGrade).toBe("C-")
  })

  it("shows taxonomy label in competitive grid Business category row", () => {
    const bundle = emptyResearchBundle()
    bundle.businessCategory = classifyBusinessCategory({
      primaryService: lpdIntake.primaryService,
      gbpCategory: "Marketing agency",
    })
    bundle.digitalPresence.gbp.category = "Marketing agency"
    bundle.digitalPresence.gbp.found = true
    bundle.digitalPresence.website.url = lpdIntake.websiteUrl
    bundle.competitiveContext.competitorColumns = [
      { domain: "levelagency.com", source: "namesake", title: "Level Agency" },
    ]
    bundle.competitiveContext.comparisonMode = "namesake"
    bundle.competitiveContext.serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [],
      aiOverview: null,
      limitation: null,
    }

    const sections = buildSectionsFromResearch(lpdIntake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!
    const categoryRow = competitive.competitiveGrid?.rows.find(
      (r) => r.label === "Business category",
    )
    expect(categoryRow?.cells[0]).toBe("Marketing & digital agency")
    expect(categoryRow?.cells[0]).not.toBe("General business services")
  })

  it("does not surface careerbuilder/monday/workamajig as competitive peers", () => {
    const serviceSearch = {
      query: "marketing operations software Atlanta, GA",
      results: [
        {
          query: "marketing operations software Atlanta, GA",
          position: 2,
          title: "Director, Marketing Operations - Remote",
          link: "https://www.careerbuilder.com/job-details/director-marketing-operations",
          snippet: "",
        },
        {
          query: "marketing operations software Atlanta, GA",
          position: 3,
          title: "Marketing operations software: everything you need",
          link: "https://monday.com/blog/project-management/marketing-operations-software/",
          snippet: "",
        },
        {
          query: "marketing operations software Atlanta, GA",
          position: 4,
          title: "Best Marketing Operations Management Software",
          link: "https://www.workamajig.com/blog/marketing-operations-management-software",
          snippet: "",
        },
        {
          query: "marketing operations software Atlanta, GA",
          position: 6,
          title: "Marketing Operations Consulting",
          link: "https://powerdigitalmarketing.com/services/marketing-operations/",
          snippet: "Agency marketing ops consulting",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const brandSearches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com/",
            snippet: "",
          },
          {
            query: "Level Play Digital",
            position: 3,
            title: "Level Agency — Full Service Marketing",
            link: "https://levelagency.com/",
            snippet: "Atlanta marketing agency",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const categoryPeerSearch = {
      query: "Marketing agency Atlanta, GA",
      results: [
        {
          query: "Marketing agency Atlanta, GA",
          position: 1,
          title: "Modo Modo Agency - Atlanta",
          link: "https://modomodoagency.com/",
          snippet: "Full-service marketing agency",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const resolved = resolveCompetitorColumns({
      intake: {
        ...lpdIntake,
        primaryServiceKeywords: "marketing operations software",
      },
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch,
      buyerCategory: "Marketing agency",
      buyerCategoryId: "marketing_agency",
    })

    expect(resolved.mode).toBe("category_peer")
    expect(resolved.columns.map((c) => c.domain)).not.toContain(
      "careerbuilder.com",
    )
    expect(resolved.columns.map((c) => c.domain)).not.toContain("monday.com")
    expect(resolved.columns.map((c) => c.domain)).not.toContain("workamajig.com")

    const bundle = emptyResearchBundle()
    bundle.competitiveContext.serviceSearch = serviceSearch
    bundle.competitiveContext.competitorColumns = resolved.columns
    bundle.competitiveContext.comparisonMode = resolved.mode
    bundle.competitiveContext.competitorDomains = []
    bundle.digitalPresence.website.url = lpdIntake.websiteUrl
    bundle.digitalPresence.gbp.category = "Marketing agency"
    bundle.digitalPresence.gbp.found = true

    const sections = buildSectionsFromResearch(lpdIntake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!
    const headers = competitive.competitiveGrid?.columnHeaders?.join(" ") ?? ""
    const findingValue = competitive.findings[0]?.value ?? ""

    expect(headers).not.toMatch(/careerbuilder|monday\.com|workamajig/i)
    expect(findingValue).not.toMatch(/careerbuilder\.com|monday\.com|workamajig\.com/i)
    expect(findingValue).not.toMatch(/Top domains on page 1 include:/i)
    expect(findingValue).toMatch(/modomodoagency\.com|category peer/i)
  })
})

/**
 * Dogfood paid regen (staging/dev):
 * POST /api/reports/031e84ed-ae67-437d-8131-774e45655d27/run?regenerate=1
 * Requires NODE_ENV=development or dev preview flag. QA: exec score breakdown,
 * competitive grid category row, no BBB findings for LPD taxonomy.
 */
