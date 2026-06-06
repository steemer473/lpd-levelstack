"use client"

/**
 * Default LevelStack report layout (pre A/B/C variation experiments).
 */
import {
  ReportFooter,
  ReportHowToRead,
  ReportTabContent,
  ReportTabNavigation,
  ScrollToTopButton,
  useReportTabs,
} from "@/components/report/report-shared"
import { DownloadPdfButton } from "@/components/report/download-pdf-button"
import { ReportHeader } from "@/components/report/report-header"
import { ReportTabBar } from "@/components/report/report-tab-bar"
import { ScoreBreakdown } from "@/components/report/score-breakdown"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

type LevelstackReportViewProps = {
  report: LevelstackReportJson
  reportId?: string
}

export function LevelstackReportView({ report, reportId }: LevelstackReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta } = nav

  return (
    <>
      {reportId ? (
        <div className="flex justify-end mb-2">
          <DownloadPdfButton reportId={reportId} />
        </div>
      ) : null}
      <div
        ref={reportRef}
        className="levelstack-report overflow-x-hidden scroll-mt-24"
      >
        <ReportHeader meta={meta} sectionCount={nav.sectionCount} />

        <ReportHowToRead
          open={nav.howToReadOpen}
          onToggle={() => nav.setHowToReadOpen((o) => !o)}
        />

        <ScoreBreakdown report={report} />

        <ReportTabBar
          tabs={nav.tabs}
          activeTab={nav.activeTab}
          onSelectTab={nav.selectTab}
        />

        <div className="rpt-body-panel">
          <ReportTabContent
            report={report}
            activeTab={nav.activeTab}
            reportDate={meta.reportDate}
            onSelectTab={nav.selectTab}
          />
        </div>

        <ReportTabNavigation
          tabs={nav.tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={nav.activeTab}
          onSelectTab={nav.selectTab}
        />

        <ReportFooter meta={meta} />
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
    </>
  )
}
