import { ExecutiveInsightBody } from "@/components/report/executive-insight-body"
import {
  FindingPrintBlock,
  PrintSeverityPill,
} from "@/components/report/finding-card"
import { FormattedReportText } from "@/components/report/formatted-report-text"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  FREE_EXECUTIVE_SECTION_ORDER,
  planDisplayName,
  REPORT_ASSESSMENT_SUBTITLE,
  sectionScoreAccent,
} from "@/lib/report/display-helpers"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "@/lib/report/executive-summary-resolve"
import { effectiveFindingSeverity } from "@/lib/report/finding-context"
import {
  FREE_KPI_LABELS,
  FREE_SCORE_LABEL,
  REPORT_SCORE_FOOTER,
  freeExecutiveHeadline,
  freeExecutiveNextDecisions,
  freeScanIssueCounts,
  freeScoreBasisLine,
  verifiedChecksList,
} from "@/lib/report/free-executive-copy"
import { shouldUseAlarmSeverity } from "@/lib/report/severity-presentation"
import { getHubUpgradeUrl } from "@/lib/urls"
import { cn } from "@/lib/utils"

type ReportPrintViewFreeProps = {
  report: LevelstackReportJson
  reportId?: string
}

function splitFirstSentence(text: string): { first: string; rest: string } {
  const match = text.match(/^(.+?[.!?])(?:\s+([\s\S]+))?$/)
  if (!match?.[1]) return { first: text, rest: "" }
  return { first: match[1], rest: match[2] ?? "" }
}

function PrintHeader({ report }: { report: LevelstackReportJson }) {
  const { meta } = report
  const basisLine = freeScoreBasisLine()
  return (
    <header className="border-b-2 border-gray-900 pb-4 mb-6 break-inside-avoid">
      <h1 className="text-xl font-semibold">{meta.businessName}</h1>
      <p className="text-xs uppercase tracking-wide text-sky-600 mt-1 font-semibold">
        {REPORT_ASSESSMENT_SUBTITLE}
      </p>
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 mt-1">
        Free snapshot
      </p>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
        <span>{meta.ownerName}</span>
        {meta.marketLabel?.trim() ? (
          <span>Market: {meta.marketLabel}</span>
        ) : null}
        <span>Date: {meta.reportDate}</span>
        <span>Type: {planDisplayName(meta.planId)}</span>
      </div>
      <div className="mt-4 inline-block rounded border border-gray-200 px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {FREE_SCORE_LABEL}
        </p>
        <p className="text-2xl font-bold">
          {meta.overallScore}
          <span className="text-base font-normal text-sky-600">/100</span>
        </p>
        <p className="text-[10px] font-medium text-gray-600 leading-snug max-w-[14rem] mx-auto mt-1">
          {basisLine}
        </p>
        <p className="text-3xl font-bold text-gray-900 leading-none mt-1">{meta.letterGrade}</p>
      </div>
    </header>
  )
}

function KpiStrip({
  report,
  alarmSeverity,
}: {
  report: LevelstackReportJson
  alarmSeverity: boolean
}) {
  const { meta } = report
  const issues = freeScanIssueCounts(report)
  const items = [
    { label: FREE_KPI_LABELS.score, value: String(meta.overallScore), tone: "default" as const },
    { label: FREE_KPI_LABELS.grade, value: meta.letterGrade, tone: "grade" as const },
    {
      label: FREE_KPI_LABELS.checksFailed,
      value: String(issues.failed),
      tone: alarmSeverity && issues.failed > 0 ? ("critical" as const) : ("default" as const),
    },
    { label: FREE_KPI_LABELS.warnings, value: String(issues.warnings), tone: "default" as const },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 break-inside-avoid">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-gray-200 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {item.label}
          </p>
          <p
            className={cn(
              "text-xl font-bold mt-0.5",
              item.tone === "critical" ? "text-red-700" : "text-gray-900",
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function PriorityOrVerifiedBlock({
  report,
  alarmSeverity,
  criticalIssue,
  className,
  bodyClassName,
}: {
  report: LevelstackReportJson
  alarmSeverity: boolean
  criticalIssue: string | null
  className?: string
  bodyClassName?: string
}) {
  const verified = verifiedChecksList(report.signalRows)

  if (criticalIssue) {
    return (
      <div className={className}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
          {alarmSeverity ? "Most critical issue" : "Priority finding"}
        </p>
        <FormattedReportText
          text={criticalIssue}
          paragraphClassName={bodyClassName}
          emphasizeLeadIn={false}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        What we verified
      </p>
      {verified.length > 0 ? (
        <ul className="list-none pl-0 space-y-1">
          {verified.map((label) => (
            <li key={label} className="text-sm text-gray-800">
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm font-medium text-gray-900", bodyClassName)}>
          Both free diagnostic areas came back clean on the checks we ran.
        </p>
      )}
    </div>
  )
}

export function ReportPrintViewFree({ report, reportId }: ReportPrintViewFreeProps) {
  const { meta, sections } = report
  const content = resolveExecutiveContent(report)
  const competitive = resolveCompetitiveSnapshot(report)
  const headline = freeExecutiveHeadline(report)
  const leverage = splitFirstSentence(content.highlights.highestLeverageOpportunity)
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const upgradeUrl = getHubUpgradeUrl({ reportId, source: "levelstack_print" })
  const alarmSeverity = shouldUseAlarmSeverity(report)
  const criticalIssue = content.highlights.criticalIssue
  const priority = content.highlights.priorityFinding
  /** Observation-only for the "What it means" priority card — avoids duplicating consequence. */
  const whatItMeansIssue = priority?.observation ?? criticalIssue
  const whatItMeansImpact =
    priority?.consequence ?? content.highlights.businessImpact

  const search = sections.find((s) => s.id === "search_footprint")
  const searchFinding = search?.findings[0]
  const searchFindingSeverity = searchFinding
    ? effectiveFindingSeverity("search_footprint", searchFinding)
    : null
  const previewCompetitor = competitive?.rows[0]
  const nextDecisions = freeExecutiveNextDecisions(report)

  const insightRows = [
    {
      label: "What prospects see",
      parts: content.structuredInsights?.whatProspectsSee,
      body: content.insights.whatProspectsSee,
    },
    {
      label: "Social presence",
      parts: content.structuredInsights?.reputationGap,
      body: content.insights.reputationGap,
    },
    {
      label: "Where you're exposed",
      parts: content.structuredInsights?.revenueRisk,
      body: content.insights.revenueRisk,
    },
  ]

  return (
    <article className="max-w-4xl mx-auto p-8 text-black bg-white text-sm leading-relaxed print:p-6">
      <PrintHeader report={report} />

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">Executive Summary</h2>

        <p className="text-base font-semibold text-gray-900 mb-4 leading-snug">
          {headline.lead}{" "}
          <span className="font-normal text-gray-700">{headline.follow}</span>
        </p>

        <KpiStrip report={report} alarmSeverity={alarmSeverity} />

        <PriorityOrVerifiedBlock
          report={report}
          alarmSeverity={alarmSeverity}
          criticalIssue={criticalIssue}
          className={cn(
            "border-l-4 px-4 py-3 mb-6 break-inside-avoid",
            alarmSeverity && criticalIssue
              ? "border-red-600 bg-red-50"
              : "border-amber-500 bg-amber-50",
          )}
          bodyClassName={cn(
            "text-sm font-medium",
            alarmSeverity && criticalIssue ? "text-red-900" : "text-gray-900",
          )}
        />

        <div className="mb-6 space-y-3 break-inside-avoid">
          {insightRows.map((row) => (
            <div key={row.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 mb-0.5">
                {row.label}
              </p>
              {row.parts ? (
                <ExecutiveInsightBody
                  parts={row.parts}
                  paragraphClassName="text-sm text-gray-700"
                  mutedClassName="text-sm text-gray-500"
                />
              ) : (
                <FormattedReportText
                  text={row.body}
                  paragraphClassName="text-sm text-gray-700"
                  emphasizeLeadIn={false}
                />
              )}
            </div>
          ))}
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Your free snapshot sections
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 break-inside-avoid">
          {FREE_EXECUTIVE_SECTION_ORDER.map(({ id, label }) => {
            const section = sectionById.get(id)
            if (!section) return null
            const accent = sectionScoreAccent(id)
            return (
              <div key={id} className="rounded border border-gray-200 p-3">
                <p className="font-semibold" style={{ color: accent.bar }}>
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
                <p className="text-xs text-gray-800 mt-1">{label}</p>
              </div>
            )
          })}
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          What it means
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-6 break-inside-avoid">
          <PriorityOrVerifiedBlock
            report={report}
            alarmSeverity={alarmSeverity}
            criticalIssue={whatItMeansIssue}
            className={cn(
              "rounded border p-3",
              alarmSeverity && whatItMeansIssue
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50",
            )}
            bodyClassName={cn(
              "text-xs",
              alarmSeverity && whatItMeansIssue ? "text-red-950" : "text-gray-900",
            )}
          />
          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-sky-800 mb-1">Business impact</p>
            <FormattedReportText
              text={whatItMeansImpact}
              paragraphClassName="text-xs text-sky-950"
              emphasizeLeadIn={false}
            />
          </div>
          <div className="rounded border border-green-200 bg-green-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-green-800 mb-1">
              Highest leverage opportunity
            </p>
            <FormattedReportText
              text={leverage.rest ? leverage.first : content.highlights.highestLeverageOpportunity}
              paragraphClassName="text-xs text-green-950"
              emphasizeLeadIn={false}
            />
            {leverage.rest ? (
              <p className="text-[10px] text-green-900 italic mt-2">
                Full competitive and funnel analysis included in the Action Roadmap ($97).
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6 break-inside-avoid">
          {competitive ? (
            <div className="rounded border border-gray-200 p-4">
              <h3 className="font-medium mb-2">Competitive snapshot</h3>
              <p className="text-xs text-gray-500 mb-2">
                Search: &apos;{competitive.searchQuery}&apos;
              </p>
              <p className="text-xs font-medium text-red-800 bg-red-50 border border-red-100 rounded px-2 py-1.5 mb-2">
                {competitive.positionAlert}
              </p>
              {previewCompetitor ? (
                <p className="text-xs text-gray-700">
                  <strong>#1</strong> {previewCompetitor.domain} — SERP #{previewCompetitor.serpPosition}
                </p>
              ) : null}
              <p className="text-xs text-gray-500 mt-2 italic">
                Unlock the Action Roadmap ($97) for full competitive rankings and comparison.
              </p>
            </div>
          ) : null}

          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-medium mb-2">Search Visibility highlight</h3>
            {searchFinding && searchFindingSeverity ? (
              <>
                <FormattedReportText
                  text={searchFinding.value || searchFinding.label}
                  paragraphClassName="text-sm font-medium text-gray-900"
                  emphasizeLeadIn={false}
                />
                {searchFinding.detail ? (
                  <FormattedReportText
                    text={searchFinding.detail}
                    paragraphClassName="text-xs text-gray-600 mt-1"
                    emphasizeLeadIn={false}
                  />
                ) : null}
                <PrintSeverityPill
                  severity={searchFindingSeverity}
                  className="mt-2"
                />
              </>
            ) : (
              <p className="text-xs text-gray-600">See Search Visibility section below.</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6 break-inside-avoid">
          <div>
            <h3 className="font-medium mb-2">Your next decisions</h3>
            <ul className="list-none pl-0 space-y-2">
              {nextDecisions.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 items-start border-b border-gray-100 pb-2 last:border-0"
                >
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-400 text-[11px] font-bold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 italic mt-2">
              Full 90-day action plan included in Action Roadmap ($97).
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Strengths &amp; opportunities</h3>
            {content.strengths[0] ? (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">
                  Strength
                </p>
                <FormattedReportText
                  text={content.strengths[0]}
                  paragraphClassName="text-xs text-gray-700"
                  emphasizeLeadIn={false}
                />
              </div>
            ) : null}
            {content.topOpportunities[0] ? (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">
                  Opportunity
                </p>
                <FormattedReportText
                  text={content.topOpportunities[0]}
                  paragraphClassName="text-xs text-gray-700"
                  emphasizeLeadIn={false}
                />
              </div>
            ) : null}
            {content.strengths.length > 1 || content.topOpportunities.length > 1 ? (
              <p className="text-xs text-gray-500 italic">
                Additional strengths and opportunities in Action Roadmap ($97).
              </p>
            ) : null}
            {content.strengths.length === 0 && content.topOpportunities.length === 0 ? (
              <p className="text-xs text-gray-600">
                See section details below for findings from your free snapshot.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {FREE_EXECUTIVE_SECTION_ORDER.map(({ id, label }) => {
        const section = sectionById.get(id)
        if (!section) return null
        return (
          <section key={id} className="mb-8 break-inside-avoid">
            <h2 className="text-base font-semibold uppercase mb-2">
              {typeof section.score === "number" &&
              section.status !== "insufficient_data"
                ? `${label} (${section.score}/100)`
                : `${label} (Insufficient data)`}
            </h2>
            {section.aiPreview && section.aiPreview.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--rpt-muted,#6b7280)] mb-1">
                  AI search visibility
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Checked {report.meta.reportDate}. Summary shown when prospects ask AI about you.
                </p>
                {section.aiPreview.map((ai, i) => (
                  <div
                    key={i}
                    className="mb-2 rounded-lg border border-[var(--rpt-card-border,#e2e8f0)] bg-white p-3 shadow-sm"
                  >
                    <p className="text-xs font-semibold text-gray-600">
                      {ai.platform}
                    </p>
                    <p className="text-sm text-gray-800 mt-1 leading-relaxed">{ai.result}</p>
                    <PrintSeverityPill
                      severity={ai.severity}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {section.findings.map((f, i) => (
              <FindingPrintBlock key={i} sectionId={id} finding={f} />
            ))}
          </section>
        )
      })}

      <section className="mb-6 rounded border border-orange-200 bg-orange-50 p-4 break-inside-avoid">
        <h3 className="font-semibold text-orange-900 mb-1">Upgrade to Action Roadmap — $97</h3>
        <p className="text-xs text-orange-950 leading-relaxed">
          This free snapshot covers Search Visibility and social &amp; off-site presence. The Full
          Report adds reputation, digital presence, revenue funnel diagnosis, competitive
          context, a complete prioritized 90-day action plan, and a downloadable PDF for your team.
        </p>
        <p className="text-xs text-orange-900 mt-2 font-medium break-all">{upgradeUrl}</p>
      </section>

      <footer className="border-t pt-4 text-xs text-gray-500 italic">
        Generated by LevelStack · Level Play Digital. As of {meta.reportDate}. Free snapshot —
        {REPORT_SCORE_FOOTER}
      </footer>
    </article>
  )
}
