import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  buyerRelevanceTokens,
  categoryPeerQuery,
  formatSerpEvidenceTable,
  relevantServicePeerColumns,
  resolveCompetitorColumns,
} from "@/lib/research/serp/competitor-resolve"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Level Play Digital",
  primaryService: "marketing automation platform",
  marketCity: "Atlanta",
  marketState: "GA",
  geoMarket: "local" as const,
  websiteUrl: "https://levelplaydigital.com",
}

describe("resolveCompetitorColumns", () => {
  it("prefers service-search peer domains", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
          snippet: "",
        },
        {
          query: "q",
          position: 2,
          title: "Rival Co",
          link: "https://rival-co.com/",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches: [],
      categoryPeerSearch: null,
    })

    expect(resolved.mode).toBe("service_peer")
    expect(resolved.columns.map((c) => c.domain)).toEqual(["rival-co.com"])
  })

  it("does not treat directory/listicle SERP hits as service peers (P1.7)", () => {
    // Exact production failure: page 1 is all software directories / listicles
    // (gregslist, f6s) plus a non-denylisted host with a listicle title.
    const serviceSearch = {
      query: "SAAS and stand alone products Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "B2B SaaS Software Companies in Atlanta, GA",
          link: "https://gregslist.com/atlanta/software-companies-type/b2b-saas/",
          snippet: "",
        },
        {
          query: "q",
          position: 2,
          title: "SaaS Development Company in Atlanta, GA",
          link: "https://www.solidfuture.com/saas-development-company-atlanta",
          snippet: "",
        },
        {
          query: "q",
          position: 3,
          title: "72 top SaaS companies and startups in Atlanta in June 2026",
          link: "https://www.f6s.com/companies/saas/united-states/georgia/atlanta/co",
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
            snippet: "",
          },
          {
            query: "Level Play Digital",
            position: 2,
            title: "Level Agency",
            link: "https://levelagency.com/",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
    })

    expect(resolved.servicePeerDomains).toEqual([])
    expect(resolved.mode).toBe("namesake")
    expect(resolved.columns.map((c) => c.domain)).toContain("levelagency.com")
    expect(resolved.columns.map((c) => c.domain)).not.toContain("gregslist.com")
    expect(resolved.columns.map((c) => c.domain)).not.toContain("solidfuture.com")
  })

  it("falls back to namesake domains from brand search", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
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
            snippet: "",
          },
          {
            query: "Level Play Digital",
            position: 2,
            title: "Level Agency",
            link: "https://levelagency.com/",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
    })

    expect(resolved.mode).toBe("namesake")
    expect(resolved.columns[0]?.domain).toBe("levelagency.com")
    expect(resolved.columns[0]?.source).toBe("namesake")
  })

  it("falls back to category peer search when service and brand are thin", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const categoryPeerSearch = {
      query: "Marketing agency Atlanta, GA",
      results: [
        {
          query: "Marketing agency Atlanta, GA",
          position: 1,
          title: "Local Agency",
          link: "https://local-agency.com/",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches: [
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
          ],
          aiOverview: null,
          limitation: null,
        },
      ],
      categoryPeerSearch,
    })

    expect(resolved.mode).toBe("category_peer")
    expect(resolved.columns[0]?.domain).toBe("local-agency.com")
  })

  it("excludes buyer-root squats (same brand, different TLD) from namesakes", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
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
            title: "Level Play Digital Cloud",
            link: "https://levelplaydigital.cloud/index.php",
            snippet: "",
          },
          {
            query: "Level Play Digital",
            position: 2,
            title: "Level Agency",
            link: "https://levelagency.com/",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
    })

    expect(resolved.columns.map((c) => c.domain)).not.toContain(
      "levelplaydigital.cloud",
    )
    expect(resolved.columns.map((c) => c.domain)).toContain("levelagency.com")
  })

  it("prefers typed direct_competitor name collisions over raw brand order", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
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
            title: "Level Play News",
            link: "https://levelplaynews.com/",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
      nameCollisions: [
        {
          title: "Level Agency LLC",
          link: "https://levelagency.com/",
          type: "direct_competitor",
        },
      ],
    })

    expect(resolved.mode).toBe("namesake")
    expect(resolved.columns[0]?.domain).toBe("levelagency.com")
  })

  it("drops zero brand-token-overlap noise from namesakes", () => {
    const serviceSearch = {
      query: "marketing automation platform Atlanta, GA",
      results: [
        {
          query: "q",
          position: 1,
          title: "Google",
          link: "https://google.com/",
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
            title: "Acme Widgets Unlimited",
            link: "https://acme-widgets.com/",
            snippet: "Industrial widgets",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches,
      categoryPeerSearch: null,
    })

    expect(resolved.columns.map((c) => c.domain)).not.toContain("acme-widgets.com")
  })
})

describe("buyerRelevanceTokens", () => {
  it("derives significant tokens from the GBP category", () => {
    expect(buyerRelevanceTokens("Marketing agency")).toEqual(["marketing", "agency"])
  })

  it("drops generic descriptors", () => {
    expect(buyerRelevanceTokens("Software Company")).toEqual(["software"])
  })

  it("returns empty (gate disabled) when no category", () => {
    expect(buyerRelevanceTokens(null)).toEqual([])
    expect(buyerRelevanceTokens(undefined)).toEqual([])
  })
})

describe("relevantServicePeerColumns", () => {
  const serviceSearch = {
    query: "SAAS and stand alone products Atlanta, GA",
    results: [
      {
        query: "q",
        position: 4,
        title: "Software as a Service (SaaS) in Atlanta",
        link: "https://centurygroup.net/cloud-computing/software-as-a-service/",
        snippet: "Managed IT support services Atlanta",
      },
      {
        query: "q",
        position: 9,
        title: "Enterprise SaaS Development Services",
        link: "https://www.charterglobal.com/services/saas-development/",
        snippet: "AI product engineering",
      },
      {
        query: "q",
        position: 10,
        title: "Acme Marketing Automation Agency",
        link: "https://acme-marketing.com/",
        snippet: "Marketing agency for B2B",
      },
    ],
    aiOverview: null,
    limitation: null,
  }

  it("keeps only on-vertical peers when a category is known", () => {
    const cols = relevantServicePeerColumns({
      serviceSearch,
      buyerHost: "levelplaydigital.com",
      relevanceTokens: buyerRelevanceTokens("Marketing agency"),
    })
    expect(cols.map((c) => c.domain)).toEqual(["acme-marketing.com"])
  })

  it("keeps all qualified peers when relevance gate is disabled (no tokens)", () => {
    const cols = relevantServicePeerColumns({
      serviceSearch,
      buyerHost: "levelplaydigital.com",
      relevanceTokens: [],
    })
    // charterglobal's "Development Services" title is a directory listicle shape;
    // centurygroup + acme remain.
    expect(cols.map((c) => c.domain)).toContain("centurygroup.net")
    expect(cols.map((c) => c.domain)).toContain("acme-marketing.com")
    expect(cols.map((c) => c.domain)).not.toContain("charterglobal.com")
  })
})

describe("resolveCompetitorColumns with buyer category (P1.7.1)", () => {
  it("drops off-vertical SaaS vendors and falls through to namesake", () => {
    const serviceSearch = {
      query: "SAAS and stand alone products Atlanta, GA",
      results: [
        {
          query: "q",
          position: 4,
          title: "Software as a Service (SaaS) in Atlanta",
          link: "https://centurygroup.net/cloud-computing/software-as-a-service/",
          snippet: "Managed IT support",
        },
        {
          query: "q",
          position: 6,
          title: "Professional SaaS Development Services in Atlanta",
          link: "https://www.ideapeel.com/blogs/saas-development-services",
          snippet: "Webflow development agency",
        },
      ],
      aiOverview: null,
      limitation: null,
    }

    const resolved = resolveCompetitorColumns({
      intake,
      buyerHost: "levelplaydigital.com",
      serviceSearch,
      brandSearches: [
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
              position: 2,
              title: "Level Agency",
              link: "https://levelagency.com/",
              snippet: "",
            },
          ],
          aiOverview: null,
          limitation: null,
        },
      ],
      categoryPeerSearch: null,
      buyerCategory: "Marketing agency",
    })

    expect(resolved.servicePeerDomains).toEqual([])
    expect(resolved.mode).toBe("namesake")
    expect(resolved.columns.map((c) => c.domain)).toContain("levelagency.com")
    expect(resolved.columns.map((c) => c.domain)).not.toContain("centurygroup.net")
    expect(resolved.columns.map((c) => c.domain)).not.toContain("ideapeel.com")
  })
})

describe("formatSerpEvidenceTable", () => {
  it("tags platform rows", () => {
    const table = formatSerpEvidenceTable([
      {
        query: "q",
        position: 1,
        title: "Google",
        link: "https://google.com/",
        snippet: "",
      },
      {
        query: "q",
        position: 2,
        title: "Rival",
        link: "https://rival.com/",
        snippet: "",
      },
    ])

    expect(table).toContain("[directory/platform]")
    expect(table).toContain("rival.com")
  })
})

describe("categoryPeerQuery", () => {
  it("combines GBP category with market location when available", () => {
    expect(
      categoryPeerQuery(intake, {
        found: true,
        title: "Level Play Digital",
        rating: 4.5,
        reviewCount: 10,
        address: "Atlanta",
        category: "Marketing agency",
        limitation: null,
      }),
    ).toBe("Marketing agency Atlanta, GA")
  })
})
