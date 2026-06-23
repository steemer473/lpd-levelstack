import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Level Play Digital",
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
    expect(reputation.findings[0]?.value).toBe(
      "No platform-specific review snippets captured.",
    )
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
    expect(reputation.findings[0]?.value).toContain("Level Play Digital")
    expect(reputation.findings[0]?.value).toContain("4.2★")
  })
})
