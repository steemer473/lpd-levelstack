import type { SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/env.mjs"
import { LEVELSTACK_PLAN_IDS } from "@/lib/levelstack-plans"

/**
 * True when the user has a completed LevelStack order in shared hub `orders` (§8.5).
 * Product app reads only — hub webhook is source of truth for payment.
 */
export async function hasLevelStackAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (
    process.env.NODE_ENV === "development" &&
    env.LEVELSTACK_DEV_BYPASS_ENTITLEMENT
  ) {
    return true
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("plan_id", [...LEVELSTACK_PLAN_IDS])
    .limit(1)

  if (error) {
    throw error
  }

  return Boolean(orders && orders.length > 0)
}

/**
 * Most recent completed LevelStack plan for the user, if any.
 */
export async function getLevelStackPlanId(
  supabase: SupabaseClient,
  userId: string,
): Promise<(typeof LEVELSTACK_PLAN_IDS)[number] | null> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("plan_id", [...LEVELSTACK_PLAN_IDS])
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  const planId = orders?.[0]?.plan_id
  if (!planId || !(LEVELSTACK_PLAN_IDS as readonly string[]).includes(planId)) {
    return null
  }

  return planId as (typeof LEVELSTACK_PLAN_IDS)[number]
}

export function hasReviewCallTier(
  planId: (typeof LEVELSTACK_PLAN_IDS)[number] | null,
): boolean {
  return planId === "levelstack-review-call"
}
