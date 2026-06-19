import { env } from "@/env.mjs"
import { shouldFailoverMaps, shouldFailoverOrganic } from "@/lib/research/serp/quota-errors"
import type {
  MapsPlaceResult,
  ProviderMapsResult,
  ProviderOrganicResult,
  SerpOrganicResult,
} from "@/lib/research/serp/types"

type SerpApiMapsPlace = {
  title?: string
  rating?: number
  reviews?: number
  reviews_original?: string
  address?: string
  type?: string
}

function parseReviewCountFromText(text: string | undefined): number | null {
  if (!text) return null
  const match = text.replace(/,/g, "").match(/(\d+)\s*review/i)
  return match?.[1] ? Number.parseInt(match[1], 10) : null
}

export async function serpApiOrganicSearch(query: string): Promise<ProviderOrganicResult> {
  const empty = {
    query,
    results: [] as SerpOrganicResult[],
    aiOverview: null,
    limitation: "SerpAPI is not configured (SERPAPI_KEY missing).",
  }

  if (!env.SERPAPI_KEY) {
    return { response: empty, shouldFailover: true }
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: env.SERPAPI_KEY,
    num: "10",
    gl: "us",
    hl: "en",
  })

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const limitation = `SerpAPI HTTP ${res.status} for "${query}".`
      return {
        response: { query, results: [], aiOverview: null, limitation },
        httpStatus: res.status,
        shouldFailover: shouldFailoverOrganic({ results: [], limitation }, res.status),
      }
    }

    const data = (await res.json()) as {
      organic_results?: Array<{
        position?: number
        title?: string
        link?: string
        snippet?: string
      }>
      ai_overview?: { text_blocks?: Array<{ snippet?: string }> }
      error?: string
    }

    if (data.error) {
      return {
        response: { query, results: [], aiOverview: null, limitation: data.error },
        shouldFailover: shouldFailoverOrganic(
          { results: [], limitation: data.error },
          res.status,
        ),
      }
    }

    const results: SerpOrganicResult[] = (data.organic_results ?? [])
      .slice(0, 10)
      .map((row, index) => ({
        query,
        position: row.position ?? index + 1,
        title: row.title ?? "Untitled",
        link: row.link ?? "",
        snippet: row.snippet ?? "",
      }))

    const aiOverview =
      data.ai_overview?.text_blocks
        ?.map((block) => block.snippet)
        .filter(Boolean)
        .join(" ")
        .trim() || null

    return {
      response: { query, results, aiOverview, limitation: null },
      shouldFailover: false,
    }
  } catch (err) {
    const limitation = err instanceof Error ? err.message : "SerpAPI request failed"
    return {
      response: { query, results: [], aiOverview: null, limitation },
      shouldFailover: shouldFailoverOrganic({ results: [], limitation }),
    }
  }
}

export async function serpApiMapsSearch(query: string): Promise<ProviderMapsResult> {
  const empty: MapsPlaceResult = {
    title: null,
    rating: null,
    reviewCount: null,
    address: null,
    category: null,
    limitation: "SerpAPI not configured (SERPAPI_KEY missing).",
  }

  if (!env.SERPAPI_KEY) {
    return { place: empty, shouldFailover: true }
  }

  const params = new URLSearchParams({
    engine: "google_maps",
    q: query,
    api_key: env.SERPAPI_KEY,
    hl: "en",
  })

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const limitation = `Google Maps search HTTP ${res.status}.`
      return {
        place: { ...empty, limitation },
        httpStatus: res.status,
        shouldFailover: shouldFailoverMaps(limitation, res.status),
      }
    }

    const data = (await res.json()) as {
      local_results?: SerpApiMapsPlace[]
      place_results?: SerpApiMapsPlace
      error?: string
    }

    if (data.error) {
      return {
        place: { ...empty, limitation: data.error },
        shouldFailover: shouldFailoverMaps(data.error, res.status),
      }
    }

    const place = data.place_results ?? data.local_results?.[0]
    if (!place?.title) {
      const limitation = `No Google Maps listing found for "${query}".`
      return {
        place: { ...empty, limitation },
        shouldFailover: false,
      }
    }

    const reviewCount =
      typeof place.reviews === "number"
        ? place.reviews
        : parseReviewCountFromText(place.reviews_original)

    return {
      place: {
        title: place.title,
        rating: typeof place.rating === "number" ? place.rating : null,
        reviewCount,
        address: place.address ?? null,
        category: place.type ?? null,
        limitation: null,
      },
      shouldFailover: false,
    }
  } catch (err) {
    const limitation = err instanceof Error ? err.message : "Google Maps lookup failed."
    return {
      place: { ...empty, limitation },
      shouldFailover: shouldFailoverMaps(limitation),
    }
  }
}
