"use client"

import type { ReactNode } from "react"

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ClipboardList,
  Clock,
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
      <span className="text-[#94a3b8]" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col items-start leading-normal">
        <span className="text-[10px] font-semibold uppercase text-[#94a3b8]">{label}</span>
        <span className="whitespace-nowrap text-[13px] font-medium text-white">{value}</span>
      </div>
    </div>
  )
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: ReactNode
  label: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-white/80" aria-hidden="true">
        {icon}
      </span>
      <div className="flex items-baseline gap-1 whitespace-nowrap leading-normal">
        <span className="text-lg font-bold text-white">{value}</span>
        <span className="text-[13px] font-normal text-[#94a3b8]">{label}</span>
      </div>
    </div>
  )
}

export function ReportHeader({ meta, sectionCount }: ReportHeaderProps) {
  return (
    <header className="rpt-header w-full overflow-hidden text-white">
      <div className="flex flex-col items-center gap-6 px-6 py-6 sm:px-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-1.5 text-center md:items-start md:text-left">
          <h1 className="text-[26px] font-bold leading-[1.2] tracking-tight md:whitespace-nowrap">
            {meta.ownerName} <span className="text-white/45">·</span> {meta.businessName}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wide text-[#38bdf8] md:whitespace-nowrap">
              {REPORT_ASSESSMENT_TITLE}
            </span>
            <SectionGuideInfo tabId="executive_summary" tone="on-dark" />
          </div>
        </div>

        <ReportScorecard meta={meta} />
      </div>

      <div className="rpt-header-subbar flex flex-col items-stretch gap-5 px-6 py-3.5 sm:px-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-7 md:justify-start">
          <MetaColumn icon={<MapPin className="h-4 w-4" />} label="Market" value={meta.marketLabel} />
          <MetaColumn icon={<Calendar className="h-4 w-4" />} label="Report Date" value={meta.reportDate} />
          <MetaColumn
            icon={<BarChart3 className="h-4 w-4" />}
            label="Assessment Type"
            value={planDisplayName(meta.planId)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:justify-end">
          <StatItem
            icon={<ClipboardList className="h-[18px] w-[18px]" />}
            value={String(meta.totalFindings)}
            label="Findings Identified"
          />
          <StatItem
            icon={<AlertTriangle className="h-[18px] w-[18px]" />}
            value={String(meta.criticalCount)}
            label="Critical Issues"
          />
          <StatItem
            icon={<Clock className="h-[18px] w-[18px]" />}
            value={
              <>
                <span>{sectionCount}</span>
                <span className="text-sm font-semibold"> of 6</span>
              </>
            }
            label="Sections Complete"
          />
        </div>
      </div>
    </header>
  )
}
