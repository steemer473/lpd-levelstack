"use client"

/**
 * Variation C — Executive command center
 * Urgent owner-first layout: grade strip, critical issue, this-week preview, bento dashboard.
 */
import { useState } from "react"

import {
  ReportDashboard,
  ReportFooter,
  ReportHowToRead,
  ReportTabContent,
  ReportTabNavigation,
  ScrollToTopButton,
  useReportTabs,
  type ReportViewProps,
} from "@/components/report/report-shared"
import { Button } from "@/components/ui/button"
import {
  LPD,
  scoreBarColor,
  sectionDotClass,
} from "@/lib/report/display-helpers"
import { cn } from "@/lib/utils"

export function ReportVariationC({ report }: ReportViewProps) {
  const [nav, reportRef] = useReportTabs(report)
  const { meta, executiveSummary, actionPlan } = nav
  const isExec = nav.activeTab === "executive_summary"

  return (
    <>
      <div
        ref={reportRef}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm scroll-mt-24"
      >
        <div className="bg-hero hero-mesh text-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                Command center
              </p>
              <h1 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                {meta.businessName}
              </h1>
            </div>
            <p className="text-xs text-white/50">{meta.marketLabel}</p>
          </div>
        </div>

        <ReportHowToRead
          open={nav.howToReadOpen}
          onToggle={() => nav.setHowToReadOpen((o) => !o)}
          compact
        />

        {isExec ? (
          <div className="border-b border-border bg-gradient-to-b from-muted/50 to-card">
            <div className="px-6 py-6 grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 bg-card p-5 shadow-sm"
                style={{ borderColor: LPD.orange }}
              >
                <span
                  className="text-5xl font-bold leading-none"
                  style={{ color: LPD.orange }}
                >
                  {meta.letterGrade}
                </span>
                <p className="text-sm text-muted-foreground mt-2 tabular-nums">
                  {meta.overallScore}/100 readiness
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {meta.totalFindings} findings
                </p>
              </div>

              <div className="md:col-span-1 rounded-xl border-l-4 border-l-red-600 bg-red-50/80 dark:bg-red-950/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-800 dark:text-red-200 mb-2">
                  Critical issue
                </p>
                <p className="text-base font-medium leading-snug text-red-950 dark:text-red-100">
                  {executiveSummary.criticalIssue}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  This week
                </p>
                <ul className="space-y-2 text-sm">
                  {actionPlan.thisWeek.slice(0, 2).map((item, i) => (
                    <li key={i} className="leading-snug">
                      <span className="font-medium">{item.task}</span>
                      <span className="text-muted-foreground text-xs block">
                        {item.who} · {item.time}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 mt-3 text-lpd-orange text-xs"
                  onClick={() => nav.selectTab("action_plan")}
                >
                  View full action plan →
                </Button>
              </div>
            </div>

            <ExecutiveBento
              report={report}
              onSelectSection={nav.selectTab}
            />

            <div className="px-6 pb-6">
              <ExecutiveNarrative summary={executiveSummary} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-1 overflow-x-auto px-4 py-2 border-b border-border bg-card scrollbar-none">
              {nav.tabs.map((tab) => {
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
                      "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                      nav.activeTab === tab.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <ReportTabContent
              report={report}
              activeTab={nav.activeTab}
              reportDate={meta.reportDate}
              actionPlanVariant="kanban"
            />
          </>
        )}

        {isExec && (
          <div className="flex gap-1 overflow-x-auto px-4 py-2 border-y border-border bg-muted/20 scrollbar-none">
            {nav.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => nav.selectTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                  nav.activeTab === tab.id
                    ? "bg-lpd-orange text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <ReportTabNavigation
          tabs={nav.tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={nav.activeTab}
          onSelectTab={nav.selectTab}
          prominent={!isExec}
        />

        <ReportFooter meta={meta} />
      </div>

      <ScrollToTopButton visible={nav.showScrollTop} onClick={nav.scrollToReportTop} />
    </>
  )
}

function ExecutiveNarrative({
  summary,
}: {
  summary: ReportViewProps["report"]["executiveSummary"]
}) {
  const [open, setOpen] = useState(false)
  const hidden = summary.paragraphs.length > 2 && !open

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Full executive narrative
      </h2>
      {hidden ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-lpd-orange font-medium hover:underline"
        >
          Expand {summary.paragraphs.length} paragraphs
        </button>
      ) : (
        <div className="space-y-3 text-sm leading-relaxed">
          {summary.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4 italic">
        Diagnostic only — you or your team execute fixes.
      </p>
    </div>
  )
}

function ExecutiveBento({
  report,
  onSelectSection,
}: {
  report: ReportViewProps["report"]
  onSelectSection: (id: string) => void
}) {
  const { meta, sections } = report
  const contentSections = sections.filter((s) => s.id !== "action_plan")

  return (
    <div className="px-6 pb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Readiness at a glance
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Critical", count: meta.criticalCount, color: LPD.red },
          { label: "High", count: meta.highCount, color: LPD.amber },
          { label: "Medium", count: meta.mediumCount, color: LPD.amber },
          { label: "Low", count: meta.lowCount, color: LPD.green },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-border bg-card p-4 text-center"
          >
            <p className="text-2xl font-bold tabular-nums" style={{ color: tile.color }}>
              {tile.count}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground mt-1">{tile.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {contentSections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectSection(s.id)}
            className="text-left rounded-lg border border-border bg-card p-3 hover:border-lpd-orange/50 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-medium truncate">{s.label}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden"
                aria-hidden
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${s.score}%`,
                    backgroundColor: scoreBarColor(s.score),
                  }}
                />
              </span>
              <span className="text-sm font-semibold tabular-nums">{s.score}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 hidden lg:block">
        <ReportDashboard report={report} />
      </div>
    </div>
  )
}
