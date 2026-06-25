import type { ReportTier } from "@/lib/levelstack-plans"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch } from "@/lib/intake/location"
import {
  analyzeSubdomains,
  detectInfrastructureFromSerp,
  detectNameCollisionsFromSerp,
  enumerateSubdomains,
} from "@/lib/research/domain-analysis"
import { fetchAboutAndFooterSignals } from "@/lib/research/about-footer"
import { fetchBrandMentions } from "@/lib/research/brand-mentions"
import { fetchCompetitorSnapshots } from "@/lib/research/competitor"
import { mapsLocationHint } from "@/lib/intake/location"
import { fetchGbpSignals } from "@/lib/research/gbp"
import { fetchPageSpeedSignals } from "@/lib/research/pagespeed"
import {
  googleOrganicSearch,
  hostnameFromUrl,
  runSerpQueries,
  buyerRelevanceTokens,
  categoryPeerQuery,
  relevantServicePeerColumns,
  resolveCompetitorColumns,
} from "@/lib/research/serp"
import { searchSocialPlatforms } from "@/lib/research/social-search"
import { fetchSocialProfileSignals } from "@/lib/research/social"
import {
  fetchWebsiteExtendedSignals,
  fetchWebsiteSignals,
} from "@/lib/research/website"
import type { AuditOperationId } from "@/lib/pipeline/constants"
import {
  directoryReviewQueries,
  brandNameSearchQueries,
  serviceMarketQuery,
} from "@/lib/pipeline/research-queries"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

export type OperationCollector = (
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  options: CollectResearchOptions,
) => Promise<void>

export type CollectResearchOptions = {
  reportTier: ReportTier
}

/** Op 1 — bare brand name search */
export async function collectBrandNameSearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  { reportTier }: CollectResearchOptions,
): Promise<void> {
  bundle.searchFootprint.searches = await runSerpQueries(
    brandNameSearchQueries(intake, reportTier),
  )

  const allResults = bundle.searchFootprint.searches.flatMap((s) => s.results)
  const host = hostnameFromUrl(intake.websiteUrl)
  bundle.nameCollisions = detectNameCollisionsFromSerp(
    intake.primaryBusinessName,
    host,
    allResults,
  )
  bundle.infrastructureLeakage.instances = detectInfrastructureFromSerp(allResults)
}

/** Op 2 — primary domain fetch */
export async function collectPrimaryDomainFetch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  _options: CollectResearchOptions,
): Promise<void> {
  const [website, extended] = await Promise.all([
    fetchWebsiteSignals(intake.websiteUrl),
    fetchWebsiteExtendedSignals(intake.websiteUrl),
  ])

  bundle.primaryDomain.website = website
  bundle.primaryDomain.extended = extended
  bundle.digitalPresence.website = website
  bundle.digitalPresence.websiteExtended = extended
  bundle.revenueFunnel.website = website

  const host = hostnameFromUrl(intake.websiteUrl)
  if (host) {
    const subdomains = await enumerateSubdomains(host)
    const allSerp = bundle.searchFootprint.searches.flatMap((s) => s.results)
    bundle.subdomainExposure.subdomains = analyzeSubdomains(subdomains, allSerp)
  }
}

/** Op 3 — social media search */
export async function collectSocialMediaSearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  { reportTier }: CollectResearchOptions,
): Promise<void> {
  const host = hostnameFromUrl(intake.websiteUrl) ?? intake.websiteUrl
  bundle.socialSearch.platforms = await searchSocialPlatforms(
    businessNameForSearch(intake),
    host,
    reportTier,
  )
}

/** Op 4 — about / footer fetch */
export async function collectAboutFooterFetch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  _options: CollectResearchOptions,
): Promise<void> {
  bundle.aboutFooter = await fetchAboutAndFooterSignals(intake.websiteUrl)
}

/** Op 5 — directory & review search */
export async function collectDirectoryReviewSearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  { reportTier }: CollectResearchOptions,
): Promise<void> {
  bundle.reputation.searches = await runSerpQueries(
    directoryReviewQueries(intake, reportTier),
  )
}

/** Op 6 — brand mention search */
export async function collectBrandMentionSearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  _options: CollectResearchOptions,
): Promise<void> {
  const host = hostnameFromUrl(intake.websiteUrl)
  bundle.brandMentions = await fetchBrandMentions(
    businessNameForSearch(intake),
    intake.websiteUrl,
    host,
  )
}

/** Paid-tier extras: PageSpeed, GBP, social from intake, competitive context */
export async function collectPaidEnrichment(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  _options: CollectResearchOptions = { reportTier: "full_report" },
): Promise<void> {
  const [pageSpeed, gbp, social] = await Promise.all([
    fetchPageSpeedSignals(intake.websiteUrl),
    fetchGbpSignals(intake.primaryBusinessName, mapsLocationHint(intake)),
    fetchSocialProfileSignals(intake.socialProfiles),
  ])

  bundle.digitalPresence.pageSpeed = pageSpeed
  bundle.digitalPresence.gbp = gbp
  bundle.digitalPresence.social = social
  bundle.digitalPresence.socialProfilesFromIntake = intake.socialProfiles
  bundle.revenueFunnel.pageSpeed = pageSpeed

  bundle.revenueFunnel.intakeNotes = [
    `Offer: ${intake.primaryService} at ${intake.pricePoint}`,
    `Ad spend: ${intake.hasActiveAdSpend === "yes" ? `${intake.adPlatforms ?? "yes"} ~${intake.adBudget ?? "?"}` : "none"}`,
    `Email list: ~${intake.emailListSize}`,
    `Purchase motivation: ${intake.purchaseMotivation}`,
  ].join("\n")

  const q = serviceMarketQuery(intake)
  const serviceSearch = await googleOrganicSearch(q)
  const buyerHost = hostnameFromUrl(intake.websiteUrl)

  // P1.7.1: gate on *relevant* peers — qualified (not directories/listicles)
  // AND on-vertical for the buyer's GBP category. The category fallback fires
  // whenever page 1 has no real, on-vertical peer (all aggregators, or peers
  // from a different vertical), not just when it is empty.
  const relevanceTokens = buyerRelevanceTokens(gbp.category)
  const relevantPeers = relevantServicePeerColumns({
    serviceSearch,
    buyerHost,
    relevanceTokens,
    limit: 3,
  })

  let categoryPeerSearch = null
  if (relevantPeers.length === 0) {
    const categoryQuery = categoryPeerQuery(intake, gbp)
    categoryPeerSearch = await googleOrganicSearch(categoryQuery)
  }

  const { columns, mode, servicePeerDomains: filteredServicePeers } =
    resolveCompetitorColumns({
      intake,
      buyerHost,
      serviceSearch,
      brandSearches: bundle.searchFootprint.searches,
      categoryPeerSearch,
      nameCollisions: bundle.nameCollisions.collisions,
      buyerCategory: gbp.category,
    })

  const snapshotDomains = columns.map((c) => c.domain)

  bundle.competitiveContext.serviceSearch = serviceSearch
  bundle.competitiveContext.categoryPeerSearch = categoryPeerSearch
  bundle.competitiveContext.buyerHostname = buyerHost
  bundle.competitiveContext.competitorDomains = filteredServicePeers
  bundle.competitiveContext.competitorColumns = columns
  bundle.competitiveContext.comparisonMode = mode
  bundle.competitiveContext.competitorSnapshots =
    snapshotDomains.length > 0
      ? await fetchCompetitorSnapshots(snapshotDomains)
      : []
}

export const OPERATION_COLLECTORS: Record<AuditOperationId, OperationCollector> = {
  brand_name_search: collectBrandNameSearch,
  primary_domain_fetch: collectPrimaryDomainFetch,
  social_media_search: collectSocialMediaSearch,
  about_footer_fetch: collectAboutFooterFetch,
  directory_review_search: collectDirectoryReviewSearch,
  brand_mention_search: collectBrandMentionSearch,
}

export async function runAuditOperations(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  operationIds: AuditOperationId[],
  options: CollectResearchOptions,
): Promise<void> {
  for (const opId of operationIds) {
    await OPERATION_COLLECTORS[opId](intake, bundle, options)
  }
}

/** @deprecated Use OPERATION_COLLECTORS — kept for tests */
export const RESEARCH_COLLECTORS = OPERATION_COLLECTORS

export async function collectAllResearch(
  intake: LevelstackIntakeFormValues,
): Promise<ResearchBundle> {
  const { emptyResearchBundle } = await import("@/lib/pipeline/research-types")
  const { FULL_TIER_OPERATION_IDS } = await import("@/lib/pipeline/constants")
  const bundle = emptyResearchBundle()
  bundle.digitalPresence.website.url = intake.websiteUrl
  bundle.revenueFunnel.website.url = intake.websiteUrl

  await runAuditOperations(intake, bundle, [...FULL_TIER_OPERATION_IDS], {
    reportTier: "full_report",
  })
  await collectPaidEnrichment(intake, bundle)
  return bundle
}
