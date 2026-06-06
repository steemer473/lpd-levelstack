import { googleOrganicSearch } from "@/lib/research/serp"

export type SocialPlatformResult = {
  platform: string
  found: boolean
  url: string | null
  title: string | null
}

const PLATFORM_QUERIES = [
  { platform: "LinkedIn", site: "site:linkedin.com" },
  { platform: "Facebook", site: "site:facebook.com" },
  { platform: "Instagram", site: "site:instagram.com" },
  { platform: "X", site: "site:x.com OR site:twitter.com" },
  { platform: "YouTube", site: "site:youtube.com" },
  { platform: "TikTok", site: "site:tiktok.com" },
] as const

export async function searchSocialPlatforms(
  brandName: string,
  domain: string,
): Promise<SocialPlatformResult[]> {
  const queryBase = `"${brandName}" ${domain}`

  const results = await Promise.all(
    PLATFORM_QUERIES.map(async ({ platform, site }) => {
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
