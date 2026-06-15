import type { GbpSignals } from "@/lib/research/gbp"

const INTERNAL_LIMITATION_PATTERNS = [
  /^not fetched yet\.?$/i,
  /^serpapi is not configured/i,
  /^serpapi http/i,
  /^search data unavailable/i,
  /^live google search results were not available/i,
]

export const GBP_NOT_FOUND_VALUE =
  "No confirmed Google Business Profile listing found"

export const GBP_NOT_FOUND_DETAIL =
  "Claim and complete your Google Business Profile so local prospects see accurate hours, reviews, and contact info."

/** Google search result preview text shown under a link. */
export const SNIPPET_COMPARE_UNAVAILABLE =
  "When people search your business name without a city, your site doesn't show on page 1 — so we couldn't check what short description Google would display for you."

export const SNIPPET_COMPARE_SUCCESS =
  "We compared your website's short description to what Google shows under your link in search results."

const LEGACY_JARGON_REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /Could not compare snippets for the unqualified brand search — your site did not rank in top results\.?/i,
    SNIPPET_COMPARE_UNAVAILABLE,
  ],
  [
    /Could not compare your Google snippet — your site did not appear in top results for this query\.?/i,
    SNIPPET_COMPARE_UNAVAILABLE,
  ],
  [
    /We compared your live meta description to Google's snippet for your domain\.?/i,
    SNIPPET_COMPARE_SUCCESS,
  ],
  [
    /Could not compare live meta description to Google snippet\.?/i,
    "We couldn't compare your website description to what Google shows — one or both were missing from our check.",
  ],
  [
    /^Private-window search:/i,
    "Search in a private/incognito browser for:",
  ],
]

export function polishCustomerFindingCopy(text: string): string {
  let result = text.trim()
  for (const [pattern, replacement] of LEGACY_JARGON_REWRITES) {
    result = result.replace(pattern, replacement)
  }
  return result
}

export function isInternalLimitation(text: string | null | undefined): boolean {
  const trimmed = text?.trim() ?? ""
  if (!trimmed) return true
  return INTERNAL_LIMITATION_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function isCustomerFacingFinding(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length < 12) return false
  if (isInternalLimitation(trimmed)) return false
  return true
}

export function customerGbpFindingValue(
  gbp: Pick<GbpSignals, "found" | "title" | "rating" | "reviewCount" | "limitation">,
  businessName: string,
): string {
  if (gbp.found) {
    if (gbp.rating != null) {
      return `${gbp.title ?? businessName} — ${gbp.rating}★ (${gbp.reviewCount ?? "?"} reviews)`
    }
    return gbp.title ?? "Maps listing found"
  }

  if (gbp.limitation && !isInternalLimitation(gbp.limitation)) {
    return GBP_NOT_FOUND_VALUE
  }

  return GBP_NOT_FOUND_VALUE
}

export function customerGbpFindingDetail(
  gbp: Pick<GbpSignals, "found" | "limitation">,
  gbpTerm: string,
): string {
  if (gbp.found) return ""

  const primary = isInternalLimitation(gbp.limitation)
    ? GBP_NOT_FOUND_DETAIL
    : (gbp.limitation ?? GBP_NOT_FOUND_DETAIL)

  return `${primary} Complete your ${gbpTerm} if prospects search local + service terms.`
}
