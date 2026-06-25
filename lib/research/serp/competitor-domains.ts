import type { SerpOrganicResult } from "@/lib/research/serp/types"

/** Platforms, aggregators, and directories — never competitive grid columns. */
const NON_COMPETITOR_HOSTS = new Set([
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "yelp.com",
  "bbb.org",
  "trustpilot.com",
  "glassdoor.com",
  "wikipedia.org",
  "amazon.com",
  "apple.com",
  "microsoft.com",
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "tiktok.com",
  "clutch.co",
  "g2.com",
  "capterra.com",
  "yellowpages.com",
  "mapquest.com",
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  // Software / startup directories & "best-of" aggregators (P1.7). These rank for
  // service-market queries but are lists of businesses, not a single competitor.
  "gregslist.com",
  "f6s.com",
  "getlatka.com",
  "builtin.com",
  "crunchbase.com",
  "owler.com",
  "goodfirms.co",
  "designrush.com",
  "expertise.com",
  "threebestrated.com",
  "manta.com",
  "producthunt.com",
  "softwareadvice.com",
  "trustradius.com",
  "sourceforge.net",
  "slashdot.org",
  "indeed.com",
  "ziprecruiter.com",
  "thumbtack.com",
  "angi.com",
  "houzz.com",
  "birdeye.com",
  "techbehemoths.com",
  "upcity.com",
])

/**
 * Title shapes that signal a directory / "listicle" page rather than a single
 * business homepage (e.g. "72 top SaaS companies in Atlanta", "Best agencies
 * near you"). Used as a content-level guard on top of the host denylist so a
 * non-denylisted host serving a list page never becomes a grid column (P1.7).
 */
const DIRECTORY_LISTING_TITLE_PATTERN =
  /\btop\s+\d+\b|\b\d+\s+(?:top|best)\b|\b\d+\s+[\w&'.\- ]{0,40}\b(?:companies|startups|agencies|firms|vendors|tools|brands)\b|\bbest\b[\w&'.\- ]{0,40}\b(?:in|near|for)\b|\b(?:companies|startups|agencies|firms|vendors|providers|services)\s+(?:in|near)\b|\b(?:company|agency|firm|provider)\s+in\b|\b(?:development|consulting|engineering|outsourcing)\s+services\b|\blist of\b|\bdirectory\b|\btop[- ]rated\b/i

/**
 * Titles returned when a homepage fetch hits a bot wall / interstitial instead of
 * real content (Cloudflare "Checking your browser", "Just a moment", captchas).
 * These must never be presented as a competitor's homepage title (P1.7).
 */
const BOT_INTERSTITIAL_TITLE_PATTERN =
  /checking your browser|just a moment|attention required|access denied|are you (?:a )?(?:human|robot)|verify(?:ing)? (?:you are |that you are )?human|please verify|please enable javascript|enable cookies|403 forbidden|forbidden access|captcha|cloudflare|security check|one more step|rate limited|too many requests/i

export function isDirectoryListingTitle(
  title: string | null | undefined,
): boolean {
  if (!title) return false
  return DIRECTORY_LISTING_TITLE_PATTERN.test(title)
}

export function isBotInterstitialTitle(
  title: string | null | undefined,
): boolean {
  if (!title) return false
  return BOT_INTERSTITIAL_TITLE_PATTERN.test(title)
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "")
}

function hostsMatch(a: string, b: string): boolean {
  const left = normalizeHost(a)
  const right = normalizeHost(b)
  if (!left || !right) return false
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`)
}

export function isNonCompetitorHost(host: string): boolean {
  const h = normalizeHost(host)
  if (!h) return true
  if (NON_COMPETITOR_HOSTS.has(h)) return true
  if (h === "google.com" || h.endsWith(".google.com")) return true
  return false
}

export function isCompetitorCandidate(
  host: string,
  excludeHost: string | null | undefined,
): boolean {
  if (!host || isNonCompetitorHost(host)) return false
  if (excludeHost && hostsMatch(host, excludeHost)) return false
  return true
}

export function filterCompetitorDomains(
  domains: string[],
  excludeHost?: string | null,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const domain of domains) {
    if (!isCompetitorCandidate(domain, excludeHost ?? null)) continue
    const key = normalizeHost(domain)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export function topCompetitorDomains(
  results: SerpOrganicResult[],
  excludeHost: string | null,
  limit = 3,
): string[] {
  const domains: string[] = []

  for (const row of results) {
    try {
      const host = new URL(row.link).hostname.replace(/^www\./, "").toLowerCase()
      if (!isCompetitorCandidate(host, excludeHost)) continue
      if (domains.includes(host)) continue
      domains.push(host)
      if (domains.length >= limit) break
    } catch {
      continue
    }
  }

  return domains
}

/**
 * A SERP result qualifies as a real peer business only when its host is a
 * candidate competitor AND its title is not a directory listicle or bot
 * interstitial. This is the P1.7 Tier-A quality gate: it stops directory pages
 * (gregslist, f6s, "72 top SaaS companies…") from being treated as competitors.
 */
export function isQualifiedPeerResult(
  result: SerpOrganicResult,
  excludeHost: string | null | undefined,
): boolean {
  let host: string
  try {
    host = new URL(result.link).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return false
  }
  if (!isCompetitorCandidate(host, excludeHost ?? null)) return false
  if (isDirectoryListingTitle(result.title)) return false
  if (isBotInterstitialTitle(result.title)) return false
  return true
}

/**
 * Like {@link topCompetitorDomains} but applies the {@link isQualifiedPeerResult}
 * content gate so directory/listicle hosts never become grid columns.
 */
export function qualifiedPeerDomains(
  results: SerpOrganicResult[],
  excludeHost: string | null,
  limit = 3,
): string[] {
  const domains: string[] = []

  for (const row of results) {
    if (!isQualifiedPeerResult(row, excludeHost)) continue
    let host: string
    try {
      host = new URL(row.link).hostname.replace(/^www\./, "").toLowerCase()
    } catch {
      continue
    }
    if (domains.includes(host)) continue
    domains.push(host)
    if (domains.length >= limit) break
  }

  return domains
}
