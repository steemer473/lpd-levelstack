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
import { ReportSidebar } from "@/components/report/report-sidebar"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

type LevelstackReportViewProps = {
  report: LevelstackReportJson
  reportId?: string
}

export function LevelstackReportView({ report, reportId }: LevelstackReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta } = nav
  const isExecutive = nav.activeTab === "executive_summary"

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

          <UpgradeBanner report={report} />

          <ReportFooter meta={meta} />
        </div>
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
    </>
  )
}
