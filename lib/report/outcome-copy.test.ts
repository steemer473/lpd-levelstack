import { describe, expect, it } from "vitest"

import {
  CHARTER_GUARANTEE,
  ROADMAP_BUCKET_EMPTY_COPY,
  SAP_BRIDGE_PLACEMENT_3,
  SCORE_DISCLAIMER,
  scoreDisclaimerParagraphs,
  shouldShowActionItemSapMicroCta,
  UPGRADE_BANNER,
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

describe("CHARTER_GUARANTEE", () => {
  it("matches COPY_BANK FAQ-03 direction", () => {
    expect(CHARTER_GUARANTEE.title).toBe("100% Risk-Free Charter Guarantee")
    expect(CHARTER_GUARANTEE.body).toMatch(/Secure your Action Roadmap today for \$97/)
    expect(CHARTER_GUARANTEE.body).toMatch(/Priority waitlist/)
    expect(CHARTER_GUARANTEE.body).toMatch(/assessment fee credit/)
    expect(CHARTER_GUARANTEE.body).toMatch(/Dashboard live immediately/)
  })
})

describe("SAP_BRIDGE_PLACEMENT_3", () => {
  it("matches COPY_BANK §3 Placement 3", () => {
    expect(SAP_BRIDGE_PLACEMENT_3.body).toBe(
      "Your Action Roadmap tells you what to fix and why. Most items still need your time or someone else's. The technical SEO layer is the one part that can run continuously through product-managed monitoring — so you stay focused on the work only you can do while the product handles routine technical corrections.",
    )
    expect(UPGRADE_BANNER.monitoringBridge).toMatch(/monitors your site continuously so you can see what changed/)
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
