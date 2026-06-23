import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"

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
