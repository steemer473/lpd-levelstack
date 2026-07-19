import type { ReportFinding } from "@/lib/pipeline/report-types"
import { isInternalLimitation } from "@/lib/report/customer-copy"

/**
 * P1-2: per-check availability for section scoring.
 * - ok: checked, healthy signal
 * - negative: checked, genuine gap
 * - unavailable: attempted, provider/error/internal limitation
 * - not_checked: tier-skipped / never fetched
 */
export type CheckAvailability = "ok" | "negative" | "unavailable" | "not_checked"

export type SectionCheck = {
  availability: CheckAvailability
  /** Only used when availability is ok or negative. */
  severity?: ReportFinding["severity"]
}

export type ScoredSectionResult =
  | { score: number; status: "critical" | "attention" | "good" }
  | { score: null; status: "insufficient_data" }

/** Section is insufficient when unavailable + not_checked ≥ this share of checks. */
export const INSUFFICIENT_DATA_THRESHOLD = 0.5

const NOT_FETCHED_YET_RE = /^not fetched yet\.?$/i

export function isNotFetchedYet(limitation: string | null | undefined): boolean {
  return NOT_FETCHED_YET_RE.test(limitation?.trim() ?? "")
}

/**
 * Classify a research `limitation` string into unavailable vs not_checked.
 * Empty/missing limitation is not classified here — callers decide from context.
 */
export function classifyLimitationAvailability(
  limitation: string | null | undefined,
): "unavailable" | "not_checked" {
  if (isNotFetchedYet(limitation)) return "not_checked"
  return "unavailable"
}

/**
 * True when a SERP/search check failed due to error or was never fetched,
 * rather than returning a genuine empty result set.
 */
export function isUnavailableSearchCheck(search: {
  results: unknown[]
  limitation?: string | null
}): boolean {
  if (search.results.length > 0) return false
  const lim = search.limitation?.trim()
  if (!lim) return false
  return isInternalLimitation(lim) || isNotFetchedYet(lim)
}

export function shouldMarkInsufficient(
  checks: ReadonlyArray<Pick<SectionCheck, "availability">>,
): boolean {
  if (checks.length === 0) return false
  const blocked = checks.filter(
    (c) => c.availability === "unavailable" || c.availability === "not_checked",
  ).length
  return blocked / checks.length >= INSUFFICIENT_DATA_THRESHOLD
}

export function scoreFromScoreableFindings(
  findings: ReadonlyArray<{ severity: string }>,
): { score: number; status: "critical" | "attention" | "good" } {
  if (findings.some((f) => f.severity === "critical")) {
    return { score: 42, status: "critical" }
  }
  if (findings.some((f) => f.severity === "high" || f.severity === "medium")) {
    return { score: 62, status: "attention" }
  }
  return { score: 78, status: "good" }
}

/**
 * Score a section from classified checks. Unavailable / not_checked never
 * enter the severity cliff; if they dominate (≥50%), return insufficient_data.
 */
export function scoreSectionFromChecks(
  checks: ReadonlyArray<SectionCheck>,
): ScoredSectionResult {
  if (shouldMarkInsufficient(checks)) {
    return { score: null, status: "insufficient_data" }
  }

  const scoreable = checks.filter(
    (c) => c.availability === "ok" || c.availability === "negative",
  )

  if (scoreable.length === 0) {
    // All checks were somehow filtered but below threshold (e.g. 1 of 3 blocked)
    // — treat as insufficient rather than inventing a healthy 78.
    return { score: null, status: "insufficient_data" }
  }

  return scoreFromScoreableFindings(
    scoreable.map((c) => ({ severity: c.severity ?? "good" })),
  )
}

/** Customer-facing section score display (never invent 0 for insufficient). */
export function formatSectionScoreDisplay(
  section: { status: string; score?: number | null },
): string {
  if (
    section.status === "insufficient_data" ||
    section.score == null ||
    !Number.isFinite(section.score)
  ) {
    return "Insufficient data"
  }
  return String(section.score)
}

export function hasNumericSectionScore(
  section: { status: string; score?: number | null },
): boolean {
  return (
    section.status !== "insufficient_data" &&
    typeof section.score === "number" &&
    Number.isFinite(section.score)
  )
}
