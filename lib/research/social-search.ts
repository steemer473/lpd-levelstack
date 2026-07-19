import type { ReportTier } from "@/lib/levelstack-plans"
import { googleOrganicSearch, type SerpOrganicResult } from "@/lib/research/serp"

export type SocialPlatformResult = {
  platform: string
  found: boolean
  url: string | null
  title: string | null
}

const ALL_PLATFORM_QUERIES = [
  { platform: "LinkedIn", site: "site:linkedin.com" },
  { platform: "Facebook", site: "site:facebook.com" },
  { platform: "Instagram", site: "site:instagram.com" },
  { platform: "X", site: "site:x.com OR site:twitter.com" },
  { platform: "YouTube", site: "site:youtube.com" },
  { platform: "TikTok", site: "site:tiktok.com" },
] as const

const FREE_TIER_PLATFORMS = new Set(["LinkedIn", "Facebook"])

/** Stopwords that must not count as brand evidence in social SERP titles. */
const WEAK_BRAND_TOKENS = new Set([
  "digital",
  "marketing",
  "agency",
  "services",
  "service",
  "group",
  "company",
  "companies",
  "solutions",
  "consulting",
  "business",
  "businesses",
  "local",
  "professional",
  "llc",
  "inc",
  "the",
  "and",
  "near",
  "atlanta",
  "georgia",
])

const SOCIAL_HIT_SCAN_LIMIT = 5

function platformQueriesForTier(reportTier: ReportTier) {
  if (reportTier === "free_snapshot") {
    return ALL_PLATFORM_QUERIES.filter(({ platform }) => FREE_TIER_PLATFORMS.has(platform))
  }
  return ALL_PLATFORM_QUERIES
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function textIncludesToken(text: string, token: string): boolean {
  return new RegExp(`\\b${escapeRe(token)}\\b`, "i").test(text)
}

function significantBrandTokens(brandName: string): string[] {
  const tokens = new Set<string>()
  for (const word of brandName.toLowerCase().split(/[\s,./|-]+/)) {
    if (word.length >= 4 && !WEAK_BRAND_TOKENS.has(word)) {
      tokens.add(word)
    }
  }
  return [...tokens]
}

function normalizeHost(value: string): string {
  return value.toLowerCase().replace(/^www\./, "").replace(/\/$/, "")
}

/**
 * True when a social SERP organic result is plausibly this brand — not a
 * namesake, directory, or unrelated person who ranks for overlapping tokens.
 */
export function socialSerpHitMatchesBrand(
  result: Pick<SerpOrganicResult, "title" | "link" | "snippet">,
  brandName: string,
  domain: string,
): boolean {
  const haystack = `${result.title} ${result.snippet ?? ""} ${result.link}`.toLowerCase()
  const brand = brandName.trim().toLowerCase()
  if (brand.length >= 6 && haystack.includes(brand)) return true

  const host = normalizeHost(domain)
  if (host && haystack.includes(host)) return true
  const root = host.split(".")[0] ?? ""
  if (root.length >= 5 && haystack.includes(root)) return true

  // LinkedIn / Facebook company slug often embeds the brand.
  const pathSlug = (result.link.match(/\/(?:company|in|school|showcase)\/([^/?#]+)/i)?.[1] ??
    result.link.match(/facebook\.com\/([^/?#]+)/i)?.[1] ??
    "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
  if (root.length >= 5 && pathSlug.includes(root.replace(/[^a-z0-9]+/g, ""))) {
    return true
  }

  const tokens = significantBrandTokens(brandName)
  if (tokens.length === 0) return false
  const matched = tokens.filter((token) => textIncludesToken(haystack, token))
  if (tokens.length === 1) return matched.length === 1
  return matched.length >= 2
}

function pickBrandMatchedHit(
  results: SerpOrganicResult[],
  brandName: string,
  domain: string,
): SerpOrganicResult | null {
  const candidates = results.slice(0, SOCIAL_HIT_SCAN_LIMIT)
  // Prefer company pages when they match — personal /in/ hits are a common false positive.
  const companyHit = candidates.find(
    (r) =>
      /linkedin\.com\/company\//i.test(r.link) &&
      socialSerpHitMatchesBrand(r, brandName, domain),
  )
  if (companyHit) return companyHit

  return (
    candidates.find((r) => socialSerpHitMatchesBrand(r, brandName, domain)) ?? null
  )
}

export async function searchSocialPlatforms(
  brandName: string,
  domain: string,
  reportTier: ReportTier = "full_report",
): Promise<SocialPlatformResult[]> {
  const queryBase = `"${brandName}" ${domain}`
  const platforms = platformQueriesForTier(reportTier)

  const results = await Promise.all(
    platforms.map(async ({ platform, site }) => {
      const search = await googleOrganicSearch(`${site} ${queryBase}`)
      const hit = pickBrandMatchedHit(search.results, brandName, domain)
      return {
        platform,
        found: Boolean(hit),
        url: hit?.link ?? null,
        title: hit?.title ?? null,
      }
    }),
  )

  return results
}
