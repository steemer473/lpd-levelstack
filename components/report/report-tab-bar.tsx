"use client"

import { Lock } from "lucide-react"

import { SectionGuideInfo } from "@/components/report/section-guide-info"
import { TAB_ICONS } from "@/lib/report/display-helpers"
import { cn } from "@/lib/utils"

type ReportTab = {
  id: string
  label: string
  section?: { status: "critical" | "attention" | "good" | "insufficient_data" }
  locked?: boolean
}

type ReportTabBarProps = {
  tabs: ReportTab[]
  activeTab: string
  onSelectTab: (tabId: string) => void
}

export function ReportTabBar({ tabs, activeTab, onSelectTab }: ReportTabBarProps) {
  return (
    <div
      className="rpt-tab-bar flex flex-nowrap gap-0.5 overflow-x-auto border-b px-6 scrollbar-none lg:overflow-x-visible"
      role="tablist"
      aria-label="Report sections"
    >
      {tabs.map((tab) => {
        const TabIcon = TAB_ICONS[tab.id]
        const isActive = activeTab === tab.id

        return (
          <div
            key={tab.id}
            className={cn(
              "flex shrink-0 items-center h-11 pr-2 border-b-2 -mb-px transition-colors",
              isActive ? "rpt-tab-bar-active" : "border-transparent",
            )}
            role="presentation"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className="rpt-tab-bar-btn flex items-center gap-1.5 h-full pl-3.5 pr-1 whitespace-nowrap transition-colors"
            >
              {TabIcon ? (
                <TabIcon className="rpt-tab-bar-icon h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : null}
              <span>{tab.label}</span>
              {tab.locked ? (
                <Lock className="h-3 w-3 shrink-0 opacity-60" aria-label="Locked — upgrade to unlock" />
              ) : null}
            </button>
            <SectionGuideInfo tabId={tab.id} />
          </div>
        )
      })}
    </div>
  )
}
