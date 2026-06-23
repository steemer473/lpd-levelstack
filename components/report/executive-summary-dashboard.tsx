"use client"

import { AlertTriangle, ArrowRight, Check, Lock } from "lucide-react"

import { FormattedReportText } from "@/components/report/formatted-report-text"
import { UpsellBlurOverlay } from "@/components/report/upsell-blur-overlay"
import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"
import {
  EXECUTIVE_METRIC_CARD_ORDER,
  executiveDashboardIntro,
  PAID_TAB_IDS,
  readinessHeadline,
  sectionScoreAccent,
  TAB_ICONS,
} from "@/lib/report/display-helpers"
import { resolveExecutiveContent } from "@/lib/report/executive-summary-resolve"
import { cn } from "@/lib/utils"

type ExecutiveSummaryDashboardProps = {
  report: LevelstackReportJson
  onSelectTab: (tabId: string) => void
}

type BadgeLevel = "high" | "medium" | "low"

function PriorityBadge({ level }: { level: BadgeLevel }) {
  return (
    <span
      className={cn(
        "rpt-badge",
        level === "high" && "rpt-badge-high",
        level === "medium" && "rpt-badge-medium",
        level === "low" && "rpt-badge-low",
      )}
    >
      {level}
    </span>
  )
}

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

function OverallScoreCard({ meta }: { meta: LevelstackReportJson["meta"] }) {
  return (
    <div className="rpt-overall-score-card">
      <div className="score-main">
        <p className="score-label">Overall score</p>
        <p className="score-val">
          {meta.overallScore}
          <span className="score-denom">/100</span>
        </p>
        <p className="readiness">{readinessHeadline(meta.overallScore)}</p>
      </div>
      <p className="grade" aria-label={`Grade ${meta.letterGrade}`}>
        {meta.letterGrade}
      </p>
    </div>
  )
}

function InsightListIcon({ variant }: { variant: "strength" | "opportunity" }) {
  const Icon = variant === "strength" ? Check : AlertTriangle
  return (
    <span
      className={cn(
        "rpt-insight-icon",
        variant === "strength" ? "rpt-insight-icon-strength" : "rpt-insight-icon-opportunity",
      )}
      aria-hidden
    >
      <Icon className="rpt-insight-icon-svg" strokeWidth={2.25} />
    </span>
  )
}
function SectionMetricCard({
  cardId,
  label,
  section,
  locked,
  onSelect,
}: {
  cardId: string
  label: string
  section?: ReportSection
  locked: boolean
  onSelect: () => void
}) {
  const Icon = TAB_ICONS[cardId]
  const accent = sectionScoreAccent(cardId)
  const score = section?.score ?? 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rpt-section-score-card transition-shadow",
        locked
          ? "is-locked hover:ring-2 hover:ring-[#38bdf8]/20"
          : "hover:ring-2 hover:ring-[#38bdf8]/30",
      )}
    >
      <span
        className={cn(
          "rpt-metric-icon-circle",
          accent.icon,
          locked && "opacity-60",
        )}
      >
        {Icon ? <Icon className="rpt-metric-icon" strokeWidth={2} aria-hidden /> : null}
      </span>
      {locked ? (
        <p className="rpt-metric-score rpt-metric-score-locked">
          <Lock className="h-3 w-3 inline-block mr-0.5 opacity-60 align-[-2px]" aria-hidden />
          <span className="blur-[3px] select-none rpt-metric-score-num" aria-hidden>
            {score}
          </span>
          <span className="rpt-metric-denom">/100</span>
        </p>
      ) : (
        <p className="rpt-metric-score">
          <span className="rpt-metric-score-num" style={{ color: accent.bar }}>
            {score}
          </span>
          <span className="rpt-metric-denom">/100</span>
        </p>
      )}
      <p className="rpt-metric-label">{label}</p>
      <div className="score-bar-track">
        <span
          className={cn("score-bar-fill", locked && "opacity-40")}
          style={{
            width: locked ? "62%" : `${score}%`,
            backgroundColor: accent.bar,
          }}
        />
      </div>
      <p className={cn("rpt-metric-pct", locked && "rpt-metric-pct-locked")}>
        {locked ? (
          <>
            <span className="blur-[3px] select-none" aria-hidden>
              {score}%
            </span>
          </>
        ) : (
          `${score}%`
        )}
      </p>
    </button>
  )
}

export function ExecutiveSummaryDashboard({
  report,
  onSelectTab,
}: ExecutiveSummaryDashboardProps) {
  const { meta, sections, actionPlan } = report
  const isFree = meta.reportTier === "free_snapshot"
  const content = resolveExecutiveContent(report)
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const intro = executiveDashboardIntro(report)

  const strengths = content.strengths
  const opportunities = content.topOpportunities
  const visibleStrengths = isFree ? strengths.slice(0, 3) : strengths
  const hiddenStrengths = isFree ? strengths.slice(3) : []
  const visibleOpps = isFree ? opportunities.slice(0, 3) : opportunities
  const hiddenOpps = isFree ? opportunities.slice(3) : []

  return (
    <div className="rpt-dash-panel">
      <div className="rpt-dash-header">
        <div className="rpt-dash-intro-block">
          <h2 className="rpt-dash-title">Executive Summary</h2>
          <p className="rpt-dash-intro">{intro}</p>
          <p className="rpt-dash-date">Assessment date: {meta.reportDate}</p>
        </div>
        <OverallScoreCard meta={meta} />
      </div>

      <div className="rpt-section-score-strip">
        {EXECUTIVE_METRIC_CARD_ORDER.map(({ id, label }) => {
          const locked = isFree && PAID_TAB_IDS.has(id)
          return (
            <SectionMetricCard
              key={id}
              cardId={id}
              label={label}
              section={sectionById.get(id)}
              locked={locked}
              onSelect={() => onSelectTab(id)}
            />
          )
        })}
      </div>

      <div className="rpt-strengths-opps">
        <div className="rpt-insight-panel">
          <h3>Top strengths</h3>
          <ul className="list-none pl-0">
            {visibleStrengths.map((s, i) => (
              <li key={i} className="rpt-list-item">
                <InsightListIcon variant="strength" />
                <FormattedReportText
                  text={s}
                  paragraphClassName="rpt-insight-text"
                  emphasizeLeadIn={false}
                />
              </li>
            ))}
          </ul>
          {hiddenStrengths.length > 0 ? (
            <UpsellBlurOverlay message="Unlock all strengths in your Full Report">
              <ul className="list-none pl-0">
                {hiddenStrengths.map((s, i) => (
                  <li key={i} className="rpt-list-item">
                    <InsightListIcon variant="strength" />
                    <span className="rpt-insight-text">{s}</span>
                  </li>
                ))}
              </ul>
            </UpsellBlurOverlay>
          ) : null}
          <button
            type="button"
            onClick={() => onSelectTab("search_footprint")}
            className="rpt-link-sm"
          >
            View full report
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className="rpt-insight-panel">
          <h3>Top opportunities</h3>
          <ul className="list-none pl-0">
            {visibleOpps.map((o, i) => (
              <li key={i} className="rpt-list-item">
                <InsightListIcon variant="opportunity" />
                <FormattedReportText
                  text={o}
                  paragraphClassName="rpt-insight-text"
                  emphasizeLeadIn={false}
                />
              </li>
            ))}
          </ul>
          {hiddenOpps.length > 0 ? (
            <UpsellBlurOverlay message="Unlock all opportunities in your Full Report">
              <ul className="list-none pl-0">
                {hiddenOpps.map((o, i) => (
                  <li key={i} className="rpt-list-item">
                    <InsightListIcon variant="opportunity" />
                    <span className="rpt-insight-text">{o}</span>
                  </li>
                ))}
              </ul>
            </UpsellBlurOverlay>
          ) : null}
          <button
            type="button"
            onClick={() => onSelectTab("action_plan")}
            className="rpt-link-sm"
          >
            View all recommendations
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {actionPlan.thisWeek.length > 0 ? (
        <div className="rpt-priority-section">
          <h3 className="rpt-priority-title">Priority actions</h3>
          <div className="overflow-x-auto">
            <table className="rpt-priority-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Impact</th>
                  <th>Effort</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {actionPlan.thisWeek.map((item, i) => {
                  const badges = deriveActionBadges(i)
                  return (
                    <tr key={i}>
                      <td>
                        <p className="font-medium text-[var(--rpt-heading)] leading-snug">
                          {item.task}
                        </p>
                        {item.sub ? (
                          <p className="text-xs text-[var(--rpt-muted)] mt-0.5 line-clamp-2">
                            {item.sub}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <PriorityBadge level={badges.impact} />
                      </td>
                      <td>
                        <PriorityBadge level={badges.effort} />
                      </td>
                      <td>
                        <PriorityBadge level={badges.priority} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("action_plan")}
            className="rpt-link-sm mt-3"
          >
            View all recommendations
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      <p className="rpt-muted-text text-xs text-center mt-8">
        Diagnostic only — LevelStack does not guarantee rankings or revenue outcomes.
      </p>
    </div>
  )
}
