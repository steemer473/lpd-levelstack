import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  categoryPeerQuery,
  formatSerpEvidenceTable,
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
