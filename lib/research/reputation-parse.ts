import type { SerpOrganicResult } from "@/lib/research/serp"
import { hostnameFromUrl } from "@/lib/research/serp"

export type ParsedReputationSnippet = {
  rating: number | null
  reviewCount: number | null
  platform: string | null
}

const GENERIC_DIRECTORY_LISTING_PATTERN =
  /\bbest .+ near\b|\btop \d+\b|\bagencies?\ near\b|\bcompanies?\ in\b|\bfind .+ near\b|\bnear [^,]+,\s*[A-Z]{2}\b/i

const REVIEW_PLATFORM_PATTERN =
  /yelp\.com|google\.com\/maps|maps\.google|facebook\.com|bbb\.org|trustpilot\.com|g2\.com|capterra\.com|clutch\.co|producthunt\.com/i

const PLATFORM_SEARCH_URL_PATTERN =
  /yelp\.com\/search\b|linkedin\.com\/search\b|google\.com\/search\b|facebook\.com\/search\b|bing\.com\/search\b/i

/** Indexed complaint *about* the subject — not a generic "file a complaint" portal. */
const COMPLAINT_ABOUT_SUBJECT_PATTERN =
  /complaints?\s+(against|about|regarding|on)|filed\s+against|scam|fraud|rip-?off|lawsuit|class action|negative review|1\s*star|unsatisfied customer|refund denied|investigation into|consumeraffairs\.com\/.*\/complaints/i

const GENERIC_COMPLAINT_PORTAL_PATTERN =
  /consumer-complaint-form|how-do-i-file|file-a-complaint|submit-a-complaint|resolve-your-dispute|lodge a complaint|report a business to|complaint form|how to file a complaint|file a consumer complaint|attorney general.*complaint|consumer\.georgia\.gov/i

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
  else if (/clutch/i.test(text)) platform = "Clutch"
  else if (/\bg2\b/i.test(text)) platform = "G2"
  else if (/capterra/i.test(text)) platform = "Capterra"
  else if (/google/i.test(text)) platform = "Google"

  return { rating, reviewCount, platform }
}

export function platformFromQuery(query: string): string | null {
  if (/yelp/i.test(query)) return "Yelp"
  if (/bbb/i.test(query)) return "BBB"
  if (/trustpilot/i.test(query)) return "Trustpilot"
  if (/clutch/i.test(query)) return "Clutch"
  if (/g2\.com|\bg2\b/i.test(query)) return "G2"
  if (/capterra/i.test(query)) return "Capterra"
  return null
}

/** Clutch / G2 / Capterra are clustered into one Reputation finding (P2-4 / OD-13). */
export function isB2bReviewDirectoryPlatform(
  platform: string | null,
): boolean {
  return platform === "Clutch" || platform === "G2" || platform === "Capterra"
}

export function isComplaintOrientedQuery(query: string): boolean {
  return /\bcomplaints?\b/i.test(query)
}

/** Government / how-to pages — not evidence of a complaint against the subject. */
export function isGenericComplaintPortalResult(result: SerpOrganicResult): boolean {
  const combined = `${result.title} ${result.snippet} ${result.link}`.toLowerCase()
  return GENERIC_COMPLAINT_PORTAL_PATTERN.test(combined)
}

function ownerNameMatchesText(ownerName: string, text: string): boolean {
  const parts = ownerName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 3)
  if (parts.length === 0) return false
  if (parts.length === 1) {
    return textIncludesToken(text, parts[0]!)
  }
  return parts.every((part) => textIncludesToken(text, part))
}

/**
 * Stricter than general reputation matching — a result counts as a complaint
 * against the subject only when it names them and reads as negative indexed content,
 * not a generic portal or a namesake that shares tokens like "level" or "play".
 */
export function isSubjectComplaintSerpResult(
  result: SerpOrganicResult,
  businessName: string,
  ownerName: string,
  buyerHost?: string | null,
): boolean {
  if (isPlatformSearchResultsPage(result.link)) return false
  if (isGenericDirectoryListing(result.title)) return false
  if (isGenericComplaintPortalResult(result)) return false
  if (buyerHost && isOwnDomainResult(result, buyerHost)) return false

  const combined = `${result.title} ${result.snippet} ${result.link}`
  const business = businessName.trim()
  const businessLower = business.toLowerCase()

  const namesSubject =
    (business.length >= 8 && combined.toLowerCase().includes(businessLower)) ||
    ownerNameMatchesText(ownerName, combined)

  if (!namesSubject) return false

  if (/consumeraffairs\.com/i.test(result.link)) {
    return COMPLAINT_ABOUT_SUBJECT_PATTERN.test(combined)
  }

  if (/bbb\.org/i.test(result.link) && /complaint/i.test(combined)) {
    return reviewPlatformListingMatchesBusiness(
      result,
      businessName,
      buyerHost,
      ownerName,
    )
  }

  return COMPLAINT_ABOUT_SUBJECT_PATTERN.test(combined)
}

export function isReviewPlatformUrl(link: string): boolean {
  return REVIEW_PLATFORM_PATTERN.test(link)
}

/** Generic platform search pages — never a subject-specific review listing. */
export function isPlatformSearchResultsPage(link: string): boolean {
  return PLATFORM_SEARCH_URL_PATTERN.test(link.trim())
}

/** A third-party review listing URL — not a search page, LinkedIn profile, or buyer site. */
export function isVerifiedThirdPartyReviewListing(link: string): boolean {
  if (!link.trim() || isPlatformSearchResultsPage(link)) return false
  const lower = link.toLowerCase()
  if (/linkedin\.com\/in\//i.test(lower)) return false
  return (
    /yelp\.com\/biz\//i.test(lower) ||
    /trustpilot\.com\/review\//i.test(lower) ||
    /bbb\.org\/.*\/profile\//i.test(lower) ||
    /clutch\.co\/profile\//i.test(lower) ||
    /g2\.com\/products\//i.test(lower) ||
    /capterra\.com\/p\//i.test(lower) ||
    /google\.com\/maps/i.test(lower) ||
    /maps\.google/i.test(lower)
  )
}

function normalizePersonSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function ownerNameLooksLikeBusiness(
  ownerName: string,
  businessName: string,
): boolean {
  const owner = ownerName.trim().toLowerCase()
  const business = businessName.trim().toLowerCase()
  if (!owner || !business) return false
  if (owner === business) return true
  return /\b(llc|inc|agency|digital|marketing|company|group|services)\b/i.test(
    owner,
  )
}

/** LinkedIn /in/ profiles must match the intake owner name — not a homonym recruiter. */
export function linkedInProfileMatchesOwner(
  link: string,
  ownerName: string,
  businessName: string,
): boolean {
  const match = link.match(/linkedin\.com\/in\/([^/?#]+)/i)
  if (!match?.[1]) return true
  if (ownerNameLooksLikeBusiness(ownerName, businessName)) return false

  const slug = normalizePersonSlug(match[1])
  const parts = ownerName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length >= 3)
  if (parts.length === 0) return false
  return parts.every((part) => slug.includes(normalizePersonSlug(part)))
}

export function isOwnDomainResult(
  result: SerpOrganicResult,
  buyerHost: string | null | undefined,
): boolean {
  if (!buyerHost) return false
  const host = buyerHost.toLowerCase().replace(/^www\./, "")
  const linkHost = hostnameFromUrl(result.link)?.toLowerCase()
  if (linkHost) {
    return linkHost === host || linkHost.endsWith(`.${host}`)
  }
  return result.link.toLowerCase().includes(host)
}

export function formatReputationQueryLabel(query: string): string {
  const platform = platformFromQuery(query)
  if (platform) return `${platform} visibility`
  if (/complaints?/i.test(query)) return "Complaint-oriented search"
  const trimmed = query.replace(/\s+reviews?$/i, "").trim()
  const subject = trimmed.length > 42 ? `${trimmed.slice(0, 39)}…` : trimmed
  return `Review search: ${subject}`
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function textIncludesToken(text: string, token: string): boolean {
  return new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(text)
}

function countMatchingSignificantTokens(
  text: string,
  businessName: string,
  ownerName: string,
): number {
  return significantNameTokens(businessName, ownerName).filter((token) =>
    textIncludesToken(text, token),
  ).length
}

function normalizeHost(value: string): string {
  return value.toLowerCase().replace(/^www\./, "")
}

function hostsRelate(a: string, b: string): boolean {
  const left = normalizeHost(a)
  const right = normalizeHost(b)
  if (!left || !right) return false
  if (left === right) return true
  const leftRoot = left.split(".")[0] ?? left
  const rightRoot = right.split(".")[0] ?? right
  return left.includes(right) || right.includes(left) || leftRoot.includes(rightRoot) || rightRoot.includes(leftRoot)
}

function slugTokensMatchBusiness(slug: string, businessName: string): boolean {
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const tokens = significantNameTokens(businessName, "")
  if (tokens.length === 0) return false
  const matched = tokens.filter((token) => normalizedSlug.includes(token))
  if (tokens.length === 1) return matched.length === 1
  return matched.length >= 2
}

/** Review platform URLs must point at the subject business, not a namesake company. */
export function reviewPlatformListingMatchesBusiness(
  result: SerpOrganicResult,
  businessName: string,
  buyerHost?: string | null,
  ownerName = "",
): boolean {
  if (isPlatformSearchResultsPage(result.link)) return false

  const link = result.link.toLowerCase()
  if (/linkedin\.com\/in\//i.test(link)) {
    return linkedInProfileMatchesOwner(result.link, ownerName, businessName)
  }

  if (!isReviewPlatformUrl(result.link)) return false
  const buyer = buyerHost ? normalizeHost(buyerHost) : null

  const trustpilotMatch = link.match(/trustpilot\.com\/review\/([^/?#]+)/i)
  if (trustpilotMatch?.[1]) {
    const reviewedHost = normalizeHost(trustpilotMatch[1])
    if (buyer && hostsRelate(reviewedHost, buyer)) return true
    return slugTokensMatchBusiness(reviewedHost, businessName)
  }

  const yelpMatch = link.match(/yelp\.com\/biz\/([^/?#]+)/i)
  if (yelpMatch?.[1]) {
    const slug = yelpMatch[1]
    if (slugTokensMatchBusiness(slug, businessName)) return true
    if (buyer) {
      const buyerRoot = buyer.split(".")[0] ?? buyer
      return slug.includes(buyerRoot.replace(/[^a-z0-9]+/g, ""))
    }
    return false
  }

  const bbbMatch = link.match(/bbb\.org\/[^/]+\/([^/?#]+)/i)
  if (bbbMatch?.[1]) {
    return slugTokensMatchBusiness(bbbMatch[1], businessName)
  }

  const combined = `${result.title} ${result.snippet}`.toLowerCase()
  const business = businessName.trim().toLowerCase()
  if (business.length >= 8 && combined.includes(business)) return true

  return countMatchingSignificantTokens(combined, businessName, "") >= 2
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

  const business = businessName.trim().toLowerCase()
  if (business.length >= 8 && lower.includes(business)) return true

  const owner = ownerName.trim().toLowerCase()
  if (owner.length >= 5 && ownerNameMatchesText(ownerName, text)) return true

  // Short brands only: require distinctive token overlap (no loose "level"+"play" alone).
  const tokens = significantNameTokens(businessName, ownerName)
  if (tokens.length === 0) return false

  const matchCount = countMatchingSignificantTokens(lower, businessName, ownerName)
  if (tokens.length === 1) {
    return matchCount === 1
  }
  return matchCount >= Math.min(3, tokens.length)
}

export function isSubjectReputationSerpResult(
  result: SerpOrganicResult,
  businessName: string,
  ownerName: string,
  buyerHost?: string | null,
): boolean {
  if (isPlatformSearchResultsPage(result.link)) return false
  if (isGenericDirectoryListing(result.title)) return false
  if (isGenericDirectoryListing(result.link)) return false

  if (
    !isSubjectReputationText(
      `${result.title} ${result.snippet} ${result.link}`,
      businessName,
      ownerName,
    )
  ) {
    return false
  }

  if (buyerHost && isOwnDomainResult(result, buyerHost)) {
    return true
  }

  return reviewPlatformListingMatchesBusiness(
    result,
    businessName,
    buyerHost,
    ownerName,
  )
}

export type ReputationHitContext = {
  businessName: string
  ownerName: string
  buyerHost?: string | null
}

function rankReputationCandidates(
  results: SerpOrganicResult[],
): SerpOrganicResult[] {
  return [...results].sort((a, b) => {
    const aPlatform = isReviewPlatformUrl(a.link) ? 0 : 1
    const bPlatform = isReviewPlatformUrl(b.link) ? 0 : 1
    if (aPlatform !== bPlatform) return aPlatform - bPlatform
    return a.position - b.position
  })
}

export function bestReputationHit(
  results: SerpOrganicResult[],
  query: string,
  context?: ReputationHitContext,
): { result: SerpOrganicResult; parsed: ParsedReputationSnippet } | null {
  const complaintQuery = isComplaintOrientedQuery(query)
  let candidates = context
    ? results.filter((result) =>
        complaintQuery
          ? isSubjectComplaintSerpResult(
              result,
              context.businessName,
              context.ownerName,
              context.buyerHost,
            )
          : isSubjectReputationSerpResult(
              result,
              context.businessName,
              context.ownerName,
              context.buyerHost,
            ),
      )
    : results

  if (context?.buyerHost) {
    candidates = candidates.filter(
      (result) => !isOwnDomainResult(result, context.buyerHost),
    )
  }

  const top = rankReputationCandidates(candidates)[0]
  if (!top) return null

  const combined = `${top.title} ${top.snippet}`
  const parsed = parseRatingFromText(combined)
  parsed.platform =
    parsed.platform ??
    platformFromQuery(query) ??
    (isReviewPlatformUrl(top.link) ? platformFromLink(top.link) : null)
  return { result: top, parsed }
}

export function findOwnSiteReputationResult(
  results: SerpOrganicResult[],
  context: ReputationHitContext,
): SerpOrganicResult | null {
  if (!context.buyerHost) return null
  return (
    results.find(
      (result) =>
        isSubjectReputationSerpResult(
          result,
          context.businessName,
          context.ownerName,
          context.buyerHost,
        ) && isOwnDomainResult(result, context.buyerHost),
    ) ?? null
  )
}

function platformFromLink(link: string): string | null {
  if (/yelp/i.test(link)) return "Yelp"
  if (/bbb/i.test(link)) return "BBB"
  if (/trustpilot/i.test(link)) return "Trustpilot"
  if (/google/i.test(link)) return "Google"
  return null
}
