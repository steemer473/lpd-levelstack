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
])

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
