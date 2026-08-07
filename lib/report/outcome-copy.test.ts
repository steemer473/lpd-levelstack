import { describe, expect, it } from "vitest"

import {
  ROADMAP_BUCKET_EMPTY_COPY,
  SCORE_DISCLAIMER,
  scoreDisclaimerParagraphs,
  shouldShowActionItemSapMicroCta,
} from "@/lib/report/outcome-copy"

describe("SCORE_DISCLAIMER", () => {
  it("covers product distinction, score basis, and methodology", () => {
    const paragraphs = scoreDisclaimerParagraphs()
    expect(paragraphs).toHaveLength(3)
    expect(SCORE_DISCLAIMER.title).toBe("About these scores")
    expect(paragraphs.join(" ")).toMatch(/Visibility Snapshot/)
    expect(paragraphs.join(" ")).toMatch(/Action Roadmap/)
    expect(paragraphs.join(" ")).toMatch(/different section sets/)
    expect(paragraphs.join(" ")).toMatch(/not a guarantee/i)
  })
})

describe("ROADMAP_BUCKET_EMPTY_COPY", () => {
  it("has non-empty copy for week, month, and quarter", () => {
    for (const key of ["week", "month", "quarter"] as const) {
      expect(ROADMAP_BUCKET_EMPTY_COPY[key].length).toBeGreaterThan(0)
    }
  })
})

describe("shouldShowActionItemSapMicroCta", () => {
  it("hides the Automator micro-CTA for owner-only non-technical tasks", () => {
    expect(shouldShowActionItemSapMicroCta("You")).toBe(false)
    expect(shouldShowActionItemSapMicroCta("Owner")).toBe(false)
    expect(shouldShowActionItemSapMicroCta("Founder")).toBe(false)
  })

  it("shows the micro-CTA when a technical assignee is involved", () => {
    expect(shouldShowActionItemSapMicroCta("You / Freelancer")).toBe(true)
    expect(shouldShowActionItemSapMicroCta("Freelancer / Developer")).toBe(true)
    expect(shouldShowActionItemSapMicroCta("Dev")).toBe(true)
  })

  it("shows the micro-CTA when the item is automatable even if owner-only", () => {
    expect(
      shouldShowActionItemSapMicroCta("You", { automatable: true }),
    ).toBe(true)
  })
})
