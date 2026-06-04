import type { SerpOrganicResult } from "@/lib/research/serp"

export type ParsedReputationSnippet = {
  rating: number | null
  reviewCount: number | null
  platform: string | null
}

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

export function bestReputationHit(
  results: SerpOrganicResult[],
  query: string,
): { result: SerpOrganicResult; parsed: ParsedReputationSnippet } | null {
  const top = results[0]
  if (!top) return null
  const combined = `${top.title} ${top.snippet}`
  const parsed = parseRatingFromText(combined)
  parsed.platform = parsed.platform ?? platformFromQuery(query)
  return { result: top, parsed }
}
