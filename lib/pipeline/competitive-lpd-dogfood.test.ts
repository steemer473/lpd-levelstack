import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { resolveCompetitorColumns } from "@/lib/research/serp/competitor-resolve"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"

/**
 * Dogfood scenario: Level Play Digital report 031e84ed — thin service SERP,
 * namesake brands on brand search, GBP category "Marketing agency".
 */
const lpdIntake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Level Play Digital",
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
