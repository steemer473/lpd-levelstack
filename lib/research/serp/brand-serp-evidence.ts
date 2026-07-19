import { isCompetitorCandidate } from "@/lib/research/serp/competitor-domains"
import { hostnameFromUrl } from "@/lib/research/serp/router"
import type { SerpOrganicResult } from "@/lib/research/serp/types"

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "")
}

function hostsMatch(a: string, b: string): boolean {
  const left = normalizeHost(a)
  const right = normalizeHost(b)
  if (!left || !right) return false
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`)
}

function formatResult(r: SerpOrganicResult): string {
  return `#${r.position} ${r.title} (${r.link})`
}

function mentionsBrand(
  result: SerpOrganicResult,
  brandName: string,
): boolean {
  const brand = brandName.trim().toLowerCase()
  if (brand.length < 4) return false
  const haystack = `${result.title} ${result.snippet ?? ""} ${result.link}`.toLowerCase()
  if (haystack.includes(brand)) return true

  // Require the distinctive core of multi-word brands (drop trailing "digital", "llc", etc.)
  const core = brand
    .replace(/\b(llc|inc|co|company|group|digital|agency|services|service)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return core.length >= 6 && haystack.includes(core)
}

/**
 * Brand-search evidence for customer copy. Prefers the buyer's own pages and
 * only adds other organic hits when they clearly mention the brand (namesakes).
 * Unrelated local co-rankers (e.g. a data-center listing for "Atlanta") are omitted.
 */
export function formatBrandSerpEvidence(
  results: SerpOrganicResult[],
  buyerHost: string | null | undefined,
  brandName: string,
  limit = 3,
): string {
  if (!results.length) return ""

  const own: SerpOrganicResult[] = []
  const brandRelevant: SerpOrganicResult[] = []

  for (const result of results) {
    const host = hostnameFromUrl(result.link)
    if (!host) continue

    if (buyerHost && hostsMatch(host, buyerHost)) {
      own.push(result)
      continue
    }

    if (
      isCompetitorCandidate(host, buyerHost) &&
      mentionsBrand(result, brandName)
    ) {
      brandRelevant.push(result)
    }
  }

  const selected = [...own, ...brandRelevant].slice(0, limit)
  if (selected.length === 0) return ""

  const label =
    own.length > 0 && brandRelevant.length === 0
      ? "Your pages on page 1"
      : "Top brand-relevant results"

  return `${label}: ${selected.map(formatResult).join("; ")}`
}
