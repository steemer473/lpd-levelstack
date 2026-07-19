import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"
import { UNABLE_TO_VERIFY_VALUE } from "@/lib/report/customer-copy"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Level Play Digital",
  websiteUrl: "https://levelplaydigital.com",
  ownerName: "Stephanie Dragsdale",
  complaintsAwareness: "None known",
  reputationScale: 7,
}

describe("buildSectionsFromResearch reputation filtering", () => {
  it("excludes unrelated directory SERP hits from reputation findings", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital reviews",
        results: [
          {
            query: "Level Play Digital reviews",
            position: 1,
            title:
              "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
            link: "https://example.com/best-agencies",
            snippet: "Compare top-rated agencies in Atlanta.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!

    expect(reputation.findings.some((f) => f.value.includes("Castleberry Hill"))).toBe(
      false,
    )
    expect(reputation.findings[0]?.value).toContain("No review listings found")
    expect(reputation.findings[0]?.label).toBe("Review search: Level Play Digital")
  })

  it("does not surface raw provider errors in reputation findings", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital reviews",
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error.",
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!

    expect(reputation.findings[0]?.value).toBe(UNABLE_TO_VERIFY_VALUE)
    expect(reputation.findings[0]?.value).not.toContain("Internal SE Server Error")
  })

  it("keeps subject-specific reputation hits", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital yelp",
        results: [
          {
            query: "Level Play Digital yelp",
            position: 1,
            title: "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
            link: "https://example.com/list",
            snippet: "Directory listing",
          },
          {
            query: "Level Play Digital yelp",
            position: 2,
            title: "Level Play Digital - Atlanta, GA",
            link: "https://www.yelp.com/biz/level-play-digital-atlanta",
            snippet: "4.2 out of 5 stars · 18 reviews",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!

    expect(reputation.findings.some((f) => f.value.includes("Castleberry Hill"))).toBe(
      false,
    )
    expect(reputation.findings[0]?.value).toContain("4.2★")
    expect(reputation.findings[0]?.value).toContain("Yelp")
  })

  it("rejects namesake Trustpilot listing from another company", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital Atlanta reviews",
        results: [
          {
            query: "Level Play Digital Atlanta reviews",
            position: 1,
            title: "Play Digital Signage Reviews 155",
            link: "https://www.trustpilot.com/review/playsignage.com",
            snippet:
              "Play Digital Signage has 5 stars! Check out what 155 people have written so far.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!
    const finding = reputation.findings[0]

    expect(finding?.value).not.toContain("Trustpilot")
    expect(finding?.value).not.toContain("playsignage")
    expect(finding?.value).toContain("No review listings found")
    expect(finding?.label).toBe("Review search: Level Play Digital Atlanta")
  })

  it("reports own-site review search instead of raw homepage title", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital Atlanta reviews",
        results: [
          {
            query: "Level Play Digital Atlanta reviews",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com/",
            snippet:
              "Level Play Digital is a platform company. We do not take on custom development.",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!
    const finding = reputation.findings[0]

    expect(finding?.value).toContain("No review profile found")
    expect(finding?.detail).toContain("homepage first")
    expect(finding?.severity).toBe("high")
    expect(finding?.label).toBe("Review search: Level Play Digital Atlanta")
  })
})

describe("buildSectionsFromResearch search and digital copy", () => {
  it("frames search findings with prospect-facing context", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
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
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "Stephanie Dragsdale",
        results: [
          {
            query: "Stephanie Dragsdale",
            position: 1,
            title: "Stephanie Dragsdale | LinkedIn",
            link: "https://linkedin.com/in/stephanie",
            snippet: "Founder",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const search = sections.find((s) => s.id === "search_footprint")!

    expect(search.findings[0]?.detail).toContain("prospects see")
    expect(search.findings[1]?.value).toContain("When someone searches your name")
  })
})

describe("buildSectionsFromResearch competitive grid", () => {
  it("omits competitive grid when only platform domains are present", () => {
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorDomains = ["google.com"]
    bundle.competitiveContext.serviceSearch = {
      query: "digital marketing agency Atlanta",
      results: [
        {
          query: "digital marketing agency Atlanta",
          position: 1,
          title: "Google",
          link: "https://www.google.com/search",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }
    bundle.digitalPresence.website.url = intake.websiteUrl

    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!

    expect(competitive.competitiveGrid).toBeUndefined()
    expect(competitive.findings[0]?.value).toContain(
      "No direct competitor domains on page 1",
    )
    expect(competitive.findings[1]?.label).toContain("Page 1 evidence")
    expect(competitive.findings[1]?.detail).toContain("[directory/platform]")
  })

  it("builds competitive grid with real competitor domains only", () => {
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorDomains = ["google.com", "rival-agency.com"]
    bundle.competitiveContext.serviceSearch = {
      query: "digital marketing agency Atlanta",
      results: [
        {
          query: "digital marketing agency Atlanta",
          position: 1,
          title: "Google",
          link: "https://www.google.com/",
          snippet: "",
        },
        {
          query: "digital marketing agency Atlanta",
          position: 2,
          title: "Rival Agency",
          link: "https://rival-agency.com/",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }
    bundle.digitalPresence.website.url = intake.websiteUrl
    bundle.digitalPresence.website.title = "Level Play Digital"

    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!

    expect(competitive.competitiveGrid?.columnHeaders).toEqual([
      "You (Level Play Digital)",
      "Rival Agency",
    ])
    expect(competitive.competitiveGrid?.columnHeaders).not.toContain("google.com")
    expect(competitive.competitiveGrid?.rows[0]?.label).toBe("Comparison type")
  })

  it("builds namesake fallback grid when service SERP has only platforms", () => {
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorDomains = []
    bundle.competitiveContext.competitorColumns = [
      { domain: "levelagency.com", source: "namesake", title: "Level Agency" },
    ]
    bundle.competitiveContext.comparisonMode = "namesake"
    bundle.competitiveContext.serviceSearch = {
      query: "marketing automation platform",
      results: [
        {
          query: "marketing automation platform",
          position: 1,
          title: "Google",
          link: "https://www.google.com/",
          snippet: "",
        },
      ],
      aiOverview: null,
      limitation: null,
    }
    bundle.digitalPresence.website.url = intake.websiteUrl
    bundle.digitalPresence.gbp.category = "Marketing agency"

    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")!

    expect(competitive.label).toBe("Category & namesake comparison")
    expect(competitive.competitiveGrid?.columnHeaders[1]).toContain("Level Agency")
    expect(competitive.findings[0]?.value).toContain("levelagency.com")
  })
})

describe("buildSectionsFromResearch P1-2 insufficient data", () => {
  it("does not score Reputation 62 when ≥50% of checks failed", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital reviews",
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error.",
      },
      {
        query: "Level Play Digital yelp",
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error.",
      },
      {
        query: "Level Play Digital bbb",
        results: [
          {
            query: "Level Play Digital bbb",
            position: 1,
            title: "Unrelated directory",
            link: "https://example.com/list",
            snippet: "Directory listing",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "Level Play Digital clutch",
        results: [
          {
            query: "Level Play Digital clutch",
            position: 1,
            title: "Another directory",
            link: "https://example.com/other",
            snippet: "More listings",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!

    expect(reputation.status).toBe("insufficient_data")
    expect(reputation.score).toBeNull()
    expect(
      reputation.findings.some((f) => f.value === UNABLE_TO_VERIFY_VALUE),
    ).toBe(true)
  })

  it("scores Reputation from real negatives when only 1/4 checks failed", () => {
    const bundle = emptyResearchBundle()
    bundle.reputation.searches = [
      {
        query: "Level Play Digital reviews",
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error.",
      },
      {
        query: "Level Play Digital yelp",
        results: [
          {
            query: "Level Play Digital yelp",
            position: 1,
            title: "Unrelated directory",
            link: "https://example.com/list",
            snippet: "Directory listing",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "Level Play Digital bbb",
        results: [
          {
            query: "Level Play Digital bbb",
            position: 1,
            title: "Unrelated directory 2",
            link: "https://example.com/list2",
            snippet: "Directory listing",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "Level Play Digital clutch",
        results: [
          {
            query: "Level Play Digital clutch",
            position: 1,
            title: "Unrelated directory 3",
            link: "https://example.com/list3",
            snippet: "Directory listing",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const reputation = sections.find((s) => s.id === "online_reputation")!

    expect(reputation.status).toBe("attention")
    expect(reputation.score).toBe(62)
  })

  it("distinguishes tier-skipped GBP from checked-not-found", () => {
    const skipped = emptyResearchBundle()
    // emptyGbp already Not fetched yet
    const skippedSections = buildSectionsFromResearch(intake, skipped)
    const skippedDigital = skippedSections.find((s) => s.id === "digital_presence")!
    const skippedGbp = skippedDigital.findings.find((f) =>
      /business profile|gbp/i.test(f.label),
    )
    expect(skippedGbp?.value).toContain("not checked")
    expect(skippedGbp?.severity).toBe("medium")

    const checked = emptyResearchBundle()
    checked.digitalPresence.gbp = {
      found: false,
      title: null,
      rating: null,
      reviewCount: null,
      address: null,
      category: null,
      limitation: 'No Google Maps listing found for "Level Play Digital".',
    }
    checked.digitalPresence.website = {
      ...checked.digitalPresence.website,
      url: intake.websiteUrl,
      title: "Level Play Digital",
      metaDescription: "Agency",
      h1: "Home",
      limitation: null,
    }
    checked.digitalPresence.pageSpeed = {
      mobileScore: 80,
      lcp: null,
      cls: null,
      limitation: null,
    }

    const checkedSections = buildSectionsFromResearch(intake, checked)
    const checkedDigital = checkedSections.find((s) => s.id === "digital_presence")!
    const checkedGbp = checkedDigital.findings.find((f) =>
      /business profile|gbp/i.test(f.label),
    )
    expect(checkedGbp?.value).toContain("No confirmed Google Business Profile")
    expect(checkedGbp?.severity).toBe("high")
    expect(checkedGbp?.value).not.toBe(skippedGbp?.value)
  })
})

describe("buildSectionsFromResearch AI Overview (P0-2)", () => {
  it("emits Google-only aiPreview without ChatGPT stub", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com",
            snippet: "Marketing operations",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const search = sections.find((s) => s.id === "search_footprint")!

    expect(search.aiPreview).toHaveLength(1)
    expect(search.aiPreview?.[0]?.platform).toBe("Google AI Overview")
    expect(search.aiPreview?.[0]?.result).toMatch(/No Google AI Overview/i)
    expect(JSON.stringify(search)).not.toMatch(/not automated in v1/i)
    expect(JSON.stringify(search)).not.toMatch(/ChatGPT/i)
  })

  it("marks cited AI Overview as low severity", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com",
            snippet: "Marketing",
          },
        ],
        aiOverview: "Level Play Digital helps local businesses with marketing ops.",
        limitation: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const search = sections.find((s) => s.id === "search_footprint")!

    expect(search.aiPreview?.[0]?.severity).toBe("low")
    expect(search.aiPreview?.[0]?.result).toMatch(/mentions your business/i)
  })

  it("does not invent a confident missing-AIO gap when brand SERP failed", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Level Play Digital",
        results: [],
        aiOverview: null,
        limitation: "Internal SE Server Error",
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    const search = sections.find((s) => s.id === "search_footprint")!

    expect(search.aiPreview?.[0]?.result).toMatch(/Unable to verify/i)
    expect(search.aiPreview?.[0]?.result).not.toMatch(/No Google AI Overview/i)
  })
})
