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
export {
  categoryPeerQuery,
  COMPARISON_SOURCE_LABELS,
  competitiveSectionLabel,
  extractNamesakeDomainsFromBrandSearch,
  formatSerpEvidenceTable,
  resolveCompetitorColumns,
  type CompetitiveComparisonMode,
  type CompetitorColumn,
  type CompetitorComparisonSource,
} from "@/lib/research/serp/competitor-resolve"
