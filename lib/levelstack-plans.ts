/** Canonical LevelStack plan IDs — must match hub `data/levelstackPlans.ts` (§0.4). */
export const LEVELSTACK_PLAN_IDS = [
  "levelstack-standard",
  "levelstack-review-call",
] as const

export type LevelStackPlanId = (typeof LEVELSTACK_PLAN_IDS)[number]

export function isLevelStackPlanId(
  planId: string | null | undefined,
): planId is LevelStackPlanId {
  if (!planId) return false
  return (LEVELSTACK_PLAN_IDS as readonly string[]).includes(planId)
}
