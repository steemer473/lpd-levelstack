import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import { resolveReportPlanId } from "@/lib/pipeline/resolve-report-plan-id"

function mockSupabase(
  orders: { plan_id?: string }[] | null,
  freeEntitlement = false,
) {
  const ordersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: orders, error: null }),
  }

  const freeChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: freeEntitlement ? { user_id: "user-1" } : null,
      error: null,
    }),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === "levelstack_free_entitlements") return freeChain
      return ordersChain
    }),
  } as unknown as SupabaseClient
}

describe("resolveReportPlanId", () => {
  it("keeps an existing valid plan_id on the report row", async () => {
    const supabase = mockSupabase([{ plan_id: "levelstack-full-report" }])
    await expect(
      resolveReportPlanId({
        supabase,
        userId: "user-1",
        reportPlanId: "levelstack-full-report",
        jobMetadata: null,
        purchaseMotivation: "want leads",
      }),
    ).resolves.toBe("levelstack-full-report")
  })

  it("defaults to free snapshot when no order, entitlement, or stored plan", async () => {
    const supabase = mockSupabase([])
    await expect(
      resolveReportPlanId({
        supabase,
        userId: "user-1",
        reportPlanId: null,
        jobMetadata: null,
        purchaseMotivation: "want to know how I look online",
      }),
    ).resolves.toBe("levelstack-free-snapshot")
  })

  it("uses hub order when report plan_id was cleared", async () => {
    const supabase = mockSupabase([{ plan_id: "levelstack-full-report" }])
    await expect(
      resolveReportPlanId({
        supabase,
        userId: "user-1",
        reportPlanId: null,
        jobMetadata: null,
        purchaseMotivation: "grow leads",
      }),
    ).resolves.toBe("levelstack-full-report")
  })

  it("uses free snapshot for free intake motivation", async () => {
    const supabase = mockSupabase([])
    await expect(
      resolveReportPlanId({
        supabase,
        userId: "user-1",
        reportPlanId: null,
        jobMetadata: null,
        purchaseMotivation: "Free snapshot audit",
      }),
    ).resolves.toBe("levelstack-free-snapshot")
  })
})
