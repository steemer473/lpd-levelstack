export type {
  SerpOrganicResult,
  SerpSearchResponse,
} from "@/lib/research/serp/types"

export {
  googleOrganicSearch,
  hostnameFromUrl,
  resultsMentionDomain,
  runSerpQueries,
} from "@/lib/research/serp/router"
export {
  filterCompetitorDomains,
  isCompetitorCandidate,
  isNonCompetitorHost,
  topCompetitorDomains,
} from "@/lib/research/serp/competitor-domains"
