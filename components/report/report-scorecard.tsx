"use client"

import { SectionGuideInfo } from "@/components/report/section-guide-info"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { readinessLabel } from "@/lib/report/display-helpers"
import { cn } from "@/lib/utils"

type ReportScorecardProps = {
  meta: LevelstackReportJson["meta"]
  className?: string
}

export function ReportScorecard({ meta, className }: ReportScorecardProps) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-4 lg:flex-row lg:items-stretch", className)}>
      <div className="flex flex-col items-center justify-start px-5 py-3 lg:items-start">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
          Overall Readiness Score
        </span>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-6xl font-bold leading-none text-white">{meta.overallScore}</span>
          <span className="text-base font-medium text-white/50">/ 100</span>
        </div>
        <span className="mt-1 text-lg font-semibold text-[#F0AD4E]">
          {readinessLabel(meta.overallScore)}
        </span>
      </div>

      <div className="flex flex-col items-center justify-start px-5 py-3 lg:items-start">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">Grade</span>
          <SectionGuideInfo tabId="executive_summary" tone="on-dark" />
        </div>
        <div className="mt-1 flex items-baseline">
          <span className="text-7xl font-bold leading-none text-[#F0AD4E]">{meta.letterGrade}</span>
        </div>
      </div>
    </div>
  )
}
