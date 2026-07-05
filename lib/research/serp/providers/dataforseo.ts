import { env } from "@/env.mjs"
import { shouldFailoverMaps, shouldFailoverOrganic } from "@/lib/research/serp/quota-errors"
import type {
  MapsPlaceResult,
  ProviderMapsResult,
  ProviderOrganicResult,
  SerpOrganicResult,
} from "@/lib/research/serp/types"

const DATAFORSEO_BASE = "https://api.dataforseo.com/v3"

function dataForSeoAuthHeader(): string | null {
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) return null
  const credentials = Buffer.from(
    `${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`,
  ).toString("base64")
  return `Basic ${credentials}`
}

async function dataForSeoPost<T>(path: string, body: unknown): Promise<{ data: T; status: number }> {
  const auth = dataForSeoAuthHeader()
  if (!auth) {
    throw new Error("DataForSEO credentials missing")
  }

  const res = await fetch(`${DATAFORSEO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  const data = (await res.json()) as T
  return { data, status: res.status }
}

function dataForSeoErrorMessage(data: {
  status_code?: number
  status_message?: string
  tasks?: Array<{ status_message?: string; status_code?: number }>
}): string | null {
  const taskError = data.tasks?.find((task) => task.status_code && task.status_code >= 40000)
  if (taskError?.status_message) return taskError.status_message

  // Top-level status_message is "Ok." on success — only treat explicit API errors as failures.
  if (data.status_code && data.status_code >= 40000) {
    return data.status_message ?? "DataForSEO request failed."
  }

  return null
}

export async function dataForSeoOrganicSearch(query: string): Promise<ProviderOrganicResult> {
  const empty = {
    query,
    results: [] as SerpOrganicResult[],
    aiOverview: null,
    limitation: "DataForSEO is not configured (DATAFORSEO_LOGIN/PASSWORD missing).",
  }

  if (!dataForSeoAuthHeader()) {
    return { response: empty, shouldFailover: true }
  }

  try {
    const { data, status } = await dataForSeoPost<{
      status_message?: string
      tasks?: Array<{
        status_code?: number
        status_message?: string
        result?: Array<{
          items?: Array<{
            type?: string
            rank_absolute?: number
            title?: string
            url?: string
            description?: string
          }>
        }>
      }>
    }>("/serp/google/organic/live/advanced", [
      {
        keyword: query,
        location_code: 2840,
        language_code: "en",
        depth: 10,
      },
    ])

    const errorMsg = dataForSeoErrorMessage(data)
    if (errorMsg) {
      return {
        response: { query, results: [], aiOverview: null, limitation: errorMsg },
        httpStatus: status,
        shouldFailover: shouldFailoverOrganic(
          { results: [], limitation: errorMsg },
          status,
        ),
      }
    }

    const items = data.tasks?.[0]?.result?.[0]?.items ?? []
    const organicItems = items.filter(
      (item) => item.type === "organic" || (!item.type && item.url),
    )

    const results: SerpOrganicResult[] = organicItems.slice(0, 10).map((row, index) => ({
      query,
      position: row.rank_absolute ?? index + 1,
      title: row.title ?? "Untitled",
      link: row.url ?? "",
      snippet: row.description ?? "",
    }))

    return {
      response: { query, results, aiOverview: null, limitation: null },
      shouldFailover: false,
    }
  } catch (err) {
    const limitation = err instanceof Error ? err.message : "DataForSEO request failed"
    return {
      response: { query, results: [], aiOverview: null, limitation },
      shouldFailover: shouldFailoverOrganic({ results: [], limitation }),
    }
  }
}

export async function dataForSeoMapsSearch(query: string): Promise<ProviderMapsResult> {
  const empty: MapsPlaceResult = {
    title: null,
    rating: null,
    reviewCount: null,
    address: null,
    category: null,
    limitation: "DataForSEO not configured (DATAFORSEO_LOGIN/PASSWORD missing).",
  }

  if (!dataForSeoAuthHeader()) {
    return { place: empty, shouldFailover: true }
  }

  try {
    const { data, status } = await dataForSeoPost<{
      status_message?: string
      tasks?: Array<{
        status_code?: number
        status_message?: string
        result?: Array<{
          items?: Array<{
            type?: string
            title?: string
            rating?: { value?: number; votes_count?: number }
            address?: string
            category?: string
          }>
        }>
      }>
    }>("/serp/google/maps/live/advanced", [
      {
        keyword: query,
        location_code: 2840,
        language_code: "en",
        depth: 1,
      },
    ])

    const errorMsg = dataForSeoErrorMessage(data)
    if (errorMsg) {
      return {
        place: { ...empty, limitation: errorMsg },
        httpStatus: status,
        shouldFailover: shouldFailoverMaps(errorMsg, status),
      }
    }

    const items = data.tasks?.[0]?.result?.[0]?.items ?? []
    const placeItem = items.find(
      (item) =>
        item.type === "maps_search" ||
        item.type === "local_pack" ||
        Boolean(item.title),
    )

    if (!placeItem?.title) {
      const limitation = `No Google Maps listing found for "${query}".`
      return {
        place: { ...empty, limitation },
        shouldFailover: false,
      }
    }

    return {
      place: {
        title: placeItem.title ?? null,
        rating: placeItem.rating?.value ?? null,
        reviewCount: placeItem.rating?.votes_count ?? null,
        address: placeItem.address ?? null,
        category: placeItem.category ?? null,
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
