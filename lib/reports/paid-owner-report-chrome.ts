import type { NavVariant } from "@/lib/nav-variant"

/**
 * Paid entitlement chrome on a free_snapshot report row.
 * Ready paid Action Roadmap → suppress buy CTAs; no ready paid → genuine upgrade intake.
 */
export function resolvePaidOwnerFreeChrome(input: {
  paidAccess: boolean
  reportTier: string | null | undefined
  status: string
  readyPaidReportId?: string | null
}): {
  paidOwnerFree: boolean
  paidPendingIntake: boolean
} {
  const isReadyFree =
    input.paidAccess &&
    input.reportTier === "free_snapshot" &&
    input.status === "ready"

  if (!isReadyFree) {
    return { paidOwnerFree: false, paidPendingIntake: false }
  }

  const hasReadyPaid = Boolean(input.readyPaidReportId)
  return {
    paidOwnerFree: hasReadyPaid,
    paidPendingIntake: !hasReadyPaid,
  }
}

export function resolveReportNavVariant(
  paidPendingIntake: boolean,
  paidOwnerFree: boolean,
  reportTier: string | undefined,
): NavVariant {
  if (paidPendingIntake) return "paidPendingIntake"
  if (paidOwnerFree) return "paidOwnerFree"
  if (reportTier === "free_snapshot") return "freeReport"
  return "default"
}

/** Purchase CTA copy that must not appear for paid owners viewing a free snapshot. */
export const LEVELSTACK_UNLOCK_97_CTA = "Unlock Action Roadmap — $97"
