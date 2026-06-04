import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { fetchCompetitorSnapshots } from "@/lib/research/competitor"
import { mapsLocationHint } from "@/lib/intake/location"
import { fetchGbpSignals } from "@/lib/research/gbp"
import { fetchPageSpeedSignals } from "@/lib/research/pagespeed"
import {
  googleOrganicSearch,
  hostnameFromUrl,
  runSerpQueries,
  topCompetitorDomains,
} from "@/lib/research/serp"
import { fetchSocialProfileSignals } from "@/lib/research/social"
import { fetchWebsiteSignals } from "@/lib/research/website"
import type { PipelineStepId } from "@/lib/pipeline/constants"
import {
  reputationQueries,
  searchFootprintQueries,
  serviceMarketQuery,
} from "@/lib/pipeline/research-queries"
import {
  emptyResearchBundle,
  type ResearchBundle,
} from "@/lib/pipeline/research-types"

export type ResearchCollector = (
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
) => Promise<void>

export async function collectSearchFootprint(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<void> {
  bundle.searchFootprint.searches = await runSerpQueries(
    searchFootprintQueries(intake),
  )
}

export async function collectReputation(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<void> {
  bundle.reputation.searches = await runSerpQueries(reputationQueries(intake))
}

export async function collectDigitalPresence(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<void> {
  const [website, pageSpeed, gbp, social] = await Promise.all([
    fetchWebsiteSignals(intake.websiteUrl),
    fetchPageSpeedSignals(intake.websiteUrl),
    fetchGbpSignals(intake.primaryBusinessName, mapsLocationHint(intake)),
    fetchSocialProfileSignals(intake.socialProfiles),
  ])

  bundle.digitalPresence.website = website
  bundle.digitalPresence.pageSpeed = pageSpeed
  bundle.digitalPresence.gbp = gbp
  bundle.digitalPresence.social = social
  bundle.digitalPresence.socialProfilesFromIntake = intake.socialProfiles
}

export async function collectRevenueFunnel(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<void> {
  bundle.revenueFunnel.website = bundle.digitalPresence.website.url
    ? bundle.digitalPresence.website
    : await fetchWebsiteSignals(intake.websiteUrl)

  bundle.revenueFunnel.pageSpeed = bundle.digitalPresence.pageSpeed

  bundle.revenueFunnel.intakeNotes = [
    `Offer: ${intake.primaryService} at ${intake.pricePoint}`,
    `Ad spend: ${intake.hasActiveAdSpend === "yes" ? `${intake.adPlatforms ?? "yes"} ~${intake.adBudget ?? "?"}` : "none"}`,
    `Email list: ~${intake.emailListSize}`,
    `Purchase motivation: ${intake.purchaseMotivation}`,
  ].join("\n")
}

export async function collectCompetitiveContext(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<void> {
  const q = serviceMarketQuery(intake)
  const serviceSearch = await googleOrganicSearch(q)
  const buyerHost = hostnameFromUrl(intake.websiteUrl)

  const competitorDomains = topCompetitorDomains(
    serviceSearch.results,
    buyerHost,
    3,
  )

  bundle.competitiveContext.serviceSearch = serviceSearch
  bundle.competitiveContext.buyerHostname = buyerHost
  bundle.competitiveContext.competitorDomains = competitorDomains
  bundle.competitiveContext.competitorSnapshots =
    competitorDomains.length > 0
      ? await fetchCompetitorSnapshots(competitorDomains)
      : []
}

export const RESEARCH_COLLECTORS: Partial<Record<PipelineStepId, ResearchCollector>> =
  {
    search_footprint: collectSearchFootprint,
    online_reputation: collectReputation,
    digital_presence: collectDigitalPresence,
    revenue_funnel: collectRevenueFunnel,
    competitive_context: collectCompetitiveContext,
  }

export async function collectAllResearch(
  intake: LevelstackIntakeFormValues,
): Promise<ResearchBundle> {
  const bundle = emptyResearchBundle()
  bundle.digitalPresence.website.url = intake.websiteUrl
  bundle.revenueFunnel.website.url = intake.websiteUrl

  await collectSearchFootprint(intake, bundle)
  await collectReputation(intake, bundle)
  await collectDigitalPresence(intake, bundle)
  await collectRevenueFunnel(intake, bundle)
  await collectCompetitiveContext(intake, bundle)

  return bundle
}
