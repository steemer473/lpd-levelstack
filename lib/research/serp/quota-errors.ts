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

export function isProviderQuotaError(
  limitation: string | null | undefined,
  httpStatus?: number,
): boolean {
  if (httpStatus === 402 || httpStatus === 429) return true
  if (!limitation) return false
  return QUOTA_PATTERNS.some((pattern) => pattern.test(limitation))
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
