/** PRD v2 plan IDs — must match hub `data/levelstackPlans.ts` after migration. */
export const LEVELSTACK_PLAN_IDS = [
  "levelstack-free-snapshot",
  "levelstack-full-report",
  "levelstack-strategy-call",
] as const

/** Legacy SKUs — honored for existing buyers until hub migration completes. */
export const LEGACY_LEVELSTACK_PLAN_IDS = [
  "levelstack-standard",
  "levelstack-review-call",
] as const

export const ALL_LEVELSTACK_PLAN_IDS = [
  ...LEVELSTACK_PLAN_IDS,
  ...LEGACY_LEVELSTACK_PLAN_IDS,
] as const

export type LevelStackPlanId = (typeof LEVELSTACK_PLAN_IDS)[number]
export type LegacyLevelStackPlanId = (typeof LEGACY_LEVELSTACK_PLAN_IDS)[number]
export type AnyLevelStackPlanId = (typeof ALL_LEVELSTACK_PLAN_IDS)[number]

export type ReportTier = "free_snapshot" | "full_report" | "strategy_call"

export function isLevelStackPlanId(
  planId: string | null | undefined,
): planId is LevelStackPlanId {
  if (!planId) return false
  return (LEVELSTACK_PLAN_IDS as readonly string[]).includes(planId)
}

export function isAnyLevelStackPlanId(
  planId: string | null | undefined,
): planId is AnyLevelStackPlanId {
  if (!planId) return false
  return (ALL_LEVELSTACK_PLAN_IDS as readonly string[]).includes(planId)
}

export function planIdToReportTier(planId: string | null | undefined): ReportTier {
  switch (planId) {
    case "levelstack-free-snapshot":
      return "free_snapshot"
    case "levelstack-full-report":
    case "levelstack-standard":
      return "full_report"
    case "levelstack-strategy-call":
    case "levelstack-review-call":
      return "strategy_call"
    default:
      return "free_snapshot"
  }
}

export function canViewFullReport(tier: ReportTier): boolean {
  return tier === "full_report" || tier === "strategy_call"
}

export function hasStrategyCallTier(
  planId: string | null | undefined,
): boolean {
  return (
    planId === "levelstack-strategy-call" || planId === "levelstack-review-call"
  )
}

export function isPaidPlan(planId: string | null | undefined): boolean {
  if (!planId) return false
  return (
    planId === "levelstack-full-report" ||
    planId === "levelstack-strategy-call" ||
    planId === "levelstack-standard" ||
    planId === "levelstack-review-call"
  )
}
