"use client"

/**
 * Variation B — Split view with persistent section rail
 * Editorial sidebar navigation; main panel for findings.
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

export function ReportVariationB({ report }: ReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta } = nav

  return (
    <>
      <div
        ref={reportRef}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm scroll-mt-24 report-variation-b"
      >
        <div className="bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--card))_12rem)]">
          <div className="relative overflow-hidden bg-lpd-dark text-white px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-heading)]">
                  {meta.businessName}
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  {meta.ownerName} · {meta.marketLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: LPD.orange }}
                >
                  {meta.letterGrade}
                </span>
                <div className="text-right text-xs text-white/50">
                  <p className="text-white/90 font-medium tabular-nums">
                    {meta.overallScore}/100
                  </p>
                  <p>{meta.criticalCount} critical</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              {[
                ["Date", meta.reportDate],
                ["Plan", planDisplayName(meta.planId)],
                ["Findings", String(meta.totalFindings)],
                ["Sections", `${nav.sectionCount}/6`],
              ].map(([k, v]) => (
                <div key={k} className="rounded border border-white/10 px-2 py-1.5">
                  <p className="text-white/35 uppercase tracking-wide">{k}</p>
                  <p className="text-white/80 font-medium truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <ReportHowToRead
            open={nav.howToReadOpen}
            onToggle={() => nav.setHowToReadOpen((o) => !o)}
          />

          <div className="lg:flex lg:min-h-[480px]">
            <aside className="hidden lg:block w-[280px] shrink-0 border-r border-border bg-muted/20">
              <nav className="sticky top-20 p-3 space-y-0.5" aria-label="Report sections">
                {nav.tabs.map((tab) => {
                  const active = nav.activeTab === tab.id
                  const section = tab.section
                  const dot =
                    tab.id === "executive_summary"
                      ? "bg-lpd-orange"
                      : section
                        ? sectionDotClass(section.status)
                        : "bg-lpd-attention"
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => nav.selectTab(tab.id)}
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors border-l-[3px]",
                        active
                          ? "border-l-lpd-orange bg-card shadow-sm font-medium text-foreground"
                          : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                        <span className="truncate flex-1">{tab.label}</span>
                        {section ? (
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {section.score}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="lg:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-border bg-muted/30 scrollbar-none">
                {nav.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => nav.selectTab(tab.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                      nav.activeTab === tab.id
                        ? "bg-lpd-orange text-white border-transparent"
                        : "bg-card border-border text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <ReportTabContent
                report={report}
                activeTab={nav.activeTab}
                reportDate={meta.reportDate}
              />
            </div>
          </div>

          <ReportTabNavigation
            tabs={nav.tabs.map((t) => ({ id: t.id, label: t.label }))}
            activeTab={nav.activeTab}
            onSelectTab={nav.selectTab}
          />

          <ReportFooter meta={meta} />
        </div>
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
    </>
  )
}
