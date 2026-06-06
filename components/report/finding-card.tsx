import type { ReportFinding } from "@/lib/pipeline/report-types"
import {
  DataPanel,
  DataPanelLabel,
  FindingDetailContent,
  FindingValueHeadline,
} from "@/components/report/finding-detail"
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
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded mt-3",
        kind === "critical" && "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
        kind === "attention" &&
          "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
        kind === "good" &&
          "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200",
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

export function FindingCard({
  finding,
  showSeverityBorder,
}: {
  finding: ReportFinding
  showSeverityBorder?: boolean
}) {
  return (
    <DataPanel
      className={cn(
        showSeverityBorder && "border-l-4",
        showSeverityBorder && severityBorderClass(finding.severity),
      )}
    >
      <DataPanelLabel>{finding.label}</DataPanelLabel>
      <FindingValueHeadline value={finding.value} />
      {finding.detail ? <FindingDetailContent detail={finding.detail} /> : null}
      <FindingFlag severity={finding.severity} />
    </DataPanel>
  )
}
