import { describe, expect, it } from "vitest"

import { socialSerpHitMatchesBrand } from "@/lib/research/social-search"

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

  it("accepts LinkedIn company pages that match the brand", () => {
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
})
