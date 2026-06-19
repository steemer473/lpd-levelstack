import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

export function isPlaceholderReport(report: LevelstackReportJson): boolean {
  const text = [
    ...report.executiveSummary.paragraphs,
    report.executiveSummary.criticalIssue,
    ...report.executiveSummary.firstSteps,
  ].join(" ")

  return (
    text.includes("Add OPENAI_API_KEY") ||
    text.includes("Configure SerpAPI") ||
    text.includes("Configure SERP provider") ||
    text.includes("Configure research keys") ||
    text.includes("Research APIs were unavailable")
  )
}
