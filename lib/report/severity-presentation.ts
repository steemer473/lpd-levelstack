import type { LevelstackReportJson, ReportFinding } from "@/lib/pipeline/report-types"
import {
  GBP_NOT_CHECKED_VALUE,
  UNABLE_TO_VERIFY_VALUE,
  isCustomerFacingFinding,
} from "@/lib/report/customer-copy"
import { effectiveFindingSeverity } from "@/lib/report/finding-context"

/** Overall below this uses letter grade F and may unlock alarm chrome (with urgent findings). */
export const ALARM_OVERALL_SCORE_THRESHOLD = 60

/**
 * Findings that represent unavailable / not_checked checks (P1-2), not genuine gaps.
 * These must never drive executive alarm chrome.
 */
export function isUnavailableStyleFinding(finding: Pick<ReportFinding, "value">): boolean {
  const value = finding.value.trim()
  if (!value) return true
  if (value === UNABLE_TO_VERIFY_VALUE) return true
  if (value === GBP_NOT_CHECKED_VALUE) return true
  if (/^unable to verify\b/i.test(value)) return true
  return false
}

/**
 * True when the report has at least one customer-facing critical/high finding
 * from a scoreable check (not unable-to-verify / not-checked style).
 */
export function hasScoreableUrgentFinding(report: LevelstackReportJson): boolean {
  for (const section of report.sections) {
    if (section.id === "action_plan") continue
    for (const finding of section.findings) {
      if (!isCustomerFacingFinding(finding.value)) continue
      if (isUnavailableStyleFinding(finding)) continue
      const severity = effectiveFindingSeverity(section.id, finding)
      if (severity === "critical" || severity === "high") return true
    }
  }
  return false
}

/**
 * P1-3: gate for executive alarm chrome (red pull-quote, is-critical KPI).
 * Identical free + paid. Does not change letter grades or per-finding badges.
 */
export function shouldUseAlarmSeverity(report: LevelstackReportJson): boolean {
  if (report.meta.overallScore >= ALARM_OVERALL_SCORE_THRESHOLD) return false
  return hasScoreableUrgentFinding(report)
}
