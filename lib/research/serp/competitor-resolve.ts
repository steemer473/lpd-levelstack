import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import { normalizeServiceQuery } from "@/lib/pipeline/research-queries"
import type { GbpSignals } from "@/lib/research/gbp"
import type { NameCollision } from "@/lib/pipeline/research-types"
import type { SerpOrganicResult, SerpSearchResponse } from "@/lib/research/serp/types"
import {
  isCompetitorCandidate,
  isDirectoryListingTitle,
  isNonCompetitorHost,
  qualifiedPeerDomains,
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
  const service = normalizeServiceQuery(intake.primaryService)

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

const COMMON_BRAND_TOKENS = new Set([
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
  "local",
  "professional",
  "online",
  "media",
  "studio",
  "creative",
  "the",
  "and",
  "llc",
  "inc",
  "corp",
])

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "")
}

function normalizeAlnum(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function rootLabel(host: string): string {
  return normalizeHost(host).split(".")[0] ?? ""
}

/** True when a candidate host is the buyer's own brand on a different TLD (squat / alt domain). */
export function isBuyerRootSquat(
  candidateHost: string,
  buyerHost: string | null | undefined,
): boolean {
  if (!buyerHost) return false
  const candidateRoot = rootLabel(candidateHost)
  const buyerRoot = rootLabel(buyerHost)
  if (candidateRoot.length < 4 || buyerRoot.length < 4) return false
  if (normalizeHost(candidateHost) === normalizeHost(buyerHost)) return true
  return candidateRoot === buyerRoot
}

/** Significant brand tokens (length >= 4, not generic descriptors). */
export function brandSignificantTokens(name: string): string[] {
  const tokens = new Set<string>()
  for (const word of name.toLowerCase().split(/[\s,./-]+/)) {
    if (word.length >= 4 && !COMMON_BRAND_TOKENS.has(word)) {
      tokens.add(word)
    }
  }
  return [...tokens]
}

function brandTokenMatchCount(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0
  const normalized = normalizeAlnum(text)
  return tokens.filter((token) => normalized.includes(token)).length
}

type ScoredNamesake = { domain: string; title?: string; score: number }

/**
 * Rank namesake / brand-confusion competitors by brand-token overlap, preferring
 * detected name collisions (typed) over raw brand-search order. Excludes buyer
 * squats and zero-overlap noise so the grid names real confusion brands.
 */
export function resolveNamesakeColumns(input: {
  businessName: string
  buyerHost: string | null
  brandResults: SerpOrganicResult[]
  collisions: NameCollision[]
  limit?: number
}): CompetitorColumn[] {
  const { businessName, buyerHost, brandResults, collisions, limit = 3 } = input
  const tokens = brandSignificantTokens(businessName)
  const byDomain = new Map<string, ScoredNamesake>()

  const consider = (host: string | null, title: string | undefined, base: number) => {
    if (!host) return
    const norm = normalizeHost(host)
    if (!isCompetitorCandidate(norm, buyerHost)) return
    if (isBuyerRootSquat(norm, buyerHost)) return
    const matches = brandTokenMatchCount(`${title ?? ""} ${norm}`, tokens)
    if (matches === 0) return
    const score = base + matches * 2
    const existing = byDomain.get(norm)
    if (!existing || score > existing.score) {
      byDomain.set(norm, {
        domain: norm,
        title: title ?? existing?.title,
        score,
      })
    }
  }

  for (const collision of collisions) {
    const host = hostnameFromUrl(collision.link)
    const typeWeight =
      collision.type === "direct_competitor"
        ? 4
        : collision.type === "adjacent_brand"
          ? 2
          : 0
    consider(host, collision.title, 3 + typeWeight)
  }

  brandResults.forEach((result, index) => {
    const host = hostnameFromUrl(result.link)
    consider(host, result.title, Math.max(0, 3 - index * 0.5))
  })

  return [...byDomain.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => ({
      domain: candidate.domain,
      source: "namesake" as const,
      title: candidate.title,
    }))
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
  nameCollisions?: NameCollision[]
}): {
  columns: CompetitorColumn[]
  mode: CompetitiveComparisonMode
  servicePeerDomains: string[]
} {
  const {
    intake,
    buyerHost,
    serviceSearch,
    brandSearches,
    categoryPeerSearch,
    nameCollisions = [],
  } = input
  const limit = 3

  const servicePeerDomains = serviceSearch
    ? qualifiedPeerDomains(serviceSearch.results, buyerHost, limit)
    : []

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
  const namesakeColumns = resolveNamesakeColumns({
    businessName: intake.primaryBusinessName,
    buyerHost,
    brandResults,
    collisions: nameCollisions,
    limit,
  })

  if (namesakeColumns.length > 0) {
    return {
      columns: namesakeColumns,
      mode: "namesake",
      servicePeerDomains,
    }
  }

  const categoryDomains = categoryPeerSearch
    ? qualifiedPeerDomains(categoryPeerSearch.results, buyerHost, limit)
    : []

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
        if (
          (host && isNonCompetitorHost(host)) ||
          isDirectoryListingTitle(r.title)
        ) {
          tag = " [directory/platform]"
        }
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
