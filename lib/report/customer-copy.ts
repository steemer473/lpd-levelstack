import type { GbpSignals } from "@/lib/research/gbp"

/**
 * P0-1: limitation strings are filtered with an allowlist of customer-safe
 * phrases (default hide). `isInternalLimitation` remains an expanded
 * error-shaped denylist for sanitize/defense-in-depth on free-form finding text.
 */

/** Known provider/config/transport error shapes — never show to customers. */
const INTERNAL_LIMITATION_PATTERNS = [
  /^not fetched yet\.?$/i,
  /^serpapi is not configured/i,
  /^serpapi http/i,
  /^searchapi is not configured/i,
  /^searchapi http/i,
  /^dataforseo is not configured/i,
  /^dataforseo not configured/i,
  /^no serp provider configured/i,
  /^no serp providers available/i,
  /^all serp providers failed/i,
  /serpapi/i,
  /searchapi/i,
  /dataforseo/i,
  /^search data unavailable/i,
  /^live google search results were not available/i,
  // Provider/backend passthroughs that omit vendor tokens (e.g. SerpAPI → Google)
  /internal\s+se\s+server\s+error/i,
  /internal\s+server\s+error/i,
  /\b(timed?\s*out|timeout|aborted|aborterror)\b/i,
  /\b(econnreset|enotfound|econnrefused|etimedout|fetch failed)\b/i,
  /\b(unexpected token|malformed json|invalid json|unexpected end of json)\b/i,
  /\bstatus(?: code)?\s*5\d\d\b/i,
  /\bapi[_ ]?key\b/i,
  /\bstack trace\b/i,
]

/**
 * Allowlist: limitation text recognized as intentional customer-facing copy.
 * Anything not matching defaults to hidden / "unable to verify".
 * (Strings already matched by INTERNAL_LIMITATION_PATTERNS are never safe.)
 */
const SAFE_CUSTOMER_LIMITATION_PATTERNS = [
  /^no google maps listing found\b/i,
  /^invalid website url for pagespeed\.?$/i,
  /^pagespeed returned no performance score\.?$/i,
  /^no parseable social urls in intake\b/i,
  /^http \d{3} — profile may block automated access\.?$/i,
  /^could not fetch social profile\.?$/i,
  /^website returned http \d{3}\.?$/i,
  /^could not fetch website\.?$/i,
  /^could not fetch site\.?$/i,
  /^root fetch http \d{3}$/i,
  /^no review-oriented serp snippet for this domain\.?$/i,
]

export const UNABLE_TO_VERIFY_VALUE =
  "Unable to verify this signal from live public data."

export const UNABLE_TO_VERIFY_DETAIL =
  "We couldn't complete this check from live search data. Try regenerating the report shortly."

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

/** True when text matches a known internal/error shape (denylist for free-form copy). */
export function isInternalLimitation(text: string | null | undefined): boolean {
  const trimmed = text?.trim() ?? ""
  if (!trimmed) return true
  return INTERNAL_LIMITATION_PATTERNS.some((pattern) => pattern.test(trimmed))
}

/** True only when limitation text is explicitly allowlisted as customer-safe. */
export function isSafeCustomerLimitation(text: string | null | undefined): boolean {
  const trimmed = text?.trim() ?? ""
  if (!trimmed) return false
  if (isInternalLimitation(trimmed)) return false
  return SAFE_CUSTOMER_LIMITATION_PATTERNS.some((pattern) => pattern.test(trimmed))
}

/**
 * Route every `limitation` field through this before writing customer-facing copy.
 * Default: hide unrecognized / error-shaped text behind unable-to-verify.
 */
export function customerLimitationText(
  limitation: string | null | undefined,
  fallback: string = UNABLE_TO_VERIFY_VALUE,
): string {
  const trimmed = limitation?.trim() ?? ""
  if (!trimmed) return fallback
  if (isSafeCustomerLimitation(trimmed)) {
    return polishCustomerFindingCopy(trimmed)
  }
  return fallback
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

  const primary =
    gbp.limitation && isSafeCustomerLimitation(gbp.limitation)
      ? polishCustomerFindingCopy(gbp.limitation)
      : GBP_NOT_FOUND_DETAIL

  return `${primary} Complete your ${gbpTerm} if prospects search local + service terms.`
}
