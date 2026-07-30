import { describe, expect, it } from "vitest"

import type { SerpOrganicResult } from "@/lib/research/serp"
import {
  formatOwnerSearchValue,
  ownerSerpResultMatchesSubject,
  pickOwnerRelevantResults,
} from "./owner-serp-evidence"

const owner = "Stephanie Danielle Ragsdale"
const business = "Level Play Digital"

describe("ownerSerpResultMatchesSubject", () => {
  it("rejects unrelated LinkedIn homonyms", () => {
    const result: SerpOrganicResult = {
      query: owner,
      position: 1,
      title: "Jason Fleury - Publicis Digital Experience | LinkedIn",
      link: "https://www.linkedin.com/in/jasonfleury",
      snippet: "Hickory, North Carolina",
    }

    expect(
      ownerSerpResultMatchesSubject(result, owner, business, "levelplaydigital.com"),
    ).toBe(false)
  })

  it("accepts buyer-domain results for owner search", () => {
    const result: SerpOrganicResult = {
      query: owner,
      position: 2,
      title: "About — Level Play Digital",
      link: "https://levelplaydigital.com/about",
      snippet: "Founded by Stephanie Danielle Ragsdale",
    }

    expect(
      ownerSerpResultMatchesSubject(result, owner, business, "levelplaydigital.com"),
    ).toBe(true)
  })
})

describe("pickOwnerRelevantResults", () => {
  it("filters homonyms and formats fallback copy", () => {
    const results: SerpOrganicResult[] = [
      {
        query: owner,
        position: 1,
        title: "Jason Fleury - LinkedIn",
        link: "https://www.linkedin.com/in/jasonfleury",
        snippet: "Unrelated profile",
      },
      {
        query: owner,
        position: 3,
        title: "Stephanie Danielle Ragsdale - Level Play Digital",
        link: "https://www.linkedin.com/in/stephanie-danielle-ragsdale",
        snippet: "Founder at Level Play Digital",
      },
    ]

    const relevant = pickOwnerRelevantResults(results, owner, business)
    expect(relevant).toHaveLength(1)
    expect(relevant[0]?.link).toContain("stephanie-danielle-ragsdale")

    expect(formatOwnerSearchValue(results, owner, business)).toContain(
      "Stephanie Danielle Ragsdale",
    )
  })
})
