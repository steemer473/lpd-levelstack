import { describe, expect, it, vi } from "vitest"

import { getLatestReportForIntake } from "@/lib/reports/get-latest-report-for-intake"

function mockSupabaseWithReports(reports: unknown[], error: { message: string } | null = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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
