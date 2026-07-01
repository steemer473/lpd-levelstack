"use client"

/**
 * Option A dashboard layout — sidebar navigation + executive summary.
 * Free tier uses conversion hybrid B on the exec tab; paid uses full dashboard.
 */
import {
  ReportFooter,
  ReportHowToRead,
  ReportTabContent,
  ReportTabNavigation,
  ScrollToTopButton,
  UpgradeBanner,
  useReportTabs,
} from "@/components/report/report-shared"
import { LockedSectionUnlockModal } from "@/components/report/locked-section-unlock-modal"
import { ReportFaqSection } from "@/components/report/report-faq-section"
import { ReportSidebar } from "@/components/report/report-sidebar"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { useState } from "react"

type LevelstackReportViewProps = {
  report: LevelstackReportJson
  reportId?: string
  defaultUnlockModalOpen?: boolean
}

export function LevelstackReportView({
  report,
  reportId,
  defaultUnlockModalOpen = false,
}: LevelstackReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta } = nav
  const isExecutive = nav.activeTab === "executive_summary"
  const [unlockModalOpen, setUnlockModalOpen] = useState(defaultUnlockModalOpen)

  return (
    <>
      <div
        ref={reportRef}
        className="levelstack-report rpt-dashboard-layout overflow-x-hidden scroll-mt-24"
      >
        <ReportSidebar
          meta={meta}
          tabs={nav.tabs.map((t) => ({
            id: t.id,
            label: t.label,
            locked: t.locked,
          }))}
          activeTab={nav.activeTab}
          onSelectTab={nav.selectTab}
          onLockedTabClick={() => setUnlockModalOpen(true)}
          reportId={reportId}
        />

        <div className="rpt-dashboard-main">
          {!isExecutive ? (
            <ReportHowToRead
              open={nav.howToReadOpen}
              onToggle={() => nav.setHowToReadOpen((o) => !o)}
              compact
            />
          ) : null}

          <div className={isExecutive ? undefined : "rpt-body-panel flex-1"}>
            <ReportTabContent
              report={report}
              activeTab={nav.activeTab}
              reportDate={meta.reportDate}
              onSelectTab={nav.selectTab}
              reportId={reportId}
            />
          </div>

          {!isExecutive ? (
            <ReportTabNavigation
              tabs={nav.tabs.map((t) => ({ id: t.id, label: t.label }))}
              activeTab={nav.activeTab}
              onSelectTab={nav.selectTab}
              prominent
            />
          ) : null}

          <UpgradeBanner report={report} reportId={reportId} />
          {meta.reportTier === "free_snapshot" ? (
            <div className="px-6 py-5">
              <ReportFaqSection />
            </div>
          ) : null}

          <ReportFooter meta={meta} />
        </div>
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
      <LockedSectionUnlockModal
        open={unlockModalOpen}
        onOpenChange={setUnlockModalOpen}
        reportId={reportId}
      />
    </>
  )
}
