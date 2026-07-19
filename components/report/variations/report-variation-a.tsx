"use client"

/**
 * Variation A — Polished tab hub
 * Premium consultant PDF on the web: sticky tabs, meta chips, severity borders.
 */
import {
  ReportFooter,
  ReportHowToRead,
  ReportTabContent,
  ReportTabNavigation,
  ScrollToTopButton,
  useReportTabs,
  type ReportViewProps,
} from "@/components/report/report-shared"
import { LPD, planDisplayName, sectionDotClass } from "@/lib/report/display-helpers"
import { cn } from "@/lib/utils"

export function ReportVariationA({ report }: ReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta } = nav

  return (
    <>
      <div
        ref={reportRef}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm scroll-mt-24"
      >
        <div className="relative overflow-hidden bg-hero hero-mesh text-white">
          <div className="px-6 pt-5 pb-0">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                  LevelStack readiness report
                </p>
                <h1 className="text-xl font-medium leading-tight font-[family-name:var(--font-heading)]">
                  {meta.ownerName} · {meta.businessName}
                </h1>
                <p className="text-xs text-white/50 mt-1">{meta.marketLabel}</p>
              </div>
              <div
                className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full border-[3px] bg-white/5 shadow-inner"
                style={{ borderColor: LPD.orange }}
              >
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: LPD.orange }}
                >
                  {meta.letterGrade}
                </span>
                <span className="text-[9px] text-white/45 mt-0.5 tabular-nums">
                  {meta.overallScore}/100
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-4">
              {[
                { label: "Report date", value: meta.reportDate },
                { label: "Type", value: planDisplayName(meta.planId) },
                {
                  label: "Sections",
                  value: `${nav.sectionCount} of 6`,
                },
                {
                  label: "Findings",
                  value: `${meta.totalFindings} · ${meta.criticalCount} critical`,
                },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs"
                >
                  <span className="text-white/40 text-[10px] uppercase tracking-wide block">
                    {chip.label}
                  </span>
                  <span className="text-white/85 font-medium">{chip.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-16 z-20 bg-hero/95 backdrop-blur-md border-t border-white/10">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-none px-4">
              {nav.tabs.map((tab) => {
                const section = tab.section
                const dotClass =
                  tab.id === "executive_summary"
                    ? "bg-lpd-orange"
                    : section
                      ? sectionDotClass(section.status)
                      : tab.id === "action_plan"
                        ? "bg-lpd-attention"
                        : "bg-lpd-critical"
                const scoreLabel =
                  section &&
                  tab.id !== "executive_summary" &&
                  typeof section.score === "number" &&
                  section.status !== "insufficient_data"
                    ? `${section.score}`
                    : section &&
                        tab.id !== "executive_summary" &&
                        (section.status === "insufficient_data" || section.score == null)
                      ? "—"
                      : null
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => nav.selectTab(tab.id)}
                    className={cn(
                      "flex shrink-0 flex-col items-start gap-0.5 h-auto min-h-10 py-2 px-3.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                      nav.activeTab === tab.id
                        ? "text-white border-lpd-orange"
                        : "text-white/40 border-transparent hover:text-white/70",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
                      {tab.label}
                    </span>
                    {scoreLabel ? (
                      <span className="hidden lg:block text-[10px] text-white/35 pl-3.5 tabular-nums">
                        Score {scoreLabel}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <ReportHowToRead
          open={nav.howToReadOpen}
          onToggle={() => nav.setHowToReadOpen((o) => !o)}
          compact
        />

        <div className="min-h-[320px]">
          <ReportTabContent
            report={report}
            activeTab={nav.activeTab}
            reportDate={meta.reportDate}
          />
        </div>

        <ReportTabNavigation
          tabs={nav.tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={nav.activeTab}
          onSelectTab={nav.selectTab}
          prominent
        />

        <ReportFooter meta={meta} />
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
    </>
  )
}
