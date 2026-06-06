export type AboutFooterSignals = {
  aboutUrl: string | null
  footerSocialLinks: string[]
  contactEmail: string | null
  contactPhone: string | null
  companyNarrative: string | null
  limitation: string | null
}

const SOCIAL_HOSTS =
  /linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com/i

export async function fetchAboutAndFooterSignals(
  baseUrl: string,
): Promise<AboutFooterSignals> {
  const empty: AboutFooterSignals = {
    aboutUrl: null,
    footerSocialLinks: [],
    contactEmail: null,
    contactPhone: null,
    companyNarrative: null,
    limitation: null,
  }

  let rootHtml: string
  try {
    const res = await fetch(baseUrl, {
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
    })
    if (!res.ok) {
      return { ...empty, limitation: `Root fetch HTTP ${res.status}` }
    }
    rootHtml = await res.text()
  } catch (err) {
    return {
      ...empty,
      limitation: err instanceof Error ? err.message : "Could not fetch site.",
    }
  }

  const footerMatch = rootHtml.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? rootHtml.slice(-8000)
  const socialLinks = [
    ...new Set(
      [...footerMatch.matchAll(/href=["']([^"']+)["']/gi)]
        .map((m) => m[1])
        .filter((href): href is string => Boolean(href && SOCIAL_HOSTS.test(href))),
    ),
  ]

  const aboutPath = rootHtml.match(/href=["'](\/about[^"']*)["']/i)?.[1]
  const aboutUrl = aboutPath ? new URL(aboutPath, baseUrl).toString() : null

  let companyNarrative: string | null = null
  if (aboutUrl) {
    try {
      const aboutRes = await fetch(aboutUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
      })
      if (aboutRes.ok) {
        const aboutHtml = await aboutRes.text()
        const text = aboutHtml
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        companyNarrative = text.slice(0, 500) || null
      }
    } catch {
      // non-fatal
    }
  }

  const emailMatch = rootHtml.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  const phoneMatch = rootHtml.match(/\+?\d[\d\s().-]{8,}\d/)

  return {
    aboutUrl,
    footerSocialLinks: socialLinks,
    contactEmail: emailMatch?.[0] ?? null,
    contactPhone: phoneMatch?.[0]?.trim() ?? null,
    companyNarrative,
    limitation: null,
  }
}
