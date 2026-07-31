import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { ReportTier } from "@/lib/levelstack-plans"
import {
  businessNameForSearch,
  hasMarketLocation,
  marketLocationLabel,
  scopedSearchPhrase,
} from "@/lib/intake/location"
import {
  classificationFromIntake,
  shouldIncludeBbbReputationCheck,
  type BusinessCategorySignals,
} from "@/lib/taxonomy/business-category"

export function priorNamesForSearch(intake: LevelstackIntakeFormValues): string[] {
  return intake.priorBusinessNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0 && n.toLowerCase() !== "none")
    .map((name) =>
      hasMarketLocation(intake) ? scopedSearchPhrase(name, intake) : name,
    )
}

/**
 * Intake `primaryService` is free text and often a verbose, multi-clause phrase
 * (e.g. "SAAS and stand alone products, operational efficiency products").
 * Reduce it to a searchable phrase: first clause, capped word count.
 */
export function normalizeServiceQuery(service: string): string {
  const trimmed = service.trim()
  if (!trimmed) return trimmed
  const firstClause = (trimmed.split(/[;,]/)[0] ?? trimmed).trim() || trimmed
  const words = firstClause.split(/\s+/)
  if (words.length > 6) return words.slice(0, 6).join(" ")
  return firstClause
}

/**
 * The phrase used for service/competitive SERPs. Prefers the buyer's concise
 * `primaryServiceKeywords` (what prospects actually Google) and falls back to a
 * normalized slice of the verbose `primaryService` free-text.
 */
export function serviceSearchTerm(intake: LevelstackIntakeFormValues): string {
  const keywords = intake.primaryServiceKeywords?.trim()
  if (keywords) return normalizeServiceQuery(keywords)
  return normalizeServiceQuery(intake.primaryService)
}

/**
 * True when the service search phrase is product/job-intent (software, platform,
 * SaaS, jobs) rather than a local service-business query. Used to skip the
 * service_peer competitive tier for agencies/consultancies so we fall through
 * to category_peer / namesake instead of promoting job boards and SaaS blogs.
 */
const PRODUCT_INTENT_SERVICE_PATTERN =
  /\bsoftware\b|\bplatform\b|\btools?\b|\btech\s*stack\b|\bjobs?\b|\bemployment\b|\bcareers?\b|\bsaas\b/i

export function isProductIntentServiceQuery(term: string): boolean {
  return PRODUCT_INTENT_SERVICE_PATTERN.test(term.trim())
}

export function serviceMarketQuery(intake: LevelstackIntakeFormValues): string {
  const service = serviceSearchTerm(intake)
  const location = marketLocationLabel(intake)

  if (location && intake.geoMarket === "local") {
    return `${service} ${location}`
  }
  if (intake.geoMarket === "local") {
    return `${service} near me`
  }
  if (intake.geoMarket === "regional") {
    return location ? `${service} ${location}` : `${service} services`
  }
  return service
}

export function brandNameSearchQueries(
  intake: LevelstackIntakeFormValues,
  reportTier: ReportTier = "full_report",
): string[] {
  if (reportTier === "free_snapshot") {
    return [businessNameForSearch(intake)].filter(Boolean)
  }

  const bareBrand = intake.primaryBusinessName.trim()
  const owner = intake.ownerName.trim()
  const ownerQuery =
    owner &&
    owner.toLowerCase() !== bareBrand.toLowerCase() &&
    !/\b(llc|inc|agency|digital|marketing|company|group|services)\b/i.test(owner)
      ? owner
      : null

  return [
    bareBrand,
    businessNameForSearch(intake),
    ...(ownerQuery ? [ownerQuery] : []),
    ...priorNamesForSearch(intake),
  ].filter(Boolean)
}

export function directoryReviewQueries(
  intake: LevelstackIntakeFormValues,
  reportTier: ReportTier = "full_report",
  categorySignals?: BusinessCategorySignals,
): string[] {
  const business = businessNameForSearch(intake)
  const classification = classificationFromIntake(intake, categorySignals)
  const includeBbb = shouldIncludeBbbReputationCheck(classification.id)

  const baseQueries = [
    `${business} reviews`,
    `site:yelp.com ${business}`,
    ...(includeBbb ? [`site:bbb.org ${business}`] : []),
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} complaints`, intake),
  ].filter(Boolean)

  if (reportTier === "free_snapshot") {
    return baseQueries
  }

  return [
    ...baseQueries,
    `site:clutch.co ${business}`,
    `site:g2.com ${business}`,
    `site:capterra.com ${business}`,
    `site:producthunt.com ${business}`,
    `site:crunchbase.com ${business}`,
    `"${business}" ${intake.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`,
  ].filter(Boolean)
}

export function searchFootprintQueries(intake: LevelstackIntakeFormValues): string[] {
  const queries = [
    businessNameForSearch(intake),
    intake.ownerName,
    serviceMarketQuery(intake),
    ...priorNamesForSearch(intake),
  ]
  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
}

export function reputationQueries(
  intake: LevelstackIntakeFormValues,
  categorySignals?: BusinessCategorySignals,
): string[] {
  const business = businessNameForSearch(intake)
  const classification = classificationFromIntake(intake, categorySignals)
  const includeBbb = shouldIncludeBbbReputationCheck(classification.id)

  const queries = [
    `${business} reviews`,
    `${intake.ownerName} reviews`,
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} complaints`, intake),
    `site:yelp.com ${business}`,
    ...(includeBbb ? [`site:bbb.org ${business}`] : []),
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} trustpilot`, intake),
  ]

  for (const name of priorNamesForSearch(intake)) {
    queries.push(`${name} reviews`)
  }

  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
}
