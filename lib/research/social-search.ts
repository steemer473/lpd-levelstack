import type { ReportTier } from "@/lib/levelstack-plans"
import { googleOrganicSearch } from "@/lib/research/serp"

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

function platformQueriesForTier(reportTier: ReportTier) {
  if (reportTier === "free_snapshot") {
    return ALL_PLATFORM_QUERIES.filter(({ platform }) => FREE_TIER_PLATFORMS.has(platform))
  }
  return ALL_PLATFORM_QUERIES
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
      const hit = search.results[0]
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
