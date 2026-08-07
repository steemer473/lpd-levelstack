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
  onLockedTabClick?: (tabId: string) => void
  reportId?: string
}

function ReportSectionNavList({
  tabs,
  activeTab,
  onSelectTab,
  onLockedTabClick,
  showGuides = false,
}: {
  tabs: ReportSidebarTab[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  onLockedTabClick?: (tabId: string) => void
  showGuides?: boolean
}) {
  return (
    <>
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.id]
        const isActive = activeTab === tab.id
        return (
          <div
            key={tab.id}
            className="rpt-sidebar-nav-item flex w-full min-w-0 shrink-0 items-center"
          >
            <button
              type="button"
              onClick={() => {
                if (tab.locked) {
                  onLockedTabClick?.(tab.id)
                  return
                }
                onSelectTab(tab.id)
              }}
              aria-current={isActive ? "page" : undefined}
              className="rpt-sidebar-nav-btn"
            >
              {Icon ? (
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              ) : null}
              <span className="min-w-0 truncate">{tab.label}</span>
              {tab.locked ? (
                <Lock
                  className="ml-auto h-3 w-3 shrink-0 opacity-50"
                  aria-label="Locked"
                />
              ) : null}
            </button>
            {showGuides ? (
              <span className="shrink-0 pr-1.5">
                <SectionGuideInfo tabId={tab.id} tone="on-dark" side="right" align="start" />
              </span>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

function SidebarPdfFooter({ reportId }: { reportId: string }) {
  return (
    <div className="rpt-sidebar-footer">
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
  )
}

function SidebarBrand({
  businessName,
}: {
  businessName: string
}) {
  return (
    <div className="rpt-sidebar-brand">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
          aria-hidden
        >
          <Layers className="h-4 w-4 text-[#38bdf8]" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">
          LevelStack
        </span>
      </div>
      <p className="rpt-sidebar-company">{businessName}</p>
      <p className="rpt-sidebar-subtitle">{REPORT_ASSESSMENT_SUBTITLE}</p>
    </div>
  )
}

export function ReportSidebar({
  meta,
  tabs,
  activeTab,
  onSelectTab,
  onLockedTabClick,
  reportId,
}: ReportSidebarProps) {
  const activeTabMeta = tabs.find((t) => t.id === activeTab)
  const ActiveIcon = activeTabMeta ? TAB_ICONS[activeTabMeta.id] : undefined

  return (
    <>
      {/* Desktop sidebar — unchanged at md+ */}
      <aside className="rpt-sidebar hidden min-[769px]:flex min-[769px]:w-[15.5rem] min-[769px]:shrink-0 min-[769px]:flex-col">
        <SidebarBrand businessName={meta.businessName} />
        <nav
          className="rpt-sidebar-nav flex flex-col overflow-x-visible"
          aria-label="Report sections"
        >
          <ReportSectionNavList
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            onLockedTabClick={onLockedTabClick}
            showGuides
          />
        </nav>
        {reportId ? <SidebarPdfFooter reportId={reportId} /> : null}
      </aside>

      {/* Mobile: brand + passive current-section cue (sections live in top hamburger) */}
      <div className="rpt-sidebar flex w-full flex-col min-[769px]:hidden">
        <SidebarBrand businessName={meta.businessName} />
        <p className="rpt-sidebar-current" aria-live="polite">
          {ActiveIcon ? (
            <ActiveIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          ) : null}
          <span>
            Now viewing:{" "}
            <span className="font-medium text-white">
              {activeTabMeta?.label ?? "Section"}
            </span>
          </span>
        </p>
      </div>
    </>
  )
}
