import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env.mjs", () => ({
  env: {
    PLUNK_PUBLIC_KEY: "pk_test_public",
    PLUNK_SECRET_KEY: "sk_test_secret",
    PLUNK_API_URL: undefined,
    PLUNK_WORKFLOW_API_URL: undefined,
  },
}))

describe("plunkTrack", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("uses PLUNK_PUBLIC_KEY for /v1/track", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { plunkTrack } = await import("@/lib/plunk/client")
    const result = await plunkTrack({
      email: "test@example.com",
      event: "levelstack_report_ready",
      subscribed: true,
    })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://next-api.useplunk.com/v1/track")
    expect(init.headers).toMatchObject({
      Authorization: "Bearer pk_test_public",
    })
  })

  it("skips track when PLUNK_PUBLIC_KEY is missing", async () => {
    vi.doMock("@/env.mjs", () => ({
      env: {
        PLUNK_PUBLIC_KEY: undefined,
        PLUNK_SECRET_KEY: "sk_test_secret",
      },
    }))

    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { plunkTrack } = await import("@/lib/plunk/client")
    const result = await plunkTrack({
      email: "test@example.com",
      event: "levelstack_report_ready",
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBe("not_configured")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("plunkApiRequest", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("uses PLUNK_SECRET_KEY for management API calls", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { plunkApiRequest } = await import("@/lib/plunk/client")
    const result = await plunkApiRequest("/v1/workflows", { workflowApi: true })

    expect(result.ok).toBe(true)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).toMatchObject({
      Authorization: "Bearer sk_test_secret",
    })
  })
})
