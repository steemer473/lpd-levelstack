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
  isBotInterstitialTitle,
  isCompetitorCandidate,
  isDirectoryListingTitle,
  isNonCompetitorHost,
  isQualifiedPeerResult,
  qualifiedPeerDomains,
  topCompetitorDomains,
} from "@/lib/research/serp/competitor-domains"
export {
  buyerRelevanceTokens,
  categoryPeerQuery,
  COMPARISON_SOURCE_LABELS,
  competitiveSectionLabel,
  extractNamesakeDomainsFromBrandSearch,
  formatSerpEvidenceTable,
  relevantServicePeerColumns,
  resolveCompetitorColumns,
  type CompetitiveComparisonMode,
  type CompetitorColumn,
  type CompetitorComparisonSource,
} from "@/lib/research/serp/competitor-resolve"
