export type SocialProfileSignal = {
  platform: string
  url: string
  pageTitle: string | null
  recencyHint: string | null
  limitation: string | null
}

const URL_IN_TEXT =
  /https?:\/\/[^\s<>"']+|(?:instagram|facebook|linkedin|twitter|x|youtube|tiktok)\.com\/[^\s<>"']+/gi

export function extractSocialUrls(text: string): { platform: string; url: string }[] {
  const matches = text.match(URL_IN_TEXT) ?? []
  const out: { platform: string; url: string }[] = []
  const seen = new Set<string>()

  for (const raw of matches) {
    let url = raw.trim().replace(/\\+$/g, "").replace(/[.,;:)]+$/g, "")
    if (!url.startsWith("http")) url = `https://${url}`
    try {
      const parsed = new URL(url)
      const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
      const key = parsed.origin + parsed.pathname.replace(/\/$/, "")
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ platform: platformFromHost(host), url: parsed.toString() })
    } catch {
      continue
    }
  }

  return out.slice(0, 5)
}

function platformFromHost(host: string): string {
  if (host.includes("instagram")) return "Instagram"
  if (host.includes("facebook")) return "Facebook"
  if (host.includes("linkedin")) return "LinkedIn"
  if (host.includes("twitter") || host === "x.com") return "X"
  if (host.includes("youtube")) return "YouTube"
  if (host.includes("tiktok")) return "TikTok"
  return host
}

export async function fetchSocialProfileSignals(
  intakeText: string,
): Promise<SocialProfileSignal[]> {
  const urls = extractSocialUrls(intakeText)
  if (urls.length === 0) {
    return [
      {
        platform: "Intake",
        url: "",
        pageTitle: null,
        recencyHint: null,
        limitation: "No parseable social URLs in intake (paste full profile links).",
      },
    ]
  }

  const signals = await Promise.all(
    urls.map(async ({ platform, url }) => fetchOneSocial(platform, url)),
  )
  return signals
}

async function fetchOneSocial(
  platform: string,
  url: string,
): Promise<SocialProfileSignal> {
  const base = {
    platform,
    url,
    pageTitle: null as string | null,
    recencyHint: null as string | null,
    limitation: null as string | null,
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
      redirect: "follow",
    })

    if (!res.ok) {
      return {
        ...base,
        limitation: `HTTP ${res.status} — profile may block automated access.`,
      }
    }

    const html = await res.text()
    const ogTitle =
      html.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    const ogUpdated =
      html.match(/property=["']og:updated_time["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/property=["']article:modified_time["'][^>]+content=["']([^"']+)["']/i)?.[1]

    let recencyHint: string | null = null
    if (ogUpdated) {
      try {
        recencyHint = `Last updated signal: ${new Date(ogUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      } catch {
        recencyHint = `Metadata timestamp: ${ogUpdated.slice(0, 32)}`
      }
    } else if (/login|sign in|log in/i.test(html.slice(0, 3000))) {
      recencyHint = "Login wall — recency not measurable without manual check."
    } else {
      recencyHint = "No public last-post date detected in page metadata."
    }

    return {
      ...base,
      pageTitle: ogTitle ?? title ?? null,
      recencyHint,
      limitation: null,
    }
  } catch (err) {
    return {
      ...base,
      limitation:
        err instanceof Error ? err.message : "Could not fetch social profile.",
    }
  }
}
