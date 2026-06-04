import { googleOrganicSearch } from "@/lib/research/serp"
import { bestReputationHit } from "@/lib/research/reputation-parse"
import { fetchWebsiteSignals } from "@/lib/research/website"

export type CompetitorSnapshot = {
  domain: string
  homepageTitle: string | null
  reviewSnippet: string | null
  rating: number | null
  reviewCount: number | null
  limitation: string | null
}

export async function fetchCompetitorSnapshots(
  domains: string[],
): Promise<CompetitorSnapshot[]> {
  const limited = domains.slice(0, 3)

  return Promise.all(
    limited.map(async (domain) => {
      const query = `${domain} reviews`
      const [serp, site] = await Promise.all([
        googleOrganicSearch(query),
        fetchWebsiteSignals(`https://${domain}`).catch(() => null),
      ])

      const hit = bestReputationHit(serp.results, query)
      const limitation =
        serp.limitation ??
        (hit ? null : "No review-oriented SERP snippet for this domain.")

      return {
        domain,
        homepageTitle: site?.title ?? null,
        reviewSnippet: hit
          ? `${hit.result.title}: ${hit.result.snippet}`.slice(0, 220)
          : null,
        rating: hit?.parsed.rating ?? null,
        reviewCount: hit?.parsed.reviewCount ?? null,
        limitation,
      }
    }),
  )
}
