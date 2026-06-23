import type { ReportFinding } from "@/lib/pipeline/report-types"
import { polishCustomerFindingCopy } from "@/lib/report/customer-copy"
import {
  DataPanel,
  DataPanelLabel,
  FindingDetailContent,
  FindingValueHeadline,
} from "@/components/report/finding-detail"
import {
  effectiveFindingSeverity,
  formatFindingLabel,
  findingContextLine,
  findingSeverityExplanation,
} from "@/lib/report/finding-context"
import { flagLabel, severityToFlag } from "@/lib/report/display-helpers"
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
  const label = formatFindingLabel(sectionId, finding.label)
  const context = findingContextLine(sectionId, finding)

  return (
    <DataPanel
      className={cn(
        showSeverityBorder && "border-l-4",
        showSeverityBorder && severityBorderClass(finding.severity),
      )}
    >
      <DataPanelLabel subtitle={context}>{label}</DataPanelLabel>
      <FindingValueHeadline value={polishedValue} />
      {polishedDetail ? <FindingDetailContent detail={polishedDetail} /> : null}
      <FindingSeverityBlock sectionId={sectionId} finding={finding} />
    </DataPanel>
  )
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
