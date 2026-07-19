import { describe, expect, it } from "vitest"

import {
  LEVELSTACK_UNLOCK_97_CTA,
  resolvePaidOwnerFreeChrome,
  resolveReportNavVariant,
} from "@/lib/reports/paid-owner-report-chrome"

describe("resolvePaidOwnerFreeChrome", () => {
  it("marks paid owner free when ready Action Roadmap exists", () => {
    expect(
      resolvePaidOwnerFreeChrome({
        paidAccess: true,
        reportTier: "free_snapshot",
        status: "ready",
        readyPaidReportId: "paid-1",
      }),
    ).toEqual({ paidOwnerFree: true, paidPendingIntake: false })
  })

  it("marks genuine pending intake when paid but no ready paid report", () => {
    expect(
      resolvePaidOwnerFreeChrome({
        paidAccess: true,
        reportTier: "free_snapshot",
        status: "ready",
        readyPaidReportId: null,
      }),
    ).toEqual({ paidOwnerFree: false, paidPendingIntake: true })
  })

  it("is inactive for unpaid free viewers", () => {
    expect(
      resolvePaidOwnerFreeChrome({
        paidAccess: false,
        reportTier: "free_snapshot",
        status: "ready",
        readyPaidReportId: "paid-1",
      }),
    ).toEqual({ paidOwnerFree: false, paidPendingIntake: false })
  })

  it("is inactive on paid report tiers", () => {
    expect(
      resolvePaidOwnerFreeChrome({
        paidAccess: true,
        reportTier: "full_report",
        status: "ready",
        readyPaidReportId: "paid-1",
      }),
    ).toEqual({ paidOwnerFree: false, paidPendingIntake: false })
  })
})

describe("resolveReportNavVariant", () => {
  it("prefers paidPendingIntake over paidOwnerFree", () => {
    expect(resolveReportNavVariant(true, true, "free_snapshot")).toBe(
      "paidPendingIntake",
    )
  })

  it("uses paidOwnerFree when upgrade is already complete", () => {
    expect(resolveReportNavVariant(false, true, "free_snapshot")).toBe(
      "paidOwnerFree",
    )
  })

  it("uses freeReport for unpaid free snapshots", () => {
    expect(resolveReportNavVariant(false, false, "free_snapshot")).toBe(
      "freeReport",
    )
  })
})

describe("LEVELSTACK_UNLOCK_97_CTA", () => {
  it("documents the purchase string paid-owner chrome must suppress", () => {
    expect(LEVELSTACK_UNLOCK_97_CTA).toMatch(/\$97/)
    expect(LEVELSTACK_UNLOCK_97_CTA).not.toMatch(/View your Action Roadmap/i)
  })
})
