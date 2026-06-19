import { googleMapsSearch } from "@/lib/research/serp/router"

export type GbpSignals = {
  found: boolean
  title: string | null
  rating: number | null
  reviewCount: number | null
  address: string | null
  category: string | null
  limitation: string | null
}

export async function fetchGbpSignals(
  businessName: string,
  geoHint: string,
): Promise<GbpSignals> {
  const empty: GbpSignals = {
    found: false,
    title: null,
    rating: null,
    reviewCount: null,
    address: null,
    category: null,
    limitation: null,
  }

  const q = `${businessName.trim()} ${geoHint}`.trim()
  const place = await googleMapsSearch(q)

  if (place.limitation && !place.title) {
    return { ...empty, limitation: place.limitation }
  }

  if (!place.title) {
    return {
      ...empty,
      limitation: place.limitation ?? `No Google Maps listing found for "${q}".`,
    }
  }

  return {
    found: true,
    title: place.title,
    rating: place.rating,
    reviewCount: place.reviewCount,
    address: place.address,
    category: place.category,
    limitation: place.limitation,
  }
}

export function gbpGeoHint(geoMarket: "local" | "regional" | "national"): string {
  if (geoMarket === "local") return "near me"
  if (geoMarket === "regional") return "services"
  return ""
}
