"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import {
  parseReportVariant,
  ReportVariationPicker,
} from "@/components/report/report-variation-picker"
import { ReportVariationA } from "@/components/report/variations/report-variation-a"
import { ReportVariationB } from "@/components/report/variations/report-variation-b"
import { ReportVariationC } from "@/components/report/variations/report-variation-c"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

function ReportViewInner({ report }: { report: LevelstackReportJson }) {
  const searchParams = useSearchParams()
  const variant = parseReportVariant(searchParams.get("variant"))

  return (
    <div className="space-y-4 w-full max-w-report mx-auto">
      {process.env.NODE_ENV === "development" ? <ReportVariationPicker /> : null}
      {variant === "b" ? (
        <ReportVariationB report={report} />
      ) : variant === "c" ? (
        <ReportVariationC report={report} />
      ) : (
        <ReportVariationA report={report} />
      )}
    </div>
  )
}

export function ReportViewRouter({ report }: { report: LevelstackReportJson }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-report mx-auto h-48 rounded-xl border border-border bg-muted/30 animate-pulse" />
      }
    >
      <ReportViewInner report={report} />
    </Suspense>
  )
}
