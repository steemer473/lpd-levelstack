import { describe, expect, it } from "vitest"

import { getHubCartUrl, getHubSeoWaitlistUrl, getHubUpgradeUrl } from "@/lib/urls"

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

describe("getHubCartUrl", () => {
  it("includes product, plan, reportId, and source", () => {
    const url = getHubCartUrl({
      reportId: "11111111-1111-4111-8111-111111111111",
      plan: "levelstack-standard",
      source: "levelstack_report",
    })

    expect(url).toContain("/cart")
    expect(url).toContain("product=levelstack")
    expect(url).toContain("plan=levelstack-standard")
    expect(url).toContain("reportId=11111111-1111-4111-8111-111111111111")
    expect(url).toContain("source=levelstack_report")
  })

  it("defaults to levelstack-standard when plan omitted", () => {
    const url = getHubCartUrl({ reportId: "abc" })
    expect(url).toContain("plan=levelstack-standard")
  })
})

describe("getHubSeoWaitlistUrl", () => {
  it("includes reportId, source, and waitlist hash", () => {
    const url = getHubSeoWaitlistUrl({
      reportId: "11111111-1111-4111-8111-111111111111",
      source: "levelstack_report_credit",
    })

    expect(url).toContain("reportId=11111111-1111-4111-8111-111111111111")
    expect(url).toContain("source=levelstack_report_credit")
    expect(url).toContain("#waitlist")
  })
})
