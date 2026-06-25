import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import type { GbpSignals } from "@/lib/research/gbp"
import type { SerpOrganicResult, SerpSearchResponse } from "@/lib/research/serp/types"
import {
  filterCompetitorDomains,
  isNonCompetitorHost,
  topCompetitorDomains,
} from "@/lib/research/serp/competitor-domains"
import { hostnameFromUrl } from "@/lib/research/serp/router"

export type CompetitorComparisonSource =
  | "service_peer"
  | "namesake"
  | "category_peer"
  | "intake"

export type CompetitorColumn = {
  domain: string
  source: CompetitorComparisonSource
  /** SERP title when available — used for column header context */
  title?: string
}

export type CompetitiveComparisonMode =
  | "service_peer"
  | "namesake"
  | "category_peer"
  | "mixed"
  | "evidence_only"

export const COMPARISON_SOURCE_LABELS: Record<CompetitorComparisonSource, string> = {
  service_peer: "Service peer",
  namesake: "Namesake / brand confusion",
  category_peer: "Category peer",
  intake: "Named competitor (intake)",
}

export function categoryPeerQuery(
  intake: LevelstackIntakeFormValues,
  gbp: GbpSignals,
): string {
  const location = marketLocationLabel(intake)
  const category = gbp.category?.trim()
  const service = intake.primaryService.trim()

  if (category && location) return `${category} ${location}`
  if (service && location) return `${service} ${location}`
  if (category) return category
  if (intake.geoMarket === "national") return `${service} platform`
  return service
}

export function extractNamesakeDomainsFromBrandSearch(
  brandSearchResults: SerpOrganicResult[],
  excludeHost: string | null,
  limit = 3,
): string[] {
  return topCompetitorDomains(brandSearchResults, excludeHost, limit)
}

function brandSearchResults(
  searches: SerpSearchResponse[],
  intake: LevelstackIntakeFormValues,
): SerpOrganicResult[] {
  const bareBrand = intake.primaryBusinessName.trim().toLowerCase()
  const scopedBrand = businessNameForSearch(intake).toLowerCase()

  const brandQueries = searches.filter((s) => {
    const q = s.query.toLowerCase()
    return q === bareBrand || q === scopedBrand
  })

  if (brandQueries.length > 0) {
    return brandQueries.flatMap((s) => s.results)
  }

  return searches[0]?.results ?? []
}

function domainFromIntakeUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null
  try {
    const host = hostnameFromUrl(url.trim())
    return host && !isNonCompetitorHost(host) ? host : null
  } catch {
    return null
  }
}

function titleForDomain(
  results: SerpOrganicResult[],
  domain: string,
): string | undefined {
  const hit = results.find((r) => {
    try {
      return hostnameFromUrl(r.link) === domain
    } catch {
      return false
    }
  })
  return hit?.title
}

export function resolveCompetitorColumns(input: {
  intake: LevelstackIntakeFormValues
  buyerHost: string | null
  serviceSearch: SerpSearchResponse | null
  brandSearches: SerpSearchResponse[]
  categoryPeerSearch: SerpSearchResponse | null
}): {
  columns: CompetitorColumn[]
  mode: CompetitiveComparisonMode
  servicePeerDomains: string[]
} {
  const { intake, buyerHost, serviceSearch, brandSearches, categoryPeerSearch } =
    input
  const limit = 3

  const servicePeerDomains = filterCompetitorDomains(
    serviceSearch
      ? topCompetitorDomains(serviceSearch.results, buyerHost, limit)
      : [],
    buyerHost,
  )

  if (servicePeerDomains.length > 0) {
    const allResults = serviceSearch?.results ?? []
    return {
      columns: servicePeerDomains.map((domain) => ({
        domain,
        source: "service_peer" as const,
        title: titleForDomain(allResults, domain),
      })),
      mode: "service_peer",
      servicePeerDomains,
    }
  }

  const brandResults = brandSearchResults(brandSearches, intake)
  const namesakeDomains = extractNamesakeDomainsFromBrandSearch(
    brandResults,
    buyerHost,
    limit,
  )

  if (namesakeDomains.length > 0) {
    return {
      columns: namesakeDomains.map((domain) => ({
        domain,
        source: "namesake" as const,
        title: titleForDomain(brandResults, domain),
      })),
      mode: "namesake",
      servicePeerDomains,
    }
  }

  const categoryDomains = filterCompetitorDomains(
    categoryPeerSearch
      ? topCompetitorDomains(categoryPeerSearch.results, buyerHost, limit)
      : [],
    buyerHost,
  )

  if (categoryDomains.length > 0) {
    const allResults = categoryPeerSearch?.results ?? []
    return {
      columns: categoryDomains.map((domain) => ({
        domain,
        source: "category_peer" as const,
        title: titleForDomain(allResults, domain),
      })),
      mode: "category_peer",
      servicePeerDomains,
    }
  }

  const intakeDomain = domainFromIntakeUrl(intake.topCompetitorUrl)
  if (intakeDomain && intakeDomain !== buyerHost) {
    return {
      columns: [{ domain: intakeDomain, source: "intake" as const }],
      mode: "mixed",
      servicePeerDomains,
    }
  }

  return { columns: [], mode: "evidence_only", servicePeerDomains }
}

export function formatSerpEvidenceTable(
  results: SerpOrganicResult[],
  limit = 10,
): string {
  return results
    .slice(0, limit)
    .map((r) => {
      let tag = ""
      try {
        const host = hostnameFromUrl(r.link)
        if (host && isNonCompetitorHost(host)) tag = " [directory/platform]"
      } catch {
        // ignore
      }
      return `#${r.position} ${r.title} (${r.link})${tag}`
    })
    .join("; ")
}

export function competitiveSectionLabel(mode: CompetitiveComparisonMode): string {
  switch (mode) {
    case "namesake":
    case "category_peer":
    case "mixed":
      return "Category & namesake comparison"
    case "evidence_only":
      return "Competitive context snapshot"
    default:
      return "Competitive context snapshot"
  }
}
