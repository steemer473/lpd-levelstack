import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env.mjs", () => ({
  env: {
    DATAFORSEO_LOGIN: "login",
    DATAFORSEO_PASSWORD: "password",
  },
}))

describe("dataForSeoOrganicSearch", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("parses organic results when top-level status_message is Ok.", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status_code: 20000,
          status_message: "Ok.",
          tasks: [
            {
              status_code: 20000,
              status_message: "Ok.",
              result: [
                {
                  items: [
                    {
                      type: "organic",
                      rank_absolute: 1,
                      title: "Level Play Digital",
                      url: "https://levelplaydigital.com",
                      description: "Operational systems",
                    },
                  ],
                },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { dataForSeoOrganicSearch } = await import("@/lib/research/serp/providers/dataforseo")
    const result = await dataForSeoOrganicSearch("Level Play Digital Atlanta")

    expect(result.shouldFailover).toBe(false)
    expect(result.response.limitation).toBeNull()
    expect(result.response.results).toHaveLength(1)
    expect(result.response.results[0]?.link).toBe("https://levelplaydigital.com")
  })

  it("failovers on task-level quota errors", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status_code: 20000,
          status_message: "Ok.",
          tasks: [
            {
              status_code: 40204,
              status_message: "Account quota exceeded.",
            },
          ],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { dataForSeoOrganicSearch } = await import("@/lib/research/serp/providers/dataforseo")
    const result = await dataForSeoOrganicSearch("test query")

    expect(result.shouldFailover).toBe(true)
    expect(result.response.results).toHaveLength(0)
    expect(result.response.limitation).toBe("Account quota exceeded.")
  })
})
