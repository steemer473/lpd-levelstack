import { beforeEach, describe, expect, it, vi } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  brandNameSearchQueries,
  directoryReviewQueries,
} from "@/lib/pipeline/research-queries"

vi.mock("@/lib/research/serp/cache", () => ({
  getCachedSerp: vi.fn().mockResolvedValue(null),
  setCachedSerp: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/env.mjs", () => ({
  env: {
    SERPAPI_KEY: "test-serp",
    SEARCHAPI_KEY: undefined,
    DATAFORSEO_LOGIN: undefined,
    DATAFORSEO_PASSWORD: undefined,
    SERP_PROVIDER_CHAIN: "serpapi,searchapi,dataforseo",
    SERP_CACHE_TTL_HOURS: 24,
    LEVELSTACK_DEV_MOCK_SERP: false,
  },
}))

describe("googleOrganicSearch failover", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("retries once on Internal SE Server Error then returns unable-to-verify", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ error: "Internal SE Server Error." }), {
        status: 200,
      })
    })

    vi.stubGlobal("fetch", fetchMock)

    vi.doMock("@/lib/research/serp/cache", () => ({
      getCachedSerp: vi.fn().mockResolvedValue(null),
      setCachedSerp: vi.fn().mockResolvedValue(undefined),
    }))

    vi.doMock("@/env.mjs", () => ({
      env: {
        SERPAPI_KEY: "serp-key",
        SEARCHAPI_KEY: undefined,
        DATAFORSEO_LOGIN: undefined,
        DATAFORSEO_PASSWORD: undefined,
        SERP_PROVIDER_CHAIN: "serpapi",
        SERP_CACHE_TTL_HOURS: 24,
        LEVELSTACK_DEV_MOCK_SERP: false,
      },
    }))

    const { googleOrganicSearch } = await import("@/lib/research/serp/router")
    const { UNABLE_TO_VERIFY_VALUE } = await import("@/lib/report/customer-copy")
    const result = await googleOrganicSearch("Acme reviews")

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.results).toHaveLength(0)
    expect(result.limitation).toBe(UNABLE_TO_VERIFY_VALUE)
    expect(result.limitation).not.toContain("Internal SE Server Error")
  })

  it("falls back from SerpAPI quota error to SearchAPI success", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("serpapi.com")) {
        return new Response(
          JSON.stringify({ error: "Your account has run out of searches" }),
          { status: 200 },
        )
      }
      if (url.includes("searchapi.io")) {
        return new Response(
          JSON.stringify({
            organic_results: [
              {
                position: 1,
                title: "Fallback Result",
                link: "https://example.com",
                snippet: "From SearchAPI",
              },
            ],
          }),
          { status: 200 },
        )
      }
      return new Response("not found", { status: 404 })
    })

    vi.stubGlobal("fetch", fetchMock)

    vi.doMock("@/env.mjs", () => ({
      env: {
        SERPAPI_KEY: "serp-key",
        SEARCHAPI_KEY: "search-key",
        DATAFORSEO_LOGIN: undefined,
        DATAFORSEO_PASSWORD: undefined,
        SERP_PROVIDER_CHAIN: "serpapi,searchapi,dataforseo",
        SERP_CACHE_TTL_HOURS: 24,
        LEVELSTACK_DEV_MOCK_SERP: false,
      },
    }))

    const { googleOrganicSearch } = await import("@/lib/research/serp/router")
    const result = await googleOrganicSearch("test query")

    expect(result.results).toHaveLength(1)
    expect(result.results[0]?.title).toBe("Fallback Result")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe("googleOrganicSearch cache", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("returns cached response without calling providers", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    vi.doMock("@/lib/research/serp/cache", () => ({
      getCachedSerp: vi.fn().mockResolvedValue({
        response: {
          query: "cached query",
          results: [
            {
              query: "cached query",
              position: 1,
              title: "Cached",
              link: "https://cached.example",
              snippet: "From cache",
            },
          ],
          aiOverview: null,
          limitation: null,
        },
        provider: "serpapi",
      }),
      setCachedSerp: vi.fn(),
    }))

    vi.doMock("@/env.mjs", () => ({
      env: {
        SERPAPI_KEY: "serp-key",
        SEARCHAPI_KEY: undefined,
        DATAFORSEO_LOGIN: undefined,
        DATAFORSEO_PASSWORD: undefined,
        SERP_PROVIDER_CHAIN: "serpapi",
        SERP_CACHE_TTL_HOURS: 24,
        LEVELSTACK_DEV_MOCK_SERP: false,
      },
    }))

    const { googleOrganicSearch } = await import("@/lib/research/serp/router")
    const result = await googleOrganicSearch("cached query")

    expect(result.results[0]?.title).toBe("Cached")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("mock SERP mode", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("returns quality-gate-passing results in dev mock mode", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    vi.doMock("@/lib/research/serp/cache", () => ({
      getCachedSerp: vi.fn().mockResolvedValue(null),
      setCachedSerp: vi.fn(),
    }))

    vi.doMock("@/env.mjs", () => ({
      env: {
        SERPAPI_KEY: undefined,
        SEARCHAPI_KEY: undefined,
        DATAFORSEO_LOGIN: undefined,
        DATAFORSEO_PASSWORD: undefined,
        SERP_PROVIDER_CHAIN: "serpapi",
        SERP_CACHE_TTL_HOURS: 24,
        LEVELSTACK_DEV_MOCK_SERP: true,
      },
    }))

    const { googleOrganicSearch } = await import("@/lib/research/serp/router")
    const result = await googleOrganicSearch("Acme Plumbing reviews")

    expect(result.results.length).toBeGreaterThan(0)
    expect(result.limitation).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("free vs paid query counts", () => {
  const intake = {
    ...levelstackIntakeDefaults,
    primaryBusinessName: "Acme Co",
    websiteUrl: "https://acme.example.com",
    marketCity: "Atlanta",
    marketState: "GA",
    geoMarket: "local" as const,
    priorBusinessNames: ["Old Acme", "None"],
  }

  it("uses ~7 SERP queries for free snapshot tier", () => {
    const brand = brandNameSearchQueries(intake, "free_snapshot")
    const directory = directoryReviewQueries(intake, "free_snapshot")
    expect(brand).toHaveLength(1)
    expect(directory).toHaveLength(4)
    expect(brand[0]).toContain("Atlanta")
  })

  it("uses full query sets for paid tier", () => {
    const brand = brandNameSearchQueries(intake, "full_report")
    const directory = directoryReviewQueries(intake, "full_report")
    expect(brand.length).toBeGreaterThanOrEqual(3)
    expect(directory).toHaveLength(9)
  })
})
