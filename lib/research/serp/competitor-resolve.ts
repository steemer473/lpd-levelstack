import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import { serviceSearchTerm } from "@/lib/pipeline/research-queries"
import type { GbpSignals } from "@/lib/research/gbp"
import type { NameCollision } from "@/lib/pipeline/research-types"
import type { SerpOrganicResult, SerpSearchResponse } from "@/lib/research/serp/types"
import {
  isCompetitorCandidate,
  isDirectoryListingTitle,
  isNonCompetitorHost,
  isQualifiedPeerResult,
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
  const service = serviceSearchTerm(intake)

  if (category && location) return `${category} ${location}`
  if (service && location) return `${service} ${location}`
  if (category) return category
  if (intake.geoMarket === "national") return `${service} platform`
  return service
}

/**
 * Generic descriptors that do not establish what a business actually does — used
 * when deriving relevance tokens from a GBP category or service phrase.
 */
const RELEVANCE_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "of",
  "a",
  "an",
  "in",
  "near",
  "services",
  "service",
  "solutions",
  "solution",
  "company",
  "companies",
  "co",
  "llc",
  "inc",
  "corp",
  "group",
  "based",
  "local",
  "best",
  "top",
  "professional",
  "products",
  "product",
])

function significantRelevanceTokens(text: string): string[] {
  const out = new Set<string>()
  for (const word of text.toLowerCase().split(/[\s,./&-]+/)) {
    if (word.length >= 4 && !RELEVANCE_STOPWORDS.has(word)) out.add(word)
  }
  return [...out]
}

/**
 * Tokens describing what the buyer actually does, used to keep only on-vertical
 * service peers. Derived from the GBP category only — Google's authoritative
 * classification of the real business. This is what stops a marketing-ops
 * product (GBP "Marketing agency") from being compared to generic
 * SaaS-development vendors that merely rank for "SaaS …".
 *
 * We deliberately do NOT derive relevance from the buyer's own service phrase: a
 * real competitor's SERP title rarely echoes your service wording, so filtering
 * on it would prune legitimate peers. With no category we have no authoritative
 * signal, so the gate is disabled (returns []) and the host/title gates stand.
 */
export function buyerRelevanceTokens(
  category: string | null | undefined,
): string[] {
  return category ? significantRelevanceTokens(category) : []
}

function resultMatchesRelevance(
  result: SerpOrganicResult,
  tokens: string[],
): boolean {
  // No basis to judge relevance → don't over-prune.
  if (tokens.length === 0) return true
  const host = hostnameFromUrl(result.link) ?? ""
  const haystack = `${result.title} ${result.snippet} ${host}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
  return tokens.some(
    (token) =>
      haystack.includes(token) ||
      (token.length >= 6 && haystack.includes(token.slice(0, 5))),
  )
}

/**
 * Qualified (host + title gate) AND on-vertical (relevance gate) service-peer
 * columns from a service SERP. Empty when page 1 has no real, relevant peers —
 * the caller then falls through to namesake/category.
 */
export function relevantServicePeerColumns(input: {
  serviceSearch: SerpSearchResponse | null
  buyerHost: string | null
  relevanceTokens: string[]
  limit?: number
}): CompetitorColumn[] {
  const { serviceSearch, buyerHost, relevanceTokens, limit = 3 } = input
  if (!serviceSearch) return []

  const columns: CompetitorColumn[] = []
  const seen = new Set<string>()

  for (const result of serviceSearch.results) {
    if (!isQualifiedPeerResult(result, buyerHost)) continue
    if (!resultMatchesRelevance(result, relevanceTokens)) continue
    const host = hostnameFromUrl(result.link)
    if (!host) continue
    const norm = host.toLowerCase().replace(/^www\./, "")
    if (seen.has(norm)) continue
    seen.add(norm)
    columns.push({ domain: norm, source: "service_peer", title: result.title })
    if (columns.length >= limit) break
  }

  return columns
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
  /** GBP category — authoritative signal for service-peer relevance (P1.7.1). */
  buyerCategory?: string | null
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
    buyerCategory = null,
  } = input
  const limit = 3

  const relevanceTokens = buyerRelevanceTokens(buyerCategory)

  const serviceColumns = relevantServicePeerColumns({
    serviceSearch,
    buyerHost,
    relevanceTokens,
    limit,
  })
  const servicePeerDomains = serviceColumns.map((c) => c.domain)

  if (serviceColumns.length > 0) {
    return {
      columns: serviceColumns,
      mode: "service_peer",
      servicePeerDomains,
    }
  }

  // P1.8 — ICP value ordering. LevelStack's buyers are local service
  // businesses, and the funnel's core conversion trigger is "a real competitor
  // ranking above you" (FUNNELS_AND_MARKETING §2; nurture Email 3 names the
  // rival). A locally-relevant category peer (e.g. another agency in the buyer's
  // market) is far more valuable and conversion-driving than a brand-string
  // name-twin. So category peers outrank namesakes here; namesake / brand
  // confusion is demoted to the next tier (and still surfaces in LLM prose).
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
