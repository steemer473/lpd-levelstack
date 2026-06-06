import type { SerpOrganicResult } from "@/lib/research/serp"
import { resultsMentionDomain } from "@/lib/research/serp"
import type { ReportFinding } from "@/lib/pipeline/report-types"

export type FindingSeverity = ReportFinding["severity"]

const NEGATIVE_SERP_RE =
  /complaint|lawsuit|arrest|scam|fraud|ripoff|bbb complaint|consumeraffairs/i

/**
 * Branded business query: rank on page 1 drives severity.
 * - Positions 1–3: good (strong visibility)
 * - Positions 4–6: low (on page 1, room to improve)
 * - Positions 7–10: medium (easy to miss)
 * - Not in top 10: high
 */
export function businessSearchSeverity(
  hit: SerpOrganicResult | null,
  hasOrganicResults: boolean,
): FindingSeverity {
  if (hit) {
    if (hit.position <= 3) return "good"
    if (hit.position <= 6) return "low"
    return "medium"
  }
  if (hasOrganicResults) return "high"
  return "medium"
}

/**
 * Owner-name query: personal SERP risk is separate from business rank.
 */
export function ownerSearchSeverity(
  results: SerpOrganicResult[],
  buyerHost: string | null,
): FindingSeverity {
  if (!results.length) return "medium"

  const hit = resultsMentionDomain(results, buyerHost)
  if (hit) {
    if (hit.position <= 3) return "good"
    if (hit.position <= 10) return "low"
    return "medium"
  }

  const topSlice = results.slice(0, 3)
  const hasNegative = topSlice.some((r) =>
    NEGATIVE_SERP_RE.test(`${r.title} ${r.snippet}`),
  )
  if (hasNegative) return "high"

  return "low"
}
