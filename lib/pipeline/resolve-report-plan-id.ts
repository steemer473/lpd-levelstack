import type { SupabaseClient } from "@supabase/supabase-js"

import { getLevelStackPlanId } from "@/lib/levelstack-access"
import { isAnyLevelStackPlanId } from "@/lib/levelstack-plans"

type ResolveReportPlanIdParams = {
  supabase: SupabaseClient
  userId: string
  reportPlanId: string | null
  jobMetadata: { plan_id?: string } | null | undefined
  purchaseMotivation: string
}

/**
 * Resolve which LevelStack plan a report should use.
 * Paid hub orders and free entitlements win over intake heuristics.
 * Defaults to free snapshot when no purchase is on record.
 */
export async function resolveReportPlanId({
  supabase,
  userId,
  reportPlanId,
  jobMetadata,
  purchaseMotivation,
}: ResolveReportPlanIdParams): Promise<string> {
  if (reportPlanId && isAnyLevelStackPlanId(reportPlanId)) {
    return reportPlanId
  }

  const metaPlanId = jobMetadata?.plan_id
  if (metaPlanId && isAnyLevelStackPlanId(metaPlanId)) {
    return metaPlanId
  }

  if (purchaseMotivation === "Free snapshot audit") {
    return "levelstack-free-snapshot"
  }

  try {
    const resolved = await getLevelStackPlanId(supabase, userId)
    if (resolved) return resolved
  } catch (err) {
    console.warn(
      "[pipeline] getLevelStackPlanId failed, defaulting to free snapshot:",
      err instanceof Error ? err.message : err,
    )
  }

  return "levelstack-free-snapshot"
}
