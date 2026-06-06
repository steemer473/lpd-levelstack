"use client"

import type { ReactNode } from "react"

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  FileText,
  MapPin,
} from "lucide-react"

import { ReportScorecard } from "@/components/report/report-scorecard"
import { SectionGuideInfo } from "@/components/report/section-guide-info"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { planDisplayName, REPORT_ASSESSMENT_TITLE } from "@/lib/report/display-helpers"

type ReportHeaderProps = {
  meta: LevelstackReportJson["meta"]
  sectionCount: number
}

function MetaColumn({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden text-[#5BC0DE] lg:inline" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</span>
        <span className="whitespace-nowrap text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  )
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: ReactNode
  label: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-3 py-1.5">
      <span className="hidden text-white/55 lg:inline" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col items-center leading-tight lg:items-start">
        <span className="text-xl font-bold text-white">{value}</span>
        <span className="whitespace-nowrap text-sm text-white/55">{label}</span>
      </div>
    </div>
  )
}

export function ReportHeader({ meta, sectionCount }: ReportHeaderProps) {
  return (
    <header className="rpt-header w-full overflow-hidden text-white">
      <div className="flex flex-col items-center gap-6 px-7 py-6 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
        <div className="flex flex-col items-center gap-2 lg:shrink-0 lg:items-start">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:whitespace-nowrap lg:text-4xl">
            {meta.ownerName} <span className="text-white/45">·</span> {meta.businessName}
          </h1>
          <div className="flex items-center justify-center gap-1 lg:justify-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5BC0DE] sm:text-sm lg:whitespace-nowrap lg:text-base">
              {REPORT_ASSESSMENT_TITLE}
            </span>
            <SectionGuideInfo tabId="executive_summary" tone="on-dark" />
          </div>
        </div>

        <ReportScorecard meta={meta} />
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-white/12 px-7 py-4 lg:flex-row lg:justify-between">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-x-4">
          <MetaColumn icon={<MapPin className="h-7 w-7" />} label="Market" value={meta.marketLabel} />
          <div className="h-px w-9 shrink-0 bg-white/12 lg:h-9 lg:w-px" aria-hidden="true" />
          <MetaColumn icon={<Calendar className="h-7 w-7" />} label="Report Date" value={meta.reportDate} />
          <div className="h-px w-9 shrink-0 bg-white/12 lg:h-9 lg:w-px" aria-hidden="true" />
          <MetaColumn
            icon={<BarChart3 className="h-7 w-7" />}
            label="Assessment Type"
            value={planDisplayName(meta.planId)}
          />
        </div>

        <div className="flex flex-col items-center gap-4 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-x-1">
          <div className="h-px w-9 shrink-0 bg-white/12 lg:h-9 lg:w-px" aria-hidden="true" />
          <StatPill
            icon={<FileText className="h-7 w-7" />}
            value={String(meta.totalFindings)}
            label="Findings Identified"
          />
          <div className="h-px w-9 shrink-0 bg-white/12 lg:h-9 lg:w-px" aria-hidden="true" />
          <StatPill
            icon={<AlertTriangle className="h-7 w-7" />}
            value={String(meta.criticalCount)}
            label="Critical Issues"
          />
          <div className="h-px w-9 shrink-0 bg-white/12 lg:h-9 lg:w-px" aria-hidden="true" />
          <StatPill
            icon={<Clock className="h-7 w-7" />}
            value={
              <>
                <span className="text-2xl">{sectionCount}</span> of 6
              </>
            }
            label="Sections Complete"
          />
        </div>
      </div>
    </header>
  )
}
