"use client"

import { Download, Layers, Lock } from "lucide-react"

import { DownloadPdfButton } from "@/components/report/download-pdf-button"
import { SectionGuideInfo } from "@/components/report/section-guide-info"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  REPORT_ASSESSMENT_SUBTITLE,
  TAB_ICONS,
} from "@/lib/report/display-helpers"
import { cn } from "@/lib/utils"

type ReportSidebarTab = {
  id: string
  label: string
  locked?: boolean
}

type ReportSidebarProps = {
  meta: LevelstackReportJson["meta"]
  tabs: ReportSidebarTab[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  reportId?: string
}

export function ReportSidebar({
  meta,
  tabs,
  activeTab,
  onSelectTab,
  reportId,
}: ReportSidebarProps) {
  return (
    <aside className="rpt-sidebar flex flex-col w-full md:w-[15.5rem] shrink-0">
      <div className="rpt-sidebar-brand">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
            aria-hidden
          >
            <Layers className="h-4 w-4 text-[#38bdf8]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">LevelStack</span>
        </div>
        <p className="rpt-sidebar-company">{meta.businessName}</p>
        <p className="rpt-sidebar-subtitle">{REPORT_ASSESSMENT_SUBTITLE}</p>
      </div>

      <nav className="rpt-sidebar-nav flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible scrollbar-none" aria-label="Report sections">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id]
          const isActive = activeTab === tab.id
          return (
            <div key={tab.id} className="rpt-sidebar-nav-item flex shrink-0 items-center md:w-full">
              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="rpt-sidebar-nav-btn"
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden /> : null}
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.locked ? (
                  <Lock className="ml-auto h-3 w-3 shrink-0 opacity-50" aria-label="Locked" />
                ) : null}
              </button>
              <span className="hidden md:inline pr-1">
                <SectionGuideInfo tabId={tab.id} tone="on-dark" />
              </span>
            </div>
          )
        })}
      </nav>

      {reportId ? (
        <>
          <div className="rpt-sidebar-footer hidden md:block">
            <DownloadPdfButton
              reportId={reportId}
              className={cn(
                "w-full justify-center gap-2 text-xs",
                "bg-white/10 text-white border-white/20 hover:bg-white/15",
              )}
              label={
                <>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Export report
                </>
              }
            />
          </div>
          <div className="rpt-sidebar-footer md:hidden">
            <DownloadPdfButton
              reportId={reportId}
              className={cn(
                "w-full justify-center gap-2 text-xs",
                "bg-white/10 text-white border-white/20 hover:bg-white/15",
              )}
            />
          </div>
        </>
      ) : null}
    </aside>
  )
}
