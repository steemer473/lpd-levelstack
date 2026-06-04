import { env } from "@/env.mjs"

export type SerpOrganicResult = {
  query: string
  position: number
  title: string
  link: string
  snippet: string
}

export type SerpSearchResponse = {
  query: string
  results: SerpOrganicResult[]
  aiOverview: string | null
  limitation: string | null
}

function isSerpConfigured(): boolean {
  return Boolean(env.SERPAPI_KEY)
}

export async function googleOrganicSearch(query: string): Promise<SerpSearchResponse> {
  if (!isSerpConfigured()) {
    return {
      query,
      results: [],
      aiOverview: null,
      limitation: "SerpAPI is not configured (SERPAPI_KEY missing).",
    }
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: env.SERPAPI_KEY!,
    num: "10",
    gl: "us",
    hl: "en",
  })

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      return {
        query,
        results: [],
        aiOverview: null,
        limitation: `SerpAPI HTTP ${res.status} for "${query}".`,
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
        query,
        results: [],
        aiOverview: null,
        limitation: data.error,
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
        ?.map((b) => b.snippet)
        .filter(Boolean)
        .join(" ")
        .trim() || null

    return { query, results, aiOverview, limitation: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "SerpAPI request failed"
    return {
      query,
      results: [],
      aiOverview: null,
      limitation: message,
    }
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
  results: SerpOrganicResult[],
  hostname: string | null,
): SerpOrganicResult | null {
  if (!hostname) return null
  const host = hostname.toLowerCase()
  return (
    results.find((r) => r.link.toLowerCase().includes(host)) ?? null
  )
}

export function topCompetitorDomains(
  results: SerpOrganicResult[],
  excludeHost: string | null,
  limit = 3,
): string[] {
  const seen = new Set<string>()
  const domains: string[] = []

  for (const row of results) {
    try {
      const host = new URL(row.link).hostname.replace(/^www\./, "").toLowerCase()
      if (!host || host === excludeHost?.toLowerCase()) continue
      if (seen.has(host)) continue
      seen.add(host)
      domains.push(host)
      if (domains.length >= limit) break
    } catch {
      continue
    }
  }

  return domains
}
