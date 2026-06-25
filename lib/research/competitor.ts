import { googleOrganicSearch } from "@/lib/research/serp"
import { bestReputationHit } from "@/lib/research/reputation-parse"
import { fetchWebsiteSignals } from "@/lib/research/website"
import type { SerpOrganicResult } from "@/lib/research/serp"

export type CompetitorSnapshot = {
  domain: string
  homepageTitle: string | null
  reviewSnippet: string | null
  rating: number | null
  reviewCount: number | null
  limitation: string | null
}

/**
 * A `{domain} reviews` SERP often returns review pages for unrelated namesakes
 * (e.g. "Unity Reviews" for a different Unity). Only trust the hit when its text
 * references the competitor's own brand root, so the grid never shows junk cells.
 */
export function reviewHitMatchesDomain(
  hit: SerpOrganicResult,
  domain: string,
): boolean {
  const root = domain.toLowerCase().replace(/^www\./, "").split(".")[0] ?? ""
  const cleanRoot = root.replace(/[^a-z0-9]+/g, "")
  if (cleanRoot.length < 4) return false
  const haystack = `${hit.title} ${hit.snippet} ${hit.link}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
  return haystack.includes(cleanRoot)
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

      const rawHit = bestReputationHit(serp.results, query)
      const hit =
        rawHit && reviewHitMatchesDomain(rawHit.result, domain) ? rawHit : null
      const limitation =
        serp.limitation ??
        (hit
          ? null
          : rawHit
            ? "Review results did not match this competitor's domain."
            : "No review-oriented SERP snippet for this domain.")

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
