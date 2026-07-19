import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { FindingPrintBlock } from "@/components/report/finding-card"
import {
  planDisplayName,
  readinessHeadline,
  REPORT_ASSESSMENT_SUBTITLE,
  sectionScoreAccent,
} from "@/lib/report/display-helpers"
import { resolveExecutiveContent } from "@/lib/report/executive-summary-resolve"
import {
  ownerRoleLabel,
  roadmapBucketsFromReport,
} from "@/lib/report/roadmap-from-recommendations"
import { FormattedReportText } from "@/components/report/formatted-report-text"
import { ReportPrintViewFree } from "@/components/report/report-print-view-free"

type ReportPrintViewProps = {
  report: LevelstackReportJson
  reportId?: string
}

type BadgeLevel = "high" | "medium" | "low"

function deriveActionBadges(index: number): {
  impact: BadgeLevel
  effort: BadgeLevel
  priority: BadgeLevel
} {
  if (index === 0) return { impact: "high", effort: "medium", priority: "high" }
  if (index === 1) return { impact: "high", effort: "medium", priority: "high" }
  if (index === 2) return { impact: "medium", effort: "low", priority: "medium" }
  return { impact: "medium", effort: "low", priority: "medium" }
}

export function ReportPrintView({ report, reportId }: ReportPrintViewProps) {
  if (report.meta.reportTier === "free_snapshot") {
    return <ReportPrintViewFree report={report} reportId={reportId} />
  }

  return <ReportPrintViewFull report={report} />
}

function ReportPrintViewFull({ report }: ReportPrintViewProps) {
  const { meta, sections, actionPlan, executiveSummary } = report
  const content = resolveExecutiveContent(report)
  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const intro =
    executiveSummary.paragraphs[0] ??
    "Your digital presence shows opportunities to improve visibility, trust signals, and conversion."
  const recBuckets = roadmapBucketsFromReport(report)

  return (
    <article className="max-w-4xl mx-auto p-8 text-black bg-white text-sm leading-relaxed print:p-6">
      <header className="border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-xl font-semibold">{meta.businessName}</h1>
        <p className="text-xs uppercase tracking-wide text-sky-600 mt-1 font-semibold">
          {REPORT_ASSESSMENT_SUBTITLE}
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
          <span>{meta.ownerName}</span>
          <span>Market: {meta.marketLabel}</span>
          <span>Date: {meta.reportDate}</span>
          <span>Type: {planDisplayName(meta.planId)}</span>
        </div>
        <div className="mt-4 inline-block rounded border border-gray-200 px-4 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Overall score
          </p>
          <p className="text-2xl font-bold">
            {meta.overallScore}
            <span className="text-base font-normal text-sky-600">/100</span>
          </p>
          <p className="text-xs font-semibold text-orange-600 capitalize">
            {readinessHeadline(meta.overallScore)}
          </p>
          <p className="text-3xl font-bold text-gray-900 leading-none mt-1">{meta.letterGrade}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">Executive Summary</h2>
        <p className="text-gray-700 mb-4">{intro}</p>

        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Section scores
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {contentSections.map((section) => {
            const accent = sectionScoreAccent(section.id)
            return (
              <div
                key={section.id}
                className="rounded border border-gray-200 p-3 break-inside-avoid"
              >
                <p className="font-semibold">
                  {typeof section.score === "number" &&
                  section.status !== "insufficient_data" ? (
                    <>
                      {section.score}
                      <span className="text-xs font-normal text-gray-500">/100</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      Insufficient data
                    </span>
                  )}
                </p>
                <div className="h-1.5 rounded-full bg-gray-200 my-1.5 overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width:
                        typeof section.score === "number" &&
                        section.status !== "insufficient_data"
                          ? `${section.score}%`
                          : "0%",
                      backgroundColor: accent.bar,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-700">{section.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-2">Top strengths</h3>
            <ul className="list-none pl-0 space-y-1.5">
              {content.strengths.map((s, i) => (
                <li key={i} className="text-gray-700">
                  <FormattedReportText
                    text={s}
                    paragraphClassName="text-inherit text-sm"
                    emphasizeLeadIn={false}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Top opportunities</h3>
            <ul className="list-none pl-0 space-y-1.5">
              {content.topOpportunities.map((o, i) => (
                <li key={i} className="text-gray-700">
                  <FormattedReportText
                    text={o}
                    paragraphClassName="text-inherit text-sm"
                    emphasizeLeadIn={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {recBuckets ? (
          <>
            <h3 className="font-medium mb-2">Prioritized action plan</h3>
            {(
              [
                { label: "This week", items: recBuckets.week },
                { label: "This month", items: recBuckets.month },
                { label: "This quarter", items: recBuckets.quarter },
              ] as const
            )
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.label} className="mb-4 break-inside-avoid">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {group.label}
                  </p>
                  <table className="w-full text-xs border-collapse border border-gray-200 mb-2">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold">Action</th>
                        <th className="text-left py-2 px-2 font-semibold">Who</th>
                        <th className="text-left py-2 px-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 px-2">{item.title}</td>
                          <td className="py-2 px-2">
                            {ownerRoleLabel(item.owner.role)}
                          </td>
                          <td className="py-2 px-2">{item.effortHint ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </>
        ) : actionPlan.thisWeek.length +
            actionPlan.thisMonth.length +
            actionPlan.thisQuarter.length >
          0 ? (
          <>
            <h3 className="font-medium mb-2">Prioritized action plan</h3>
            {(
              [
                { label: "This week", items: actionPlan.thisWeek },
                { label: "This month", items: actionPlan.thisMonth },
                { label: "This quarter", items: actionPlan.thisQuarter },
              ] as const
            )
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.label} className="mb-4 break-inside-avoid">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {group.label}
                  </p>
                  <table className="w-full text-xs border-collapse border border-gray-200 mb-2">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold">Action</th>
                        <th className="text-left py-2 px-2 font-semibold">Who</th>
                        <th className="text-left py-2 px-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 px-2">{item.task}</td>
                          <td className="py-2 px-2">{item.who}</td>
                          <td className="py-2 px-2">{item.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </>
        ) : null}
      </section>

      {contentSections.map((section) => (
        <section key={section.id} className="mb-8 break-inside-avoid">
          <h2 className="text-base font-semibold uppercase mb-2">
            {typeof section.score === "number" &&
            section.status !== "insufficient_data"
              ? `${section.label} (${section.score}/100)`
              : `${section.label} (Insufficient data)`}
          </h2>
          {section.aiPreview && section.aiPreview.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                AI search preview
              </h3>
              {section.aiPreview.map((ai, i) => (
                <div key={i} className="mb-2 rounded border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-600">{ai.platform}</p>
                  <p className="text-sm text-gray-800 mt-1">{ai.result}</p>
                </div>
              ))}
            </div>
          ) : null}
          {section.findings.map((f, i) => (
            <FindingPrintBlock key={i} sectionId={section.id} finding={f} />
          ))}
          {section.competitiveGrid ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left" />
                    {section.competitiveGrid.columnHeaders.map((h) => (
                      <th key={h} className="p-2 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.competitiveGrid.rows.map((row) => (
                    <tr key={row.label} className="border-t border-gray-100">
                      <td className="p-2 font-medium text-gray-600">{row.label}</td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}

      <footer className="border-t pt-4 text-xs text-gray-500 italic">
        Generated by LevelStack · Level Play Digital. As of {meta.reportDate}. Diagnostic only
        — you or your team execute fixes.
      </footer>
    </article>
  )
}
