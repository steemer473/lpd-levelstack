import { describe, expect, it } from "vitest"

/**
 * Mirrors /intake branching: paid + ready Action Roadmap → done;
 * paid + free latest + no ready paid → upgrade form; else normal.
 */
function resolveIntakePaidOwnerBranch(input: {
  paidAccess: boolean
  latestTier: string | null | undefined
  readyPaidReportId: string | null | undefined
}): "done" | "upgrade_form" | "unchanged" {
  if (input.paidAccess && input.readyPaidReportId) return "done"
  if (input.paidAccess && input.latestTier === "free_snapshot") return "upgrade_form"
  return "unchanged"
}

describe("intake paid-owner branch", () => {
  it("shows done when paid and ready Action Roadmap exists even if latest is free", () => {
    expect(
      resolveIntakePaidOwnerBranch({
        paidAccess: true,
        latestTier: "free_snapshot",
        readyPaidReportId: "paid-1",
      }),
    ).toBe("done")
  })

  it("keeps upgrade form for first-time paid without ready paid report", () => {
    expect(
      resolveIntakePaidOwnerBranch({
        paidAccess: true,
        latestTier: "free_snapshot",
        readyPaidReportId: null,
      }),
    ).toBe("upgrade_form")
  })

  it("leaves unpaid users unchanged", () => {
    expect(
      resolveIntakePaidOwnerBranch({
        paidAccess: false,
        latestTier: "free_snapshot",
        readyPaidReportId: null,
      }),
    ).toBe("unchanged")
  })
})
