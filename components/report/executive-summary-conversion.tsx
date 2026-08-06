"use client"

import {
  AlertTriangle,
  ArrowRight,
  Check,
} from "lucide-react"

import { ExecutiveInsightBody } from "@/components/report/executive-insight-body"
import { FormattedReportText } from "@/components/report/formatted-report-text"
import { ReportFieldHint } from "@/components/report/report-field-hint"
import { ScoreBreakdown } from "@/components/report/score-breakdown"
import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"
import {
  FREE_EXECUTIVE_SECTION_ORDER,
  sectionScoreAccent,
} from "@/lib/report/display-helpers"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "@/lib/report/executive-summary-resolve"
import {
  FREE_KPI_LABELS,
  FREE_SCORE_LABEL,
  REPORT_SCORE_FOOTER,
  diagnosticAreaCounts,
  freeExecutiveHeadline,
  freeScanIssueCounts,
  freeScoreBasisLine,
  verifiedChecksList,
} from "@/lib/report/free-executive-copy"
import { PRODUCT_NAMES } from "@/lib/report/outcome-copy"
import { shouldUseAlarmSeverity } from "@/lib/report/severity-presentation"
import { teaserRecommendations } from "@/lib/report/roadmap-from-recommendations"
import { cn } from "@/lib/utils"

type ExecutiveSummaryConversionProps = {
  report: LevelstackReportJson
  onSelectTab: (tabId: string) => void
  reportId?: string
}

function OverallScoreCard({
  meta,
  basisLine,
}: {
  meta: LevelstackReportJson["meta"]
  basisLine: string
}) {
  return (
    <div className="rpt-overall-score-card">
      <div className="score-main">
        <div className="mb-0.5 flex items-center gap-1">
          <p className="score-label mb-0">{FREE_SCORE_LABEL}</p>
          <ReportFieldHint label={FREE_SCORE_LABEL} detail={basisLine} />
        </div>
        <p className="score-val">
          {meta.overallScore}
          <span className="score-denom">/100</span>
        </p>
      </div>
      <p className="grade" aria-label={`Grade so far, ${meta.letterGrade}`}>
        {meta.letterGrade}
      </p>
    </div>
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
    {
      label: FREE_KPI_LABELS.score,
      value: String(meta.overallScore),
      critical: false,
      grade: false,
    },
    {
      label: FREE_KPI_LABELS.grade,
      value: meta.letterGrade,
      critical: false,
      grade: true,
    },
    {
      label: FREE_KPI_LABELS.checksFailed,
      value: String(issues.failed),
      critical: alarmSeverity && issues.failed > 0,
      grade: false,
    },
    {
      label: FREE_KPI_LABELS.warnings,
      value: String(issues.warnings),
      critical: false,
      grade: false,
    },
  ]

  return (
    <div className="rpt-conv-kpi-strip">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rpt-conv-kpi",
            item.critical && "is-critical",
            item.grade && "is-grade",
          )}
        >
          <p className="rpt-conv-kpi-label">{item.label}</p>
          <p className="rpt-conv-kpi-value">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function FreeSectionCard({
  section,
  label,
  onSelect,
}: {
  section: ReportSection
  label: string
  onSelect: () => void
}) {
  const accent = sectionScoreAccent(section.id)
  const hasScore =
    typeof section.score === "number" && section.status !== "insufficient_data"

  return (
    <button type="button" onClick={onSelect} className="rpt-conv-sec-card">
      <p className="rpt-conv-sec-score">
        {hasScore ? (
          <>
            <span style={{ color: accent.bar }}>{section.score}</span>
            <span className="rpt-conv-sec-denom">/100</span>
          </>
        ) : (
          <span style={{ color: accent.bar }} className="text-[0.75em]">
            Not scored — limited data in this scan
          </span>
        )}
      </p>
      <p className="rpt-conv-sec-name">{label}</p>
      <span className="rpt-conv-sec-link">
        View section
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </button>
  )
}

function NextDecisionItem({
  title,
  summary,
}: {
  title: string
  summary?: string
}) {
  return (
    <li>
      <strong>{title}</strong>
      {summary ? <span>{summary}</span> : null}
    </li>
  )
}

export function ExecutiveSummaryConversion({
  report,
  onSelectTab,
  reportId,
}: ExecutiveSummaryConversionProps) {
  const { meta, sections } = report
  const content = resolveExecutiveContent(report)
  const competitive = resolveCompetitiveSnapshot(report)
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const headline = freeExecutiveHeadline(report)
  const alarmSeverity = shouldUseAlarmSeverity(report)
  const counts = diagnosticAreaCounts()
  const verified = verifiedChecksList(report.signalRows)
  const basisLine = freeScoreBasisLine()
  const teaser = teaserRecommendations(report, 3)

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

  const workingItems = content.strengths.slice(0, 3)
  const exposedItems = [
    ...content.topOpportunities.slice(0, 2),
    `Reputation, digital presence, revenue funnel, and competitive context (${counts.unopened} areas) remain locked on this Visibility Snapshot.`,
  ]

  const priority = content.highlights.priorityFinding

  return (
    <div className="rpt-dash-panel rpt-conv-panel">
      <div className="rpt-conv-dash-header">
        <div className="rpt-conv-headline-block">
          <h2 className="rpt-conv-headline">Executive Summary</h2>
          <p className="rpt-conv-subheadline">
            {headline.lead}{" "}
            <span className="rpt-conv-subheadline-muted">{headline.follow}</span>
          </p>
        </div>
        <OverallScoreCard meta={meta} basisLine={basisLine} />
      </div>

      <KpiStrip report={report} alarmSeverity={alarmSeverity} />

      <div className="mb-4">
        <ScoreBreakdown report={report} reportId={reportId} />
      </div>

      {priority ? (
        <div
          className={cn(
            "rpt-conv-pull-quote",
            alarmSeverity ? "is-alarm" : "is-priority",
          )}
        >
          <p className="rpt-conv-pull-quote-label">
            {alarmSeverity ? "Most critical issue" : "Priority finding"}
          </p>
          <FormattedReportText
            text={priority.observation}
            paragraphClassName="rpt-conv-pull-quote-body text-[0.9375rem] font-medium leading-snug"
            emphasizeLeadIn={false}
          />
          <FormattedReportText
            text={priority.consequence}
            paragraphClassName="rpt-muted-text text-sm mt-2 leading-snug"
            emphasizeLeadIn={false}
          />
        </div>
      ) : (
        <div className="rpt-conv-pull-quote is-priority">
          <p className="rpt-conv-pull-quote-label">What we verified</p>
          {verified.length > 0 ? (
            <ul className="list-none pl-0 space-y-1.5 mt-1">
              {verified.map((label) => (
                <li key={label} className="flex items-start gap-2 text-sm">
                  <Check
                    className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--rpt-green,#5cb85c)]"
                    aria-hidden
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rpt-conv-pull-quote-body text-[0.9375rem] font-medium leading-snug">
              Both free diagnostic areas came back clean on the checks we ran.
            </p>
          )}
        </div>
      )}

      <div className="rpt-conv-insights">
        {insightRows.map((row) => (
          <div key={row.label} className="rpt-conv-insight-row">
            <p className="rpt-conv-insight-label">{row.label}</p>
            {row.parts ? (
              <ExecutiveInsightBody
                parts={row.parts}
                paragraphClassName="text-sm text-[var(--rpt-body)]"
                mutedClassName="text-sm text-[var(--rpt-muted)]"
              />
            ) : (
              <FormattedReportText
                text={row.body}
                paragraphClassName="text-sm text-[var(--rpt-body)]"
                emphasizeLeadIn={false}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rpt-conv-sec-cards">
        {FREE_EXECUTIVE_SECTION_ORDER.map(({ id, label }) => {
          const section = sectionById.get(id)
          if (!section) return null
          return (
            <FreeSectionCard
              key={id}
              section={section}
              label={label}
              onSelect={() => onSelectTab(id)}
            />
          )
        })}
      </div>

      <div className="rpt-conv-bottom-row">
        <div className="rpt-card p-5">
          <h3 className="rpt-card-title mb-4">What&apos;s working</h3>
          {workingItems.length > 0 ? (
            <ul className="space-y-2 list-none pl-0">
              {workingItems.map((s, i) => (
                <li key={i} className="rpt-conv-strength-item">
                  <span className="rpt-conv-strength-icon is-strength" aria-hidden>
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <FormattedReportText
                    text={s}
                    paragraphClassName="text-sm text-[var(--rpt-body)]"
                    emphasizeLeadIn={false}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rpt-muted-text text-sm">
              See Search footprint and Social &amp; off-site for verified public signals.
            </p>
          )}
        </div>

        <div className="rpt-card p-5">
          <h3 className="rpt-card-title mb-4">Where you&apos;re exposed</h3>
          <ul className="space-y-2 list-none pl-0">
            {exposedItems.map((o, i) => (
              <li key={i} className="rpt-conv-strength-item">
                <span className="rpt-conv-strength-icon is-opportunity" aria-hidden>
                  <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <FormattedReportText
                  text={o}
                  paragraphClassName="text-sm text-[var(--rpt-body)]"
                  emphasizeLeadIn={false}
                />
              </li>
            ))}
          </ul>
          <p className="rpt-muted-text text-xs mt-3">
            {counts.unopened} diagnostic areas remain locked — open them in your{" "}
            {PRODUCT_NAMES.paid}.
          </p>
        </div>
      </div>

      <div className="rpt-card p-5 mt-4">
        <h3 className="rpt-card-title mb-4">Your next decisions</h3>
        {teaser.titles.length > 0 ? (
          <ul className="rpt-conv-action-list list-none pl-0">
            {teaser.titles.map((title, i) => (
              <NextDecisionItem
                key={i}
                title={title}
                summary={
                  teaser.summaries[i]
                    ? teaser.summaries[i]
                    : "Decide whether to act on this signal, then check the matching Search or Social section for evidence."
                }
              />
            ))}
          </ul>
        ) : (
          <ul className="rpt-conv-action-list list-none pl-0">
            <NextDecisionItem
              title="Confirm what Google shows for your brand name"
              summary="Open Search footprint, compare the live snippet to your site, and note any mismatch."
            />
            <NextDecisionItem
              title="Check which social profiles appear publicly"
              summary="Open Social & off-site, decide which missing profiles matter for how prospects vet you."
            />
            <NextDecisionItem
              title="Decide whether to unlock the remaining four areas"
              summary="Reputation, digital presence, funnel, and competitive context are where revenue problems usually hide."
            />
          </ul>
        )}
        <p className="rpt-muted-text text-xs mt-4">
          Full prioritized action plan stays locked on this Visibility Snapshot.
        </p>
      </div>

      {competitive ? (
        <p className="rpt-muted-text text-xs mt-4 text-center">
          Competitive rankings for &apos;{competitive.searchQuery}&apos; sit in a locked
          area — open them in your Action Roadmap.
        </p>
      ) : null}

      <p className="rpt-muted-text text-xs text-center mt-8">{REPORT_SCORE_FOOTER}</p>
    </div>
  )
}
