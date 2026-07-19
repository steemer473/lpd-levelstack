import type { ReportTier } from "@/lib/levelstack-plans"
import { googleOrganicSearch, type SerpOrganicResult } from "@/lib/research/serp"
import { extractSocialUrls } from "@/lib/research/social"

export type SocialPlatformResult = {
  platform: string
  found: boolean
  url: string | null
  title: string | null
  /** How we attributed the profile — website/intake beats SERP. */
  source?: "website" | "intake" | "serp"
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

const SOCIAL_HIT_SCAN_LIMIT = 8

function platformQueriesForTier(reportTier: ReportTier) {
  if (reportTier === "free_snapshot") {
    return ALL_PLATFORM_QUERIES.filter(({ platform }) => FREE_TIER_PLATFORMS.has(platform))
  }
  return ALL_PLATFORM_QUERIES
}

function normalizeHost(value: string): string {
  return value.toLowerCase().replace(/^www\./, "").replace(/\/$/, "")
}

function compactAlnum(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

/** Slug / domain roots that should uniquely identify this brand on social. */
export function brandSocialSlugCandidates(brandName: string, domain: string): string[] {
  const host = normalizeHost(domain)
  const root = host.split(".")[0] ?? ""
  const dashed = brandName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const compact = compactAlnum(brandName)
  return [...new Set([root, dashed, compact].filter((s) => s.length >= 4))]
}

function pathSlugFromSocialUrl(link: string): string {
  const company = link.match(/\/(?:company|school|showcase)\/([^/?#]+)/i)?.[1]
  if (company) return compactAlnum(company)
  const fb = link.match(/facebook\.com\/([^/?#]+)/i)?.[1]
  if (fb && !/^(profile\.php|people|groups|events|watch)$/i.test(fb)) {
    return compactAlnum(fb)
  }
  const personal = link.match(/\/in\/([^/?#]+)/i)?.[1]
  if (personal) return compactAlnum(personal)
  return ""
}

/**
 * True when a social SERP organic result is plausibly this brand — not a
 * namesake ("Next Level Play") or unrelated person who ranks for weak tokens.
 *
 * Accepts: full brand phrase, buyer domain, or social slug matching brand/domain roots.
 * Does NOT accept loose multi-token overlap alone (that caused Cassandra / Next Level Play FPs).
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

  const pathSlug = pathSlugFromSocialUrl(result.link)
  if (!pathSlug) return false

  return brandSocialSlugCandidates(brandName, domain).some(
    (candidate) =>
      pathSlug === compactAlnum(candidate) ||
      (candidate.length >= 8 && pathSlug.includes(compactAlnum(candidate))),
  )
}

function pickBrandMatchedHit(
  results: SerpOrganicResult[],
  brandName: string,
  domain: string,
): SerpOrganicResult | null {
  const candidates = results.slice(0, SOCIAL_HIT_SCAN_LIMIT)
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

function knownProfileForPlatform(
  platform: string,
  knownProfiles: { platform: string; url: string; source?: "website" | "intake" }[],
): { platform: string; url: string; source?: "website" | "intake" } | undefined {
  const matches = knownProfiles.filter(
    (p) => p.platform.toLowerCase() === platform.toLowerCase(),
  )
  // Prefer company pages over personal profiles when both are known.
  return (
    matches.find((p) => /linkedin\.com\/company\//i.test(p.url)) ??
    matches[0]
  )
}

const KNOWN_SOCIAL_PLATFORMS = new Set([
  "LinkedIn",
  "Facebook",
  "Instagram",
  "X",
  "YouTube",
  "TikTok",
])

/** Pull social profile URLs linked from a website homepage (footer/nav/body). */
export async function discoverWebsiteSocialProfiles(
  websiteUrl: string,
): Promise<{ platform: string; url: string; source: "website" }[]> {
  try {
    const res = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "LevelStack-ReportBot/1.0" },
      redirect: "follow",
    })
    if (!res.ok) return []
    const html = await res.text()
    return extractSocialUrls(html)
      .filter((p) => KNOWN_SOCIAL_PLATFORMS.has(p.platform))
      .map((p) => ({ ...p, source: "website" as const }))
  } catch {
    return []
  }
}

export async function searchSocialPlatforms(
  brandName: string,
  domain: string,
  reportTier: ReportTier = "full_report",
  knownProfiles: { platform: string; url: string; source?: "website" | "intake" }[] = [],
): Promise<SocialPlatformResult[]> {
  const queryBase = `"${brandName}" ${domain}`
  const platforms = platformQueriesForTier(reportTier)

  const results = await Promise.all(
    platforms.map(async ({ platform, site }) => {
      const known = knownProfileForPlatform(platform, knownProfiles)
      if (known?.url) {
        return {
          platform,
          found: true,
          url: known.url,
          title: `${platform} profile linked from your ${known.source === "intake" ? "intake" : "website"}`,
          source: known.source ?? "website",
        } satisfies SocialPlatformResult
      }

      const search = await googleOrganicSearch(`${site} ${queryBase}`)
      const hit = pickBrandMatchedHit(search.results, brandName, domain)
      return {
        platform,
        found: Boolean(hit),
        url: hit?.link ?? null,
        title: hit?.title ?? null,
        source: hit ? ("serp" as const) : undefined,
      } satisfies SocialPlatformResult
    }),
  )

  return results
}
