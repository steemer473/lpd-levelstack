import { describe, expect, it, vi } from "vitest"

import {
  getLatestReadyPaidReportForIntake,
  getLatestReadyPaidReportForUser,
  getLatestReportForIntake,
} from "@/lib/reports/get-latest-report-for-intake"

function mockSupabaseWithReports(
  reports: unknown[],
  error: { message: string } | null = null,
) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: reports[0] ?? null,
      error,
    }),
  }

  return {
    from: vi.fn().mockReturnValue(chain),
    chain,
  }
}

describe("getLatestReportForIntake", () => {
  it("queries by intake_id ordered by created_at descending with limit 1", async () => {
    const { from, chain } = mockSupabaseWithReports([
      { id: "report-new", status: "pending", report_tier: "free_snapshot", job_id: "job-1" },
    ])

    const result = await getLatestReportForIntake(
      { from } as unknown as Parameters<typeof getLatestReportForIntake>[0],
      "intake-1",
    )

    expect(from).toHaveBeenCalledWith("levelstack_reports")
    expect(chain.eq).toHaveBeenCalledWith("intake_id", "intake-1")
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual({
      id: "report-new",
      status: "pending",
      report_tier: "free_snapshot",
      job_id: "job-1",
    })
  })

  it("returns null when no report exists", async () => {
    const { from } = mockSupabaseWithReports([])

    const result = await getLatestReportForIntake(
      { from } as unknown as Parameters<typeof getLatestReportForIntake>[0],
      "intake-empty",
    )

    expect(result).toBeNull()
  })

  it("returns null and logs on query error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { from } = mockSupabaseWithReports([], { message: "query failed" })

    const result = await getLatestReportForIntake(
      { from } as unknown as Parameters<typeof getLatestReportForIntake>[0],
      "intake-1",
    )

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe("getLatestReadyPaidReportForIntake", () => {
  it("filters ready paid tiers for the intake", async () => {
    const { from, chain } = mockSupabaseWithReports([
      { id: "paid-1", status: "ready", report_tier: "full_report", job_id: "job-p" },
    ])

    const result = await getLatestReadyPaidReportForIntake(
      { from } as unknown as Parameters<typeof getLatestReadyPaidReportForIntake>[0],
      "intake-1",
    )

    expect(chain.eq).toHaveBeenCalledWith("intake_id", "intake-1")
    expect(chain.eq).toHaveBeenCalledWith("status", "ready")
    expect(chain.in).toHaveBeenCalledWith("report_tier", [
      "full_report",
      "strategy_call",
    ])
    expect(result?.id).toBe("paid-1")
  })

  it("returns null when no ready paid report", async () => {
    const { from } = mockSupabaseWithReports([])
    const result = await getLatestReadyPaidReportForIntake(
      { from } as unknown as Parameters<typeof getLatestReadyPaidReportForIntake>[0],
      "intake-1",
    )
    expect(result).toBeNull()
  })
})

describe("getLatestReadyPaidReportForUser", () => {
  it("queries by user_id with ready paid filters", async () => {
    const { from, chain } = mockSupabaseWithReports([
      { id: "paid-u", status: "ready", report_tier: "strategy_call", job_id: null },
    ])

    const result = await getLatestReadyPaidReportForUser(
      { from } as unknown as Parameters<typeof getLatestReadyPaidReportForUser>[0],
      "user-1",
    )

    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(chain.eq).toHaveBeenCalledWith("status", "ready")
    expect(chain.in).toHaveBeenCalledWith("report_tier", [
      "full_report",
      "strategy_call",
    ])
    expect(result?.id).toBe("paid-u")
  })
})
