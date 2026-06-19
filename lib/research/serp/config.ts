import { env } from "@/env.mjs"
import type { SerpProviderId } from "@/lib/research/serp/types"

const DEFAULT_CHAIN: SerpProviderId[] = ["serpapi", "searchapi", "dataforseo"]

export function isDevMockSerpEnabled(): boolean {
  return env.LEVELSTACK_DEV_MOCK_SERP === true
}

export function getSerpCacheTtlHours(): number {
  return env.SERP_CACHE_TTL_HOURS ?? 24
}

export function isSerpProviderConfigured(id: SerpProviderId): boolean {
  switch (id) {
    case "serpapi":
      return Boolean(env.SERPAPI_KEY)
    case "searchapi":
      return Boolean(env.SEARCHAPI_KEY)
    case "dataforseo":
      return Boolean(env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD)
    case "mock":
      return isDevMockSerpEnabled()
    default:
      return false
  }
}

export function isAnySerpProviderConfigured(): boolean {
  return (
    isSerpProviderConfigured("serpapi") ||
    isSerpProviderConfigured("searchapi") ||
    isSerpProviderConfigured("dataforseo")
  )
}

export function getConfiguredProviderChain(): SerpProviderId[] {
  const raw = env.SERP_PROVIDER_CHAIN?.trim()
  const parsed = raw
    ? raw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry): entry is SerpProviderId =>
          ["serpapi", "searchapi", "dataforseo"].includes(entry),
        )
    : DEFAULT_CHAIN

  return parsed.filter(isSerpProviderConfigured)
}
