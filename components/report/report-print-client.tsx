"use client"

import { useEffect } from "react"

import { ReportPrintView } from "@/components/report/report-print-view"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

type ReportPrintClientProps = {
  report: LevelstackReportJson
  autoPrint?: boolean
  reportId?: string
}

export function ReportPrintClient({ report, autoPrint, reportId }: ReportPrintClientProps) {
  useEffect(() => {
    if (autoPrint) {
      const t = window.setTimeout(() => window.print(), 400)
      return () => window.clearTimeout(t)
    }
  }, [autoPrint])

  return (
    <div className="min-h-svh bg-white print:min-h-0">
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium shadow"
        >
          Print / Save as PDF
        </button>
      </div>
      <ReportPrintView report={report} reportId={reportId} />
    </div>
  )
}
