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
    <div
      className={cn(
        "flex shrink-0 items-center gap-10",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
          Overall Readiness Score
        </span>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[48px] font-extrabold leading-none text-white">
            {meta.overallScore}
          </span>
          <span className="text-[22px] font-semibold leading-none text-[#38bdf8]">/100</span>
        </div>
        <span className="text-sm font-bold text-[#f97316]">
          {readinessLabel(meta.overallScore)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
          Grade
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[56px] font-bold leading-none text-white">
            {meta.letterGrade}
          </span>
          <SectionGuideInfo tabId="executive_summary" tone="on-dark" iconClassName="size-[18px]" />
        </div>
      </div>
    </div>
  )
}
