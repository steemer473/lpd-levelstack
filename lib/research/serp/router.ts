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
import { isRetryableProviderError } from "@/lib/research/serp/quota-errors"
import { UNABLE_TO_VERIFY_VALUE } from "@/lib/report/customer-copy"
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
    let result = await callOrganicProvider(provider, query)

    // P0-1: one same-provider retry on transient non-quota errors before fallback.
    if (
      !result.shouldFailover &&
      result.response.limitation &&
      isRetryableProviderError(result.response.limitation, result.httpStatus)
    ) {
      console.log(`[serp] provider=${provider} retryable error, retrying once`)
      result = await callOrganicProvider(provider, query)
    }

    if (!result.shouldFailover) {
      const response =
        result.response.limitation &&
        isRetryableProviderError(result.response.limitation, result.httpStatus)
          ? {
              ...result.response,
              limitation: UNABLE_TO_VERIFY_VALUE,
            }
          : result.response
      await setCachedSerp("google", query, response, provider)
      return response
    }

    console.log(`[serp] provider=${provider} quota exceeded, trying next`)
    if (result.response.limitation) limitations.push(result.response.limitation)
  }

  return {
    query,
    results: [],
    aiOverview: null,
    // Keep raw limitations out of customer paths; section builders sanitize further.
    limitation: UNABLE_TO_VERIFY_VALUE,
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
    let result = await callMapsProvider(provider, query)

    if (
      !result.shouldFailover &&
      result.place.limitation &&
      isRetryableProviderError(result.place.limitation, result.httpStatus)
    ) {
      console.log(`[serp] provider=${provider} maps retryable error, retrying once`)
      result = await callMapsProvider(provider, query)
    }

    if (!result.shouldFailover) {
      const place =
        result.place.limitation &&
        isRetryableProviderError(result.place.limitation, result.httpStatus)
          ? { ...result.place, limitation: UNABLE_TO_VERIFY_VALUE }
          : result.place
      await setCachedSerp("google_maps", query, place, provider)
      return place
    }

    console.log(`[serp] provider=${provider} quota exceeded, trying next`)
    if (result.place.limitation) limitations.push(result.place.limitation)
  }

  return {
    ...empty,
    limitation: UNABLE_TO_VERIFY_VALUE,
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
