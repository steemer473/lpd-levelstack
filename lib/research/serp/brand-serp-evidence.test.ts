import { describe, expect, it } from "vitest"

import { formatBrandSerpEvidence } from "@/lib/research/serp/brand-serp-evidence"
import type { SerpOrganicResult } from "@/lib/research/serp/types"

function result(
  position: number,
  title: string,
  link: string,
  snippet = "",
): SerpOrganicResult {
  return { query: "Level Play Digital", position, title, link, snippet }
}

describe("formatBrandSerpEvidence", () => {
  it("keeps buyer pages and drops unrelated Atlanta co-rankers", () => {
    const formatted = formatBrandSerpEvidence(
      [
        result(
          1,
          "Level Play Digital: We Build Intelligent Operational Systems",
          "https://levelplaydigital.com/",
        ),
        result(
          2,
          "We Kept Seeing the Same Problems. So We Started Building",
          "https://levelplaydigital.com/about",
        ),
        result(
          3,
          "ATL14 Data Center | 250 Williams Street",
          "https://www.digitalrealty.com/data-centers/americas/atlanta/atl14",
        ),
      ],
      "levelplaydigital.com",
      "Level Play Digital",
    )

    expect(formatted).toContain("Your pages on page 1")
    expect(formatted).toContain("levelplaydigital.com")
    expect(formatted).toContain("/about")
    expect(formatted).not.toContain("digitalrealty")
    expect(formatted).not.toContain("Williams Street")
  })

  it("includes brand-mentioned namesakes when buyer is missing", () => {
    const formatted = formatBrandSerpEvidence(
      [
        result(
          1,
          "Next Level Play — Atlanta",
          "https://nextlevelplay.example/",
          "Next Level Play sports facility",
        ),
        result(
          2,
          "Unrelated HVAC",
          "https://hvac.example/",
        ),
      ],
      "levelplaydigital.com",
      "Level Play",
    )

    expect(formatted).toContain("nextlevelplay.example")
    expect(formatted).not.toContain("hvac.example")
  })
})
