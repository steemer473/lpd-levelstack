const QUOTA_PATTERNS = [
  /run out of searches/i,
  /quota/i,
  /credit/i,
  /limit exceeded/i,
  /insufficient/i,
  /payment required/i,
  /too many requests/i,
  /rate limit/i,
  /account has been suspended/i,
  /subscription/i,
]

/** Transient provider failures that warrant a same-provider retry-once (P0-1). */
const RETRYABLE_PATTERNS = [
  /internal\s+se\s+server\s+error/i,
  /internal\s+server\s+error/i,
  /\b(timed?\s*out|timeout|aborted|aborterror)\b/i,
  /\b(econnreset|enotfound|econnrefused|etimedout|fetch failed)\b/i,
  /\b(unexpected token|malformed json|invalid json|unexpected end of json)\b/i,
  /\bstatus(?: code)?\s*5\d\d\b/i,
  /\bhttp\s*5\d\d\b/i,
]

export function isProviderQuotaError(
  limitation: string | null | undefined,
  httpStatus?: number,
): boolean {
  if (httpStatus === 402 || httpStatus === 429) return true
  if (!limitation) return false
  return QUOTA_PATTERNS.some((pattern) => pattern.test(limitation))
}

/** Non-quota transient errors: timeout, 5xx, malformed JSON, Google-side hiccups. */
export function isRetryableProviderError(
  limitation: string | null | undefined,
  httpStatus?: number,
): boolean {
  if (httpStatus != null && httpStatus >= 500) return true
  if (!limitation) return false
  if (isProviderQuotaError(limitation, httpStatus)) return false
  return RETRYABLE_PATTERNS.some((pattern) => pattern.test(limitation))
}

export function shouldFailoverOrganic(
  response: { results: unknown[]; limitation: string | null },
  httpStatus?: number,
): boolean {
  return isProviderQuotaError(response.limitation, httpStatus)
}

export function shouldFailoverMaps(
  limitation: string | null | undefined,
  httpStatus?: number,
): boolean {
  return isProviderQuotaError(limitation, httpStatus)
}
