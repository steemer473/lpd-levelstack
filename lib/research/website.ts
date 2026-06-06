import { env } from "@/env.mjs"

export type WebsiteSignals = {
  url: string
  title: string | null
  metaDescription: string | null
  h1: string | null
  usesHttps: boolean
  hasCtaLanguage: boolean
  wordCountApprox: number
  limitation: string | null
}

export type WebsiteExtendedSignals = {
  ogImage: string | null
  ogTitle: string | null
  twitterCard: string | null
  navLabels: string[]
  heroText: string | null
}

const CTA_PATTERN =
  /\b(book|schedule|call|contact|get started|sign up|free consult|apply now)\b/i

export async function fetchWebsiteSignals(url: string): Promise<WebsiteSignals> {
  const base: WebsiteSignals = {
    url,
    title: null,
    metaDescription: null,
    h1: null,
    usesHttps: url.startsWith("https://"),
    hasCtaLanguage: false,
    wordCountApprox: 0,
    limitation: null,
  }

  if (env.FIRECRAWL_API_KEY) {
    const scraped = await scrapeWithFirecrawl(url)
    if (scraped) {
      return { ...base, ...scraped, usesHttps: url.startsWith("https://") }
    }
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
      redirect: "follow",
    })

    if (!res.ok) {
      return { ...base, limitation: `Website returned HTTP ${res.status}.` }
    }

    const html = await res.text()
    return parseHtmlSignals(url, html)
  } catch (err) {
    return {
      ...base,
      limitation: err instanceof Error ? err.message : "Could not fetch website.",
    }
  }
}

export async function fetchWebsiteExtendedSignals(
  url: string,
): Promise<WebsiteExtendedSignals | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
    })
    if (!res.ok) return null
    return parseExtendedSignals(await res.text())
  } catch {
    return null
  }
}

function parseExtendedSignals(html: string): WebsiteExtendedSignals {
  const ogImage =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ??
    null
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null
  const twitterCard =
    html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+property=["']twitter:card["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    null

  const navLabels = [
    ...html.matchAll(/<nav[\s\S]*?<\/nav>/gi),
  ]
    .flatMap((nav) =>
      [...nav[0].matchAll(/>([^<]{2,40})</g)]
        .map((m) => m[1]?.trim())
        .filter((label): label is string => Boolean(label)),
    )
    .slice(0, 8)

  const heroMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? null

  return {
    ogImage,
    ogTitle,
    twitterCard,
    navLabels,
    heroText: heroMatch,
  }
}

function parseHtmlSignals(url: string, html: string): WebsiteSignals {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null
  const metaDescription =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1]?.trim() ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    )?.[1]?.trim() ??
    null
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? null
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")
  const words = text.split(/\s+/).filter((w) => w.length > 2)

  return {
    url,
    title,
    metaDescription,
    h1,
    usesHttps: url.startsWith("https://"),
    hasCtaLanguage: CTA_PATTERN.test(html),
    wordCountApprox: words.length,
    limitation: null,
  }
}

async function scrapeWithFirecrawl(
  url: string,
): Promise<Partial<WebsiteSignals> | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      data?: { markdown?: string; metadata?: { title?: string; description?: string } }
    }

    const markdown = data.data?.markdown ?? ""
    const title = data.data?.metadata?.title ?? null
    const metaDescription = data.data?.metadata?.description ?? null
    const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null
    const words = markdown.split(/\s+/).filter((w) => w.length > 2)

    return {
      title,
      metaDescription,
      h1,
      hasCtaLanguage: CTA_PATTERN.test(markdown),
      wordCountApprox: words.length,
      limitation: null,
    }
  } catch {
    return null
  }
}
