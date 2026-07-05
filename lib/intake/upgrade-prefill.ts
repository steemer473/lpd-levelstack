import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"

const PLACEHOLDER_SENTINELS = new Set([
  "general business services",
  "not specified",
  "unknown",
  "not provided — discovered via research",
  "not provided",
  "free snapshot audit",
  "none",
])

function isPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true
  return PLACEHOLDER_SENTINELS.has(value.trim().toLowerCase())
}

/**
 * Clears free-snapshot placeholder values so paid upgrade intake forces real answers.
 * Keeps only genuinely user-entered fields (business name, website, city).
 */
export function sanitizeFreeSnapshotPrefill(
  prior: Partial<LevelstackIntakeFormValues> | null | undefined,
): LevelstackIntakeFormValues {
  if (!prior) return { ...levelstackIntakeDefaults }

  const businessName = prior.primaryBusinessName?.trim() ?? ""
  const website = prior.websiteUrl?.trim() ?? ""
  const city = prior.marketCity?.trim() ?? ""

  return {
    ...levelstackIntakeDefaults,
    primaryBusinessName: isPlaceholder(businessName) ? "" : businessName,
    websiteUrl: isPlaceholder(website) ? "" : website,
    marketCity: city,
    marketState: prior.marketState?.trim() && !isPlaceholder(prior.marketState)
      ? prior.marketState.trim()
      : "",
    geoMarket:
      city && (prior.geoMarket === "local" || prior.geoMarket === "regional")
        ? prior.geoMarket
        : city
          ? "local"
          : levelstackIntakeDefaults.geoMarket,
    ownerName: "",
    priorBusinessNames: ["None"],
    primaryService: "",
    pricePoint: "",
    hasActiveAdSpend: "no",
    adPlatforms: "",
    adBudget: "",
    socialProfiles: "",
    emailListSize: "",
    complaintsAwareness: "",
    reputationSelfAssessment: "",
    reputationScale: 5,
    purchaseMotivation: "",
  }
}
