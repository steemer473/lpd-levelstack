import { describe, expect, it } from "vitest"

import {
  flattenExecutiveInsight,
  flattenStructuredExecutiveInsights,
} from "@/lib/report/executive-insight-parts"

describe("executive-insight-parts", () => {
  it("flattens structured parts into paragraph-separated copy", () => {
    const flat = flattenExecutiveInsight([
      { kind: "text", text: "Frame paragraph." },
      {
        kind: "finding",
        prefix: "From public research:",
        text: "Your site was not in the top 10.",
        suffix: "Open Search footprint.",
      },
      { kind: "muted", text: "Upgrade to the Action Roadmap ($97)." },
    ])

    expect(flat).toContain("Frame paragraph.")
    expect(flat).toContain("From public research: Your site was not in the top 10. Open Search footprint.")
    expect(flat).toContain("Upgrade to the Action Roadmap ($97).")
  })

  it("flattens all structured insight keys", () => {
    const flat = flattenStructuredExecutiveInsights({
      whatProspectsSee: [{ kind: "highlight", text: "Search context." }],
      reputationGap: [{ kind: "muted", text: "Upgrade copy." }],
      revenueRisk: [{ kind: "text", text: "Risk frame." }],
    })

    expect(flat.whatProspectsSee).toBe("Search context.")
    expect(flat.reputationGap).toBe("Upgrade copy.")
    expect(flat.revenueRisk).toBe("Risk frame.")
  })
})
