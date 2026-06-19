import { runSerpQueries } from "@/lib/research/serp"

export type BrandMention = {
  url: string
  title: string
  snippet: string
  sourceType: "review" | "press" | "community" | "other"
}

export type BrandMentionSignals = {
  mentions: BrandMention[]
  limitation: string | null
}

function classifyMention(link: string, snippet: string): BrandMention["sourceType"] {
  const lower = `${link} ${snippet}`.toLowerCase()
  if (/review|yelp|trustpilot|bbb|g2|capterra|rating/.test(lower)) return "review"
  if (/news|press|forbes|inc\.com|medium|blog/.test(lower)) return "press"
  if (/reddit|forum|community|quora/.test(lower)) return "community"
  return "other"
}

export function brandMentionQueries(brandName: string, domain: string): string[] {
  return [
    `"${brandName}" reviews`,
    `"${brandName}" ${domain} mentions`,
    `"${brandName}" press`,
    `"${brandName}" -site:${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`,
  ]
}

export async function fetchBrandMentions(
  brandName: string,
  domain: string,
  ownedHost: string | null,
): Promise<BrandMentionSignals> {
  const queries = brandMentionQueries(brandName, domain)
  const searches = await runSerpQueries(queries)

  const mentions: BrandMention[] = []
  const seen = new Set<string>()

  for (const search of searches) {
    for (const result of search.results) {
      if (ownedHost && result.link.includes(ownedHost)) continue
      if (seen.has(result.link)) continue
      seen.add(result.link)
      mentions.push({
        url: result.link,
        title: result.title,
        snippet: result.snippet,
        sourceType: classifyMention(result.link, result.snippet),
      })
    }
  }

  return {
    mentions: mentions.slice(0, 15),
    limitation: searches.every((s) => s.limitation) ? "SERP providers unavailable." : null,
  }
}
