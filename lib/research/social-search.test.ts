import { describe, expect, it } from "vitest"

import {
  brandSocialSlugCandidates,
  socialSerpHitMatchesBrand,
} from "@/lib/research/social-search"

describe("socialSerpHitMatchesBrand", () => {
  const brand = "Level Play Digital"
  const domain = "levelplaydigital.com"

  it("rejects unrelated LinkedIn personal profiles that rank for weak tokens", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Cassandra Qualls - Offering Atlanta businesses strategic ...",
          link: "https://www.linkedin.com/in/cassandraquall",
          snippet: "Helping Atlanta businesses with digital strategy",
        },
        brand,
        domain,
      ),
    ).toBe(false)
  })

  it("rejects namesake brands like Next Level Play", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Next Level Play",
          link: "https://sg.linkedin.com/company/next-lvl-play",
          snippet: "Next Level Play company page",
        },
        brand,
        domain,
      ),
    ).toBe(false)
  })

  it("accepts the real company slug for Level Play Digital", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Level Play Digital | LinkedIn",
          link: "https://www.linkedin.com/company/levelplaydigital",
          snippet: "",
        },
        brand,
        domain,
      ),
    ).toBe(true)
  })

  it("accepts LinkedIn company pages that match the dashed brand slug", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Level Play Digital | LinkedIn",
          link: "https://www.linkedin.com/company/level-play-digital",
          snippet: "Level Play Digital builds operational systems.",
        },
        brand,
        domain,
      ),
    ).toBe(true)
  })

  it("accepts hits that mention the buyer domain", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Stephanie Dragsdale - Founder",
          link: "https://www.linkedin.com/in/stephaniedragsdale",
          snippet: "Founder at Level Play Digital (levelplaydigital.com)",
        },
        brand,
        domain,
      ),
    ).toBe(true)
  })

  it("accepts full brand name in the title", () => {
    expect(
      socialSerpHitMatchesBrand(
        {
          title: "Level Play Digital on Facebook",
          link: "https://www.facebook.com/some-page",
          snippet: "",
        },
        brand,
        domain,
      ),
    ).toBe(true)
  })

  it("builds slug candidates from brand + domain", () => {
    expect(brandSocialSlugCandidates(brand, domain)).toEqual(
      expect.arrayContaining(["levelplaydigital", "level-play-digital"]),
    )
  })
})
