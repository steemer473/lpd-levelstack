import type {
  LevelstackReportJson,
  ReportSection,
} from "@/lib/pipeline/report-types"
import {
  isInternalLimitation,
  polishCustomerFindingCopy,
} from "@/lib/report/customer-copy"

const INTAKE_PLACEHOLDER = /^not specified$/i
const INTAKE_DISCOVERED = /^not provided — discovered via research$/i

function sanitizeFindingText(text: string, fallback: string): string {
  const trimmed = text.trim()
  if (!trimmed || INTAKE_PLACEHOLDER.test(trimmed) || INTAKE_DISCOVERED.test(trimmed)) {
    return fallback
  }
  if (isInternalLimitation(trimmed)) {
    return fallback
  }
  return polishCustomerFindingCopy(trimmed)
}

function sanitizeSection(section: ReportSection): ReportSection {
  return {
    ...section,
    findings: section.findings.map((finding) => ({
      ...finding,
      label: polishCustomerFindingCopy(finding.label),
      value: sanitizeFindingText(
        finding.value,
        "This signal could not be verified from public data in this snapshot.",
      ),
      detail: finding.detail
        ? sanitizeFindingText(
            finding.detail,
            "See the section findings above for what we could confirm from live research.",
          )
        : finding.detail,
    })),
  }
}

export function sanitizeReportSections(sections: ReportSection[]): ReportSection[] {
  return sections.map(sanitizeSection)
}

export function sanitizeExecutiveSummary(
  summary: LevelstackReportJson["executiveSummary"],
): LevelstackReportJson["executiveSummary"] {
  const polish = (text: string) =>
    sanitizeFindingText(text, "See your report sections for live research findings.")

  return {
    ...summary,
    paragraphs: summary.paragraphs.map((p) => polish(p)),
    criticalIssue: polish(summary.criticalIssue),
    firstSteps: summary.firstSteps.map((s) => polish(s)),
    insights: summary.insights
      ? {
          whatProspectsSee: polish(summary.insights.whatProspectsSee),
          reputationGap: polish(summary.insights.reputationGap),
          revenueRisk: polish(summary.insights.revenueRisk),
        }
      : summary.insights,
  }
}

export function sanitizeFreeReportJson(
  report: LevelstackReportJson,
): LevelstackReportJson {
  return sanitizeReportJson(report)
}

export function sanitizeReportJson(
  report: LevelstackReportJson,
): LevelstackReportJson {
  return {
    ...report,
    executiveSummary: sanitizeExecutiveSummary(report.executiveSummary),
    sections: sanitizeReportSections(report.sections),
  }
}
