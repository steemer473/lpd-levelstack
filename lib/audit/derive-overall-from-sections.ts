import { letterGradeFromScore } from "@/lib/audit/types"
import { hasNumericSectionScore } from "@/lib/pipeline/check-availability"
import type { ReportSection } from "@/lib/pipeline/report-types"

/** Sections that are plans/UI chrome, not diagnostic presence scores (P1-1 / OD-1). */
export const OVERALL_EXCLUDED_SECTION_IDS = new Set(["action_plan", "executive_summary"])

export type DerivedOverall = {
  overallScore: number
  letterGrade: string
  /** Section ids that contributed to the mean (after exclusions). */
  includedSectionIds: string[]
}

/**
 * Customer-facing Overall = equal-weight rounded mean of displayed diagnostic
 * section scores. See docs/plans/scoring-methodology.md (P1-1 / OD-1 / P1-2).
 *
 * Insufficient-data sections (null score / status) are excluded from the mean.
 */
export function deriveOverallFromSections(
  sections: ReadonlyArray<
    Pick<ReportSection, "id" | "score"> & { status?: ReportSection["status"] }
  >,
): DerivedOverall {
  const scored = sections.filter(
    (s) =>
      !OVERALL_EXCLUDED_SECTION_IDS.has(s.id) &&
      hasNumericSectionScore({
        status: s.status ?? "good",
        score: s.score,
      }),
  )

  if (scored.length === 0) {
    return {
      overallScore: 0,
      letterGrade: letterGradeFromScore(0),
      includedSectionIds: [],
    }
  }

  const sum = scored.reduce((acc, s) => acc + (s.score as number), 0)
  const overallScore = Math.round(sum / scored.length)

  return {
    overallScore,
    letterGrade: letterGradeFromScore(overallScore),
    includedSectionIds: scored.map((s) => s.id),
  }
}
