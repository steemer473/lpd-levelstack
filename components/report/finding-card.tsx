import type { ReportFinding } from "@/lib/pipeline/report-types"
import { polishCustomerFindingCopy } from "@/lib/report/customer-copy"
import { OutcomeAuditCard } from "@/components/report/outcome-audit-card"
import {
  effectiveFindingSeverity,
  formatFindingLabel,
  findingContextLine,
  findingSeverityExplanation,
} from "@/lib/report/finding-context"
import { flagLabel, severityToFlag } from "@/lib/report/display-helpers"
import { parseFindingDetail } from "@/lib/report/parse-finding-detail"
import { type OutcomeLabelKey } from "@/lib/report/outcome-copy"
import { AlertCircle, AlertTriangle, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function FindingFlag({ severity }: { severity: ReportFinding["severity"] }) {
  const kind = severityToFlag(severity)
  const Icon =
    kind === "critical" ? AlertCircle : kind === "attention" ? AlertTriangle : Check

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded",
        kind === "critical" && "bg-red-100 text-red-800",
        kind === "attention" && "bg-amber-100 text-amber-900",
        kind === "good" && "bg-green-100 text-green-800",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {flagLabel(severity)}
    </span>
  )
}

function severityBorderClass(severity: ReportFinding["severity"]) {
  const kind = severityToFlag(severity)
  if (kind === "critical") return "border-l-lpd-critical"
  if (kind === "attention") return "border-l-lpd-attention"
  return "border-l-lpd-good"
}

function severityBlockClass(severity: ReportFinding["severity"]) {
  const kind = severityToFlag(severity)
  if (kind === "critical") return "rpt-finding-severity is-critical"
  if (kind === "attention") return "rpt-finding-severity is-attention"
  return "rpt-finding-severity is-good"
}

export function FindingSeverityBlock({
  sectionId,
  finding,
}: {
  sectionId: string
  finding: ReportFinding
}) {
  const severity = effectiveFindingSeverity(sectionId, finding)
  const explanation = findingSeverityExplanation(sectionId, finding)

  return (
    <div className={cn("mt-3", severityBlockClass(severity))}>
      <FindingFlag severity={severity} />
      <p className="rpt-finding-severity-text">{explanation}</p>
    </div>
  )
}

export function FindingCard({
  finding,
  sectionId,
  showSeverityBorder,
}: {
  finding: ReportFinding
  sectionId: string
  showSeverityBorder?: boolean
}) {
  const polishedValue = polishCustomerFindingCopy(finding.value)
  const polishedDetail = polishCustomerFindingCopy(finding.detail)
  const context = findingContextLine(sectionId, finding)
  const label = formatFindingLabel(sectionId, finding.label)
  const severity = effectiveFindingSeverity(sectionId, finding)
  const detailBullets = extractDetailBullets(polishedDetail)
  const bullets = [context, ...detailBullets].filter(Boolean).slice(0, 3)

  return (
    <OutcomeAuditCard
      className={cn(
        showSeverityBorder && "border-l-4",
        showSeverityBorder && severityBorderClass(finding.severity),
      )}
      headline={`${label}: ${polishedValue}`}
      bullets={bullets}
      outcome={outcomeForFinding(sectionId, severity)}
    />
  )
}

function outcomeForFinding(
  sectionId: string,
  severity: ReportFinding["severity"],
): OutcomeLabelKey {
  const kind = severityToFlag(severity)
  if (kind === "good") return "verifiedAsset"
  if (sectionId === "revenue_funnel") return "revenueRisk"
  if (sectionId === "competitive_context") return "competitorAdvantage"
  if (sectionId === "digital_presence") return "performanceLeak"
  return "visibilityLeak"
}

function extractDetailBullets(detail: string): string[] {
  const parsed = parseFindingDetail(detail)
  if (!parsed) return []

  if (parsed.kind === "serp") {
    return parsed.items.slice(0, 3).map((item) => `#${item.position} ${item.title}`)
  }
  if (parsed.kind === "keyValue") {
    return parsed.items.slice(0, 3).map((item) => `${item.key}: ${item.value}`)
  }
  if (parsed.kind === "bullets") return parsed.items.slice(0, 3)
  if (parsed.kind === "paragraphs") return parsed.paragraphs.slice(0, 3)
  return [parsed.text]
}

export function FindingPrintBlock({
  sectionId,
  finding,
}: {
  sectionId: string
  finding: ReportFinding
}) {
  const polishedValue = polishCustomerFindingCopy(finding.value)
  const polishedDetail = polishCustomerFindingCopy(finding.detail)
  const label = formatFindingLabel(sectionId, finding.label)
  const context = findingContextLine(sectionId, finding)
  const explanation = findingSeverityExplanation(sectionId, finding)
  const severity = effectiveFindingSeverity(sectionId, finding)

  return (
    <div className="mb-3 rounded border border-gray-200 bg-white p-3 break-inside-avoid">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-xs text-gray-600 mt-0.5">{context}</p>
      <p className="font-medium text-sm text-gray-900 mt-2">{polishedValue}</p>
      {polishedDetail ? (
        <p className="text-gray-700 text-xs mt-1 leading-relaxed">{polishedDetail}</p>
      ) : null}
      <p className="text-xs font-semibold text-gray-800 mt-2">
        {flagLabel(severity)} — {explanation}
      </p>
    </div>
  )
}
