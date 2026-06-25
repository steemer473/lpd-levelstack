import {
  getConfiguredProviderChain,
  isAnySerpProviderConfigured,
  isDevMockSerpEnabled,
} from "@/lib/research/serp/config"
import { getCachedSerp, setCachedSerp } from "@/lib/research/serp/cache"
import {
  dataForSeoMapsSearch,
  dataForSeoOrganicSearch,
} from "@/lib/research/serp/providers/dataforseo"
import { mockMapsSearch, mockOrganicSearch } from "@/lib/research/serp/providers/mock"
import {
  searchApiMapsSearch,
  searchApiOrganicSearch,
} from "@/lib/research/serp/providers/searchapi"
import {
  serpApiMapsSearch,
  serpApiOrganicSearch,
} from "@/lib/research/serp/providers/serpapi"
import type {
  MapsPlaceResult,
  ProviderMapsResult,
  ProviderOrganicResult,
  SerpProviderId,
  SerpSearchResponse,
} from "@/lib/research/serp/types"

async function callOrganicProvider(
  provider: SerpProviderId,
  query: string,
): Promise<ProviderOrganicResult> {
  switch (provider) {
    case "serpapi":
      return serpApiOrganicSearch(query)
    case "searchapi":
      return searchApiOrganicSearch(query)
    case "dataforseo":
      return dataForSeoOrganicSearch(query)
    case "mock":
      return mockOrganicSearch(query)
    default:
      return {
        response: {
          query,
          results: [],
          aiOverview: null,
          limitation: `Unknown SERP provider: ${provider}`,
        },
        shouldFailover: true,
      }
  }
}

async function callMapsProvider(
  provider: SerpProviderId,
  query: string,
): Promise<ProviderMapsResult> {
  switch (provider) {
    case "serpapi":
      return serpApiMapsSearch(query)
    case "searchapi":
      return searchApiMapsSearch(query)
    case "dataforseo":
      return dataForSeoMapsSearch(query)
    case "mock":
      return mockMapsSearch(query)
    default:
      return {
        place: {
          title: null,
          rating: null,
          reviewCount: null,
          address: null,
          category: null,
          limitation: `Unknown SERP provider: ${provider}`,
        },
        shouldFailover: true,
      }
  }
}

export async function googleOrganicSearch(query: string): Promise<SerpSearchResponse> {
  const cached = await getCachedSerp<SerpSearchResponse>("google", query)
  if (cached) return cached.response

  if (isDevMockSerpEnabled()) {
    const mock = await mockOrganicSearch(query)
    await setCachedSerp("google", query, mock.response, "mock")
    return mock.response
  }

  const chain = getConfiguredProviderChain()
  if (chain.length === 0) {
    return {
      query,
      results: [],
      aiOverview: null,
      limitation: isAnySerpProviderConfigured()
        ? "No SERP providers available in provider chain."
        : "No SERP provider configured.",
    }
  }

  const limitations: string[] = []

  for (const provider of chain) {
    const result = await callOrganicProvider(provider, query)
    if (!result.shouldFailover) {
      await setCachedSerp("google", query, result.response, provider)
      return result.response
    }

    console.log(`[serp] provider=${provider} quota exceeded, trying next`)
    if (result.response.limitation) limitations.push(result.response.limitation)
  }

  return {
    query,
    results: [],
    aiOverview: null,
    limitation: limitations.join("; ") || "All SERP providers failed.",
  }
}

export async function googleMapsSearch(query: string): Promise<MapsPlaceResult> {
  const cached = await getCachedSerp<MapsPlaceResult>("google_maps", query)
  if (cached) return cached.response

  if (isDevMockSerpEnabled()) {
    const mock = await mockMapsSearch(query)
    await setCachedSerp("google_maps", query, mock.place, "mock")
    return mock.place
  }

  const chain = getConfiguredProviderChain()
  const empty: MapsPlaceResult = {
    title: null,
    rating: null,
    reviewCount: null,
    address: null,
    category: null,
    limitation: chain.length
      ? null
      : isAnySerpProviderConfigured()
        ? "No SERP providers available in provider chain."
        : "No SERP provider configured.",
  }

  if (chain.length === 0) return empty

  const limitations: string[] = []

  for (const provider of chain) {
    const result = await callMapsProvider(provider, query)
    if (!result.shouldFailover) {
      await setCachedSerp("google_maps", query, result.place, provider)
      return result.place
    }

    console.log(`[serp] provider=${provider} quota exceeded, trying next`)
    if (result.place.limitation) limitations.push(result.place.limitation)
  }

  return {
    ...empty,
    limitation: limitations.join("; ") || "All SERP providers failed.",
  }
}

const SERP_CONCURRENCY = 3
const SERP_BATCH_GAP_MS = 150

export async function runSerpQueries(queries: string[]): Promise<SerpSearchResponse[]> {
  const unique = [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
  const out: SerpSearchResponse[] = []

  for (let i = 0; i < unique.length; i += SERP_CONCURRENCY) {
    const batch = unique.slice(i, i + SERP_CONCURRENCY)
    const results = await Promise.all(batch.map((q) => googleOrganicSearch(q)))
    out.push(...results)
    if (i + SERP_CONCURRENCY < unique.length) {
      await new Promise((r) => setTimeout(r, SERP_BATCH_GAP_MS))
    }
  }

  return out
}

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

export function resultsMentionDomain(
  results: import("@/lib/research/serp/types").SerpOrganicResult[],
  hostname: string | null,
): import("@/lib/research/serp/types").SerpOrganicResult | null {
  if (!hostname) return null
  const host = hostname.toLowerCase()
  return results.find((r) => r.link.toLowerCase().includes(host)) ?? null
}

export type {
  SerpOrganicResult,
  SerpSearchResponse,
} from "@/lib/research/serp/types"
