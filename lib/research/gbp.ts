import { env } from "@/env.mjs"

export type GbpSignals = {
  found: boolean
  title: string | null
  rating: number | null
  reviewCount: number | null
  address: string | null
  category: string | null
  limitation: string | null
}

type MapsPlace = {
  title?: string
  rating?: number
  reviews?: number
  reviews_original?: string
  address?: string
  type?: string
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

  if (!env.SERPAPI_KEY) {
    return { ...empty, limitation: "SerpAPI not configured (SERPAPI_KEY missing)." }
  }

  const q = `${businessName.trim()} ${geoHint}`.trim()
  const params = new URLSearchParams({
    engine: "google_maps",
    q,
    api_key: env.SERPAPI_KEY,
    hl: "en",
  })

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      return { ...empty, limitation: `Google Maps search HTTP ${res.status}.` }
    }

    const data = (await res.json()) as {
      local_results?: MapsPlace[]
      place_results?: MapsPlace
      error?: string
    }

    if (data.error) {
      return { ...empty, limitation: data.error }
    }

    const place = data.place_results ?? data.local_results?.[0]
    if (!place?.title) {
      return {
        ...empty,
        limitation: `No Google Maps listing found for "${q}".`,
      }
    }

    const reviewCount =
      typeof place.reviews === "number"
        ? place.reviews
        : parseReviewCountFromText(place.reviews_original)

    return {
      found: true,
      title: place.title,
      rating: typeof place.rating === "number" ? place.rating : null,
      reviewCount,
      address: place.address ?? null,
      category: place.type ?? null,
      limitation: null,
    }
  } catch (err) {
    return {
      ...empty,
      limitation: err instanceof Error ? err.message : "Google Maps lookup failed.",
    }
  }
}

function parseReviewCountFromText(text: string | undefined): number | null {
  if (!text) return null
  const m = text.replace(/,/g, "").match(/(\d+)\s*review/i)
  return m?.[1] ? Number.parseInt(m[1], 10) : null
}

export function gbpGeoHint(geoMarket: "local" | "regional" | "national"): string {
  if (geoMarket === "local") return "near me"
  if (geoMarket === "regional") return "services"
  return ""
}
