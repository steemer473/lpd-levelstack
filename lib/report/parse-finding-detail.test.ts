import { describe, expect, it } from "vitest"

import { parseFindingDetail, splitFindingValue } from "./parse-finding-detail"

describe("parseFindingDetail", () => {
  it("parses numbered SERP results with URLs", () => {
    const detail =
      '#1 Better Homes (https://metrobrokers.com/); #2 Community (https://atlcommunities.com/); #3 Yelp (https://yelp.com/biz/x)'
    const parsed = parseFindingDetail(detail)
    expect(parsed?.kind).toBe("serp")
    if (parsed?.kind === "serp") {
      expect(parsed.items).toHaveLength(3)
      const first = parsed.items[0]
      expect(first?.position).toBe(1)
      expect(first?.url).toContain("metrobrokers")
    }
  })

  it("strips prospect-facing Top results prefix", () => {
    const parsed = parseFindingDetail(
      "These are the top Google results prospects see: #1 Acme (https://acme.com); #2 Beta (https://beta.com)",
    )
    expect(parsed?.kind).toBe("serp")
    if (parsed?.kind === "serp") {
      expect(parsed.intro).toContain("prospects see")
    }
  })

  it("strips Top results prefix", () => {
    const parsed = parseFindingDetail(
      "Top results: #1 Acme (https://acme.com); #2 Beta (https://beta.com)",
    )
    expect(parsed?.kind).toBe("serp")
    if (parsed?.kind === "serp") {
      expect(parsed.intro).toBe("Top results")
    }
  })

  it("parses Meta / H1 key-value detail", () => {
    const parsed = parseFindingDetail(
      "Meta: Welcome to our site H1: Book a consultation today",
    )
    expect(parsed?.kind).toBe("keyValue")
  })
})

describe("splitFindingValue", () => {
  it("emphasizes domain list after include", () => {
    const { lead, emphasis } = splitFindingValue(
      "Top domains on page 1 include: metrobrokers.com, yelp.com",
    )
    expect(lead).toMatch(/include:$/i)
    expect(emphasis).toContain("metrobrokers")
  })
})
