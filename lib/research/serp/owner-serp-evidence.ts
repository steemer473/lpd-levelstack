import { linkedInProfileMatchesOwner } from "@/lib/research/reputation-parse"
import { hostnameFromUrl, resultsMentionDomain, type SerpOrganicResult } from "@/lib/research/serp"

function normalizePersonSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function textIncludesToken(text: string, token: string): boolean {
  return new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(text)
}

/** True when SERP text plausibly refers to this owner (not a homonym). */
export function ownerSerpResultMatchesSubject(
  result: SerpOrganicResult,
  ownerName: string,
  businessName: string,
  buyerHost?: string | null,
): boolean {
  if (buyerHost) {
    const host = hostnameFromUrl(result.link)
    if (host && resultsMentionDomain([result], buyerHost)) {
      return true
    }
  }

  if (/linkedin\.com\/in\//i.test(result.link)) {
    return linkedInProfileMatchesOwner(result.link, ownerName, businessName)
  }

  const parts = ownerName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 3)
  if (parts.length === 0) return false

  const haystack = `${result.title} ${result.snippet} ${result.link}`
  if (parts.length === 1) {
    return textIncludesToken(haystack, parts[0]!)
  }

  const matchedParts = parts.filter((part) => textIncludesToken(haystack, part))
  if (matchedParts.length < 2) return false

  const slug = normalizePersonSlug(
    result.link.match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1] ?? "",
  )
  if (slug) {
    return parts.every((part) => slug.includes(normalizePersonSlug(part)))
  }

  return matchedParts.length >= 2
}

export function pickOwnerRelevantResults(
  results: SerpOrganicResult[],
  ownerName: string,
  businessName: string,
  buyerHost?: string | null,
  limit = 3,
): SerpOrganicResult[] {
  return results
    .filter((result) =>
      ownerSerpResultMatchesSubject(result, ownerName, businessName, buyerHost),
    )
    .slice(0, limit)
}

export function formatOwnerSearchValue(
  results: SerpOrganicResult[],
  ownerName: string,
  businessName: string,
  buyerHost?: string | null,
): string {
  const relevant = pickOwnerRelevantResults(
    results,
    ownerName,
    businessName,
    buyerHost,
    1,
  )
  if (relevant[0]) {
    return `When someone searches your name, page 1 shows: ${relevant[0].title}`
  }
  if (results.length === 0) {
    return "No organic results captured when searching your owner name."
  }
  return "Page 1 results did not clearly match your name — unrelated homonyms were excluded."
}
