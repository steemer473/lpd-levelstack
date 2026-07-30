import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { ReportTier } from "@/lib/levelstack-plans"

/** Values that must not drive a paid full-report pipeline. */
export const PAID_INTAKE_PLACEHOLDER_SENTINELS = new Set([
  "general business services",
  "not specified",
  "unknown",
  "not provided — discovered via research",
  "not provided",
  "free snapshot audit",
  "none",
])

export function isPaidIntakePlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true
  return PAID_INTAKE_PLACEHOLDER_SENTINELS.has(value.trim().toLowerCase())
}

function ownerNameLooksLikeBusiness(
  ownerName: string,
  businessName: string,
): boolean {
  const owner = ownerName.trim().toLowerCase()
  const business = businessName.trim().toLowerCase()
  if (!owner || !business) return false
  if (owner === business) return true
  return /\b(llc|inc|agency|digital|marketing|company|group|services)\b/i.test(
    owner,
  )
}

export type PaidIntakeGateResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Block paid-tier pipeline runs when intake still carries free-snapshot
 * placeholders or a missing owner name — prevents garbage-in reports.
 */
export function validatePaidIntakeForPipeline(
  intake: LevelstackIntakeFormValues,
  reportTier: ReportTier,
): PaidIntakeGateResult {
  if (reportTier === "free_snapshot") {
    return { ok: true }
  }

  if (isPaidIntakePlaceholder(intake.primaryService)) {
    return {
      ok: false,
      message:
        "Paid report blocked: primary service is still a placeholder. Complete paid intake before generating.",
    }
  }

  if (isPaidIntakePlaceholder(intake.pricePoint)) {
    return {
      ok: false,
      message:
        "Paid report blocked: price point is missing or placeholder. Complete paid intake before generating.",
    }
  }

  if (isPaidIntakePlaceholder(intake.ownerName)) {
    return {
      ok: false,
      message:
        "Paid report blocked: owner / personal brand name is required on paid intake.",
    }
  }

  if (
    ownerNameLooksLikeBusiness(
      intake.ownerName,
      intake.primaryBusinessName,
    )
  ) {
    return {
      ok: false,
      message:
        "Paid report blocked: owner name must be a person, not the business name.",
    }
  }

  if (!intake.businessVertical?.trim()) {
    return {
      ok: false,
      message:
        "Paid report blocked: business category is required on paid intake.",
    }
  }

  if (
    (intake.geoMarket === "local" || intake.geoMarket === "regional") &&
    isPaidIntakePlaceholder(intake.marketCity)
  ) {
    return {
      ok: false,
      message:
        "Paid report blocked: market city is required for local/regional businesses.",
    }
  }

  return { ok: true }
}
