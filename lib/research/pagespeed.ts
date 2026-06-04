import { env } from "@/env.mjs"

export type PageSpeedSignals = {
  mobileScore: number | null
  lcp: string | null
  cls: string | null
  limitation: string | null
}

type PsiResponse = {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } }
    audits?: Record<
      string,
      { displayValue?: string; numericValue?: number }
    >
  }
  error?: { message?: string }
}

export async function fetchPageSpeedSignals(url: string): Promise<PageSpeedSignals> {
  const empty: PageSpeedSignals = {
    mobileScore: null,
    lcp: null,
    cls: null,
    limitation: null,
  }

  let targetUrl: string
  try {
    targetUrl = new URL(url).toString()
  } catch {
    return { ...empty, limitation: "Invalid website URL for PageSpeed." }
  }

  const params = new URLSearchParams({
    url: targetUrl,
    strategy: "mobile",
    category: "performance",
  })
  if (env.GOOGLE_PAGESPEED_API_KEY) {
    params.set("key", env.GOOGLE_PAGESPEED_API_KEY)
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: AbortSignal.timeout(45_000) },
    )

    if (!res.ok) {
      const hint =
        res.status === 429
          ? "Rate limited — add GOOGLE_PAGESPEED_API_KEY for higher quota."
          : `HTTP ${res.status}`
      return { ...empty, limitation: `PageSpeed Insights: ${hint}` }
    }

    const data = (await res.json()) as PsiResponse
    if (data.error?.message) {
      return { ...empty, limitation: data.error.message }
    }

    const scoreRaw = data.lighthouseResult?.categories?.performance?.score
    const mobileScore =
      typeof scoreRaw === "number" ? Math.round(scoreRaw * 100) : null

    const audits = data.lighthouseResult?.audits ?? {}
    const lcp =
      audits["largest-contentful-paint"]?.displayValue ??
      (audits["largest-contentful-paint"]?.numericValue != null
        ? `${Math.round(audits["largest-contentful-paint"].numericValue)} ms`
        : null)
    const cls =
      audits["cumulative-layout-shift"]?.displayValue ??
      (audits["cumulative-layout-shift"]?.numericValue != null
        ? String(audits["cumulative-layout-shift"].numericValue)
        : null)

    if (mobileScore == null) {
      return { ...empty, limitation: "PageSpeed returned no performance score." }
    }

    return { mobileScore, lcp, cls, limitation: null }
  } catch (err) {
    return {
      ...empty,
      limitation:
        err instanceof Error ? err.message : "PageSpeed Insights request failed.",
    }
  }
}

export function isPageSpeedConfigured(): boolean {
  return true
}
