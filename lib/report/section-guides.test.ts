import { describe, expect, it } from "vitest"

import {
  getSectionGuide,
  SECTION_GUIDES,
  type SectionGuideBlock,
} from "@/lib/report/section-guides"

function guideHasContent(value: string | SectionGuideBlock[]): boolean {
  if (typeof value === "string") return value.trim().length > 0
  return value.length > 0
}

describe("getSectionGuide", () => {
  it("returns a non-empty guide for social_offsite", () => {
    const guide = getSectionGuide("social_offsite")
    expect(guide).toBeDefined()
    expect(guideHasContent(guide!.what)).toBe(true)
    expect(guideHasContent(guide!.why)).toBe(true)
  })

  it("covers every section tab including social_offsite", () => {
    expect(SECTION_GUIDES).toHaveProperty("social_offsite")
    for (const id of [
      "executive_summary",
      "search_footprint",
      "social_offsite",
      "online_reputation",
      "digital_presence",
      "revenue_funnel",
      "competitive_context",
      "action_plan",
    ]) {
      expect(getSectionGuide(id)).toBeDefined()
    }
  })
})
