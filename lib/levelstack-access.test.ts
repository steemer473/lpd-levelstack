import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import {
  getLevelStackPlanId,
  hasLevelStackAccess,
  hasReviewCallTier,
} from "@/lib/levelstack-access"
import { isLevelStackPlanId } from "@/lib/levelstack-plans"

function mockSupabase(
  orders: { id?: string; plan_id?: string }[] | null,
  error: Error | null = null,
) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: orders, error }),
  }

  return {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient
}

describe("levelstack-plans", () => {
  it("recognizes canonical plan IDs", () => {
    expect(isLevelStackPlanId("levelstack-standard")).toBe(true)
    expect(isLevelStackPlanId("levelstack-review-call")).toBe(true)
    expect(isLevelStackPlanId("workflow-starter")).toBe(false)
  })
})

describe("hasLevelStackAccess", () => {
  it("returns true when a completed LevelStack order exists", async () => {
    const supabase = mockSupabase([{ id: "order-1" }])
    await expect(hasLevelStackAccess(supabase, "user-1")).resolves.toBe(true)
  })

  it("returns false when no orders", async () => {
    const supabase = mockSupabase([])
    await expect(hasLevelStackAccess(supabase, "user-1")).resolves.toBe(false)
  })
})

describe("getLevelStackPlanId", () => {
  it("returns the latest plan_id", async () => {
    const supabase = mockSupabase([{ plan_id: "levelstack-review-call" }])
    await expect(getLevelStackPlanId(supabase, "user-1")).resolves.toBe(
      "levelstack-review-call",
    )
  })
})

describe("hasReviewCallTier", () => {
  it("is true only for review-call SKU", () => {
    expect(hasReviewCallTier("levelstack-review-call")).toBe(true)
    expect(hasReviewCallTier("levelstack-standard")).toBe(false)
    expect(hasReviewCallTier(null)).toBe(false)
  })
})
