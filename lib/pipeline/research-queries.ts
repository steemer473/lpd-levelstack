import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import {
  businessNameForSearch,
  hasMarketLocation,
  marketLocationLabel,
  scopedSearchPhrase,
} from "@/lib/intake/location"

export function priorNamesForSearch(intake: LevelstackIntakeFormValues): string[] {
  return intake.priorBusinessNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0 && n.toLowerCase() !== "none")
    .map((name) =>
      hasMarketLocation(intake) ? scopedSearchPhrase(name, intake) : name,
    )
}

export function serviceMarketQuery(intake: LevelstackIntakeFormValues): string {
  const service = intake.primaryService.trim()
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

export function brandNameSearchQueries(intake: LevelstackIntakeFormValues): string[] {
  const bareBrand = intake.primaryBusinessName.trim()
  return [
    bareBrand,
    businessNameForSearch(intake),
    ...priorNamesForSearch(intake),
  ].filter(Boolean)
}

export function directoryReviewQueries(intake: LevelstackIntakeFormValues): string[] {
  const business = businessNameForSearch(intake)
  const domain = intake.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
  return [
    `${business} reviews`,
    `site:yelp.com ${business}`,
    `site:clutch.co ${business}`,
    `site:g2.com ${business}`,
    `site:capterra.com ${business}`,
    `site:producthunt.com ${business}`,
    `site:crunchbase.com ${business}`,
    `"${business}" ${domain}`,
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} complaints`, intake),
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

export function reputationQueries(intake: LevelstackIntakeFormValues): string[] {
  const business = businessNameForSearch(intake)
  const queries = [
    `${business} reviews`,
    `${intake.ownerName} reviews`,
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} complaints`, intake),
    `site:yelp.com ${business}`,
    `site:bbb.org ${business}`,
    scopedSearchPhrase(`${intake.primaryBusinessName.trim()} trustpilot`, intake),
  ]

  for (const name of priorNamesForSearch(intake)) {
    queries.push(`${name} reviews`)
  }

  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
}
