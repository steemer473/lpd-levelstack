import type { SerpOrganicResult } from "@/lib/research/serp"

export type ParsedReputationSnippet = {
  rating: number | null
  reviewCount: number | null
  platform: string | null
}

const GENERIC_DIRECTORY_LISTING_PATTERN =
  /\bbest .+ near\b|\btop \d+\b|\bagencies?\ near\b|\bcompanies?\ in\b|\bfind .+ near\b|\bnear [^,]+,\s*[A-Z]{2}\b/i

const COMMON_NAME_TOKENS = new Set([
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
  "llc",
  "inc",
  "the",
  "and",
  "near",
])

export function parseRatingFromText(text: string): ParsedReputationSnippet {
  const ratingMatch = text.match(/(\d(?:\.\d)?)\s*(?:out of 5|\/5|★|stars?)/i)
  const starCount = (text.match(/★/g) ?? []).length
  const rating =
    ratingMatch?.[1] != null
      ? Number.parseFloat(ratingMatch[1])
      : starCount >= 1 && starCount <= 5
        ? starCount
        : null

  const reviewMatch = text.replace(/,/g, "").match(/(\d{1,6})\s*reviews?/i)
  const reviewCount = reviewMatch?.[1]
    ? Number.parseInt(reviewMatch[1], 10)
    : null

  let platform: string | null = null
  if (/yelp/i.test(text)) platform = "Yelp"
  else if (/bbb/i.test(text)) platform = "BBB"
  else if (/trustpilot/i.test(text)) platform = "Trustpilot"
  else if (/google/i.test(text)) platform = "Google"

  return { rating, reviewCount, platform }
}

export function platformFromQuery(query: string): string | null {
  if (/yelp/i.test(query)) return "Yelp"
  if (/bbb/i.test(query)) return "BBB"
  if (/trustpilot/i.test(query)) return "Trustpilot"
  return null
}

function significantNameTokens(...names: string[]): string[] {
  const tokens = new Set<string>()
  for (const name of names) {
    for (const word of name.toLowerCase().split(/[\s,./-]+/)) {
      if (word.length >= 4 && !COMMON_NAME_TOKENS.has(word)) {
        tokens.add(word)
      }
    }
  }
  return [...tokens]
}

export function isGenericDirectoryListing(value: string): boolean {
  return GENERIC_DIRECTORY_LISTING_PATTERN.test(value.trim())
}

/** True when text reflects the subject business, not unrelated SERP noise. */
export function isSubjectReputationText(
  text: string,
  businessName: string,
  ownerName: string,
): boolean {
  const lower = text.toLowerCase()

  if (
    /complaint|unclaimed|no platform-specific|mixed review|not captured|review snippet/i.test(
      lower,
    )
  ) {
    return true
  }

  const business = businessName.trim().toLowerCase()
  if (business.length >= 8 && lower.includes(business)) return true

  const owner = ownerName.trim().toLowerCase()
  if (owner.length >= 5 && lower.includes(owner)) return true

  return significantNameTokens(businessName, ownerName).some((token) =>
    lower.includes(token),
  )
}

export function isSubjectReputationSerpResult(
  result: SerpOrganicResult,
  businessName: string,
  ownerName: string,
): boolean {
  if (isGenericDirectoryListing(result.title)) return false

  return isSubjectReputationText(
    `${result.title} ${result.snippet} ${result.link}`,
    businessName,
    ownerName,
  )
}

export type ReputationHitContext = {
  businessName: string
  ownerName: string
}

export function bestReputationHit(
  results: SerpOrganicResult[],
  query: string,
  context?: ReputationHitContext,
): { result: SerpOrganicResult; parsed: ParsedReputationSnippet } | null {
  const candidates = context
    ? results.filter((result) =>
        isSubjectReputationSerpResult(
          result,
          context.businessName,
          context.ownerName,
        ),
      )
    : results

  const top = candidates[0]
  if (!top) return null

  const combined = `${top.title} ${top.snippet}`
  const parsed = parseRatingFromText(combined)
  parsed.platform = parsed.platform ?? platformFromQuery(query)
  return { result: top, parsed }
}
