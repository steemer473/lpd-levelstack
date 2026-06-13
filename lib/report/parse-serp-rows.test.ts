import { describe, expect, it } from "vitest"

import { extractPreviewCompetitor, parseSerpRowsFromDetail } from "@/lib/report/parse-serp-rows"

describe("parse-serp-rows", () => {
  const detail =
    'Top results: #1 Platinum Real Estate: Home (https://contactplatinum.com/); #2 Platinum Real Estate | Linwood, NJ (https://www.platinumrealestatenj.com/)'

  it("parses SERP rows with domains and titles", () => {
    const rows = parseSerpRowsFromDetail(detail)
    expect(rows[0]?.domain).toBe("contactplatinum.com")
    expect(rows[0]?.serpPosition).toBe(1)
    expect(rows[0]?.title).toContain("Platinum Real Estate")
    expect(rows[1]?.domain).toBe("platinumrealestatenj.com")
  })

  it("extracts preview competitor from first row", () => {
    const preview = extractPreviewCompetitor(detail)
    expect(preview?.domain).toBe("contactplatinum.com")
    expect(preview?.rank).toBe(1)
  })
})
