import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"

/** City + optional state/province for disambiguating common business names. */
export function marketLocationLabel(intake: LevelstackIntakeFormValues): string | null {
  const city = intake.marketCity?.trim()
  if (!city) return null
  const state = intake.marketState?.trim()
  return state ? `${city}, ${state}` : city
}

export function hasMarketLocation(intake: LevelstackIntakeFormValues): boolean {
  return Boolean(intake.marketCity?.trim())
}

/** Append location to a search phrase when we know the buyer's market. */
export function scopedSearchPhrase(
  phrase: string,
  intake: LevelstackIntakeFormValues,
): string {
  const location = marketLocationLabel(intake)
  if (!location) return phrase.trim()
  const base = phrase.trim()
  if (base.toLowerCase().includes(location.toLowerCase())) return base
  return `${base} ${location}`
}

export function businessNameForSearch(intake: LevelstackIntakeFormValues): string {
  return scopedSearchPhrase(intake.primaryBusinessName, intake)
}

export function mapsLocationHint(intake: LevelstackIntakeFormValues): string {
  const location = marketLocationLabel(intake)
  if (location) return location
  if (intake.geoMarket === "local") return "near me"
  if (intake.geoMarket === "regional") return "services"
  return ""
}
