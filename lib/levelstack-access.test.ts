import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import {
  getLevelStackPlanId,
  hasLevelStackAccess,
  hasFreeSnapshotEntitlement,
} from "@/lib/levelstack-access"
import {
  canViewFullReport,
  hasStrategyCallTier,
  isAnyLevelStackPlanId,
  isLevelStackPlanId,
  planIdToReportTier,
} from "@/lib/levelstack-plans"

function mockSupabase(
  orders: { id?: string; plan_id?: string }[] | null,
  error: Error | null = null,
  freeEntitlement = false,
) {
  const ordersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: orders, error }),
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

describe("levelstack-plans", () => {
  it("recognizes PRD v2 and legacy plan IDs", () => {
    expect(isLevelStackPlanId("levelstack-full-report")).toBe(true)
    expect(isLevelStackPlanId("levelstack-free-snapshot")).toBe(true)
    expect(isAnyLevelStackPlanId("levelstack-standard")).toBe(true)
    expect(isLevelStackPlanId("workflow-starter")).toBe(false)
  })

  it("maps plan IDs to report tiers", () => {
    expect(planIdToReportTier("levelstack-free-snapshot")).toBe("free_snapshot")
    expect(planIdToReportTier("levelstack-full-report")).toBe("full_report")
    expect(planIdToReportTier("levelstack-strategy-call")).toBe("strategy_call")
    expect(planIdToReportTier("levelstack-standard")).toBe("full_report")
  })

  it("gates full report by tier", () => {
    expect(canViewFullReport("free_snapshot")).toBe(false)
    expect(canViewFullReport("full_report")).toBe(true)
  })
})

describe("hasLevelStackAccess", () => {
  it("returns true when a completed LevelStack order exists", async () => {
    const supabase = mockSupabase([{ id: "order-1" }])
    await expect(hasLevelStackAccess(supabase, "user-1")).resolves.toBe(true)
  })

  it("returns true with free entitlement", async () => {
    const supabase = mockSupabase([], null, true)
    await expect(hasLevelStackAccess(supabase, "user-1")).resolves.toBe(true)
  })

  it("returns false when no orders or free entitlement", async () => {
    const supabase = mockSupabase([])
    await expect(hasLevelStackAccess(supabase, "user-1")).resolves.toBe(false)
  })
})

describe("getLevelStackPlanId", () => {
  it("returns the latest plan_id", async () => {
    const supabase = mockSupabase([{ plan_id: "levelstack-full-report" }])
    await expect(getLevelStackPlanId(supabase, "user-1")).resolves.toBe(
      "levelstack-full-report",
    )
  })

  it("returns free snapshot when only free entitlement", async () => {
    const supabase = mockSupabase([], null, true)
    await expect(getLevelStackPlanId(supabase, "user-1")).resolves.toBe(
      "levelstack-free-snapshot",
    )
  })
})

describe("hasStrategyCallTier", () => {
  it("is true only for strategy call SKUs", () => {
    expect(hasStrategyCallTier("levelstack-strategy-call")).toBe(true)
    expect(hasStrategyCallTier("levelstack-review-call")).toBe(true)
    expect(hasStrategyCallTier("levelstack-full-report")).toBe(false)
    expect(hasStrategyCallTier(null)).toBe(false)
  })
})

describe("hasFreeSnapshotEntitlement", () => {
  it("detects free entitlement row", async () => {
    const supabase = mockSupabase([], null, true)
    await expect(hasFreeSnapshotEntitlement(supabase, "user-1")).resolves.toBe(true)
  })
})
