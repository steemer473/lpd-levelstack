import { describe, expect, it } from "vitest"

import { getHubUpgradeUrl } from "@/lib/urls"

describe("getHubUpgradeUrl", () => {
  it("includes reportId, planId, source, and pricing hash", () => {
    const url = getHubUpgradeUrl({
      reportId: "11111111-1111-4111-8111-111111111111",
      planId: "levelstack-full-report",
      source: "levelstack_email",
    })

    expect(url).toContain("reportId=11111111-1111-4111-8111-111111111111")
    expect(url).toContain("planId=levelstack-full-report")
    expect(url).toContain("source=levelstack_email")
    expect(url).toContain("#pricing")
  })

  it("defaults to full report plan when omitted", () => {
    const url = getHubUpgradeUrl({ reportId: "abc" })
    expect(url).toContain("planId=levelstack-full-report")
  })
})
