import { describe, expect, it } from "vitest"

import {
  SCORE_DISCLAIMER,
  scoreDisclaimerParagraphs,
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
