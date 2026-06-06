import type { SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/env.mjs"
import {
  ALL_LEVELSTACK_PLAN_IDS,
  canViewFullReport,
  isPaidPlan,
  planIdToReportTier,
  type ReportTier,
} from "@/lib/levelstack-plans"

export type { ReportTier }

/**
 * True when the user has free snapshot entitlement or a completed LevelStack order.
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

  const free = await hasFreeSnapshotEntitlement(supabase, userId)
  if (free) return true

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("plan_id", [...ALL_LEVELSTACK_PLAN_IDS])
    .limit(1)

  if (error) {
    throw error
  }

  return Boolean(orders && orders.length > 0)
}

export async function hasFreeSnapshotEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("levelstack_free_entitlements")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01") return false
    throw error
  }

  return Boolean(data)
}

/**
 * Most recent completed LevelStack plan for the user, if any.
 */
export async function getLevelStackPlanId(
  supabase: SupabaseClient,
  userId: string,
): Promise<(typeof ALL_LEVELSTACK_PLAN_IDS)[number] | null> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("plan_id", [...ALL_LEVELSTACK_PLAN_IDS])
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  const planId = orders?.[0]?.plan_id
  if (!planId || !(ALL_LEVELSTACK_PLAN_IDS as readonly string[]).includes(planId)) {
    const hasFree = await hasFreeSnapshotEntitlement(supabase, userId)
    return hasFree ? "levelstack-free-snapshot" : null
  }

  return planId as (typeof ALL_LEVELSTACK_PLAN_IDS)[number]
}

export async function getReportTierForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReportTier> {
  const planId = await getLevelStackPlanId(supabase, userId)
  return planIdToReportTier(planId)
}

export { canViewFullReport, isPaidPlan, planIdToReportTier }

export function hasReviewCallTier(planId: string | null | undefined): boolean {
  return (
    planId === "levelstack-strategy-call" || planId === "levelstack-review-call"
  )
}

export async function requirePaidIntakeAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const planId = await getLevelStackPlanId(supabase, userId)
  return isPaidPlan(planId)
}
