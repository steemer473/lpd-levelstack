"use client"

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  DollarSign,
  Gem,
  Sparkles,
  Star,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react"

import { SectionGuideInfo } from "@/components/report/section-guide-info"
import { FormattedReportText } from "@/components/report/formatted-report-text"
import { UpsellBlurOverlay } from "@/components/report/upsell-blur-overlay"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "@/lib/report/executive-summary-resolve"
import { filterDistinctActionTasks } from "@/lib/report/executive-dedup"
import { cn } from "@/lib/utils"

type ExecutiveSummaryV2Props = {
  report: LevelstackReportJson
  onSelectTab: (tabId: string) => void
}

const TIMELINE_PHASES = [
  {
    key: "thisWeek" as const,
    days: "0–30 Days",
    title: "Stabilize & Build Trust",
    focus: "Trust & Credibility",
    colorClass: "rpt-phase-blue",
    checkClass: "rpt-check-blue",
    pillClass: "rpt-pill-blue",
  },
  {
    key: "thisMonth" as const,
    days: "31–60 Days",
    title: "Improve Conversion",
    focus: "Funnel Optimization",
    colorClass: "rpt-phase-orange",
    checkClass: "rpt-check-orange",
    pillClass: "rpt-pill-orange",
  },
  {
    key: "thisQuarter" as const,
    days: "61–90 Days",
    title: "Grow & Differentiate",
    focus: "Growth & Authority",
    colorClass: "rpt-phase-green",
    checkClass: "rpt-check-green",
    pillClass: "rpt-pill-green",
  },
]

function splitFirstSentence(text: string): { first: string; rest: string } {
  const match = text.match(/^(.+?[.!?])(?:\s+([\s\S]+))?$/)
  if (!match?.[1]) return { first: text, rest: "" }
  return { first: match[1], rest: match[2] ?? "" }
}

function InsightCard({
  icon: Icon,
  title,
  body,
  circleClass,
}: {
  icon: LucideIcon
  title: string
  body: string
  circleClass: string
}) {
  return (
    <div className="rpt-card p-4 h-full">
      <div className="flex items-start gap-3 mb-2">
        <div className={cn("rpt-icon-circle", circleClass)}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <p className="rpt-card-title pt-0.5 normal-case tracking-normal text-[15px]">{title}</p>
      </div>
      <FormattedReportText text={body} paragraphClassName="rpt-body-text" />
    </div>
  )
}

function HighlightCard({
  title,
  body,
  tintClass,
  icon: Icon,
}: {
  title: string
  body: string
  tintClass: string
  icon: LucideIcon
}) {
  return (
    <div className={cn("rounded-lg border p-4 h-full", tintClass)}>
      <div className="flex items-start gap-2 mb-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <p className="rpt-caption">{title}</p>
      </div>
      <FormattedReportText
        text={body}
        paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
      />
    </div>
  )
}

function PhaseColumn({
  phase,
  items,
}: {
  phase: (typeof TIMELINE_PHASES)[number]
  items: { task: string }[]
}) {
  return (
    <div>
      <p className={cn("rpt-caption", phase.colorClass)}>{phase.days}</p>
      <p className="rpt-card-title mt-0.5 normal-case tracking-normal text-sm">
        {phase.title}
      </p>
      <ul className="mt-3 space-y-2 list-none pl-0">
        {items.length > 0 ? (
          items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5",
                  phase.checkClass,
                )}
              >
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <FormattedReportText
                text={item.task}
                paragraphClassName="rpt-muted-text text-sm leading-snug"
                emphasizeLeadIn={false}
              />
            </li>
          ))
        ) : (
          <li className="rpt-muted-text text-xs italic">
            Prioritized tasks in this phase are in the Full Report.
          </li>
        )}
      </ul>
      <span
        className={cn(
          "inline-block mt-4 px-3 py-2 rpt-caption normal-case tracking-normal",
          phase.pillClass,
        )}
      >
        Focus: {phase.focus}
      </span>
    </div>
  )
}

function CompetitiveTable({
  rows,
}: {
  rows: { rank: number; domain: string; serpPosition: number }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr
            className="border-b text-[10px] uppercase tracking-wider"
            style={{ borderColor: "var(--rpt-card-border)", color: "var(--rpt-muted)" }}
          >
            <th className="text-left py-2 pr-2 font-medium">#</th>
            <th className="text-left py-2 pr-2 font-medium">Domain</th>
            <th className="text-left py-2 font-medium">SERP position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rank}
              className="border-b"
              style={{ borderColor: "color-mix(in srgb, var(--rpt-card-border) 60%, white)" }}
            >
              <td className="py-2 pr-2 rpt-muted-text tabular-nums">{row.rank}</td>
              <td
                className="py-2 pr-2 font-medium truncate max-w-[160px]"
                style={{ color: "var(--rpt-heading)" }}
              >
                {row.domain}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 rounded-full overflow-hidden w-16"
                    style={{ background: "color-mix(in srgb, var(--rpt-muted) 25%, white)" }}
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full rpt-bar-blue"
                      style={{
                        width: `${Math.max(10, 100 - row.serpPosition * 8)}%`,
                      }}
                    />
                  </span>
                  <span className="text-xs tabular-nums rpt-muted-text">
                    #{row.serpPosition}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ExecutiveSummaryV2({ report, onSelectTab }: ExecutiveSummaryV2Props) {
  const isFree = report.meta.reportTier === "free_snapshot"
  const content = resolveExecutiveContent(report)
  const competitive = resolveCompetitiveSnapshot(report)
  const { actionPlan } = report

  const phaseItems = {
    thisWeek: filterDistinctActionTasks(actionPlan.thisWeek, [
      content.highlights.criticalIssue,
      content.highlights.highestLeverageOpportunity,
    ]),
    thisMonth: actionPlan.thisMonth,
    thisQuarter: actionPlan.thisQuarter,
  }

  const leverage = splitFirstSentence(content.highlights.highestLeverageOpportunity)
  const lockedPhases = TIMELINE_PHASES.filter((p) => p.key !== "thisWeek")

  const previewCompetitor = competitive?.rows[0]
  const hiddenCompetitorCount = Math.max(
    0,
    (competitive?.competitorCount ?? 0) - (previewCompetitor ? 1 : 0),
  )

  return (
    <div className="rpt-section-content px-6 py-5 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" style={{ color: "var(--rpt-blue-link)" }} aria-hidden />
          <h2 className="rpt-section-title">AI Executive Assessment</h2>
          <SectionGuideInfo tabId="executive_summary" />
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <InsightCard
            icon={Users}
            title="What Prospects See"
            body={content.insights.whatProspectsSee}
            circleClass="rpt-icon-circle--blue"
          />
          <InsightCard
            icon={Star}
            title="Reputation Gap"
            body={content.insights.reputationGap}
            circleClass="rpt-icon-circle--orange"
          />
          <InsightCard
            icon={DollarSign}
            title="Revenue Risk"
            body={content.insights.revenueRisk}
            circleClass="rpt-icon-circle--green"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <HighlightCard
            title="Most Critical Issue"
            body={content.highlights.criticalIssue}
            tintClass="rpt-highlight-critical"
            icon={AlertTriangle}
          />
          <HighlightCard
            title="Business Impact"
            body={content.highlights.businessImpact}
            tintClass="rpt-highlight-blue"
            icon={BarChart3}
          />
          {isFree && leverage.rest ? (
            <div className="rounded-lg border p-4 h-full rpt-highlight-green">
              <div className="flex items-start gap-2 mb-2">
                <Target className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <p className="rpt-caption">Highest Leverage Opportunity</p>
              </div>
              <FormattedReportText
                text={leverage.first}
                paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
                className="mb-2"
              />
              <UpsellBlurOverlay message="See your full competitive and funnel analysis">
                <FormattedReportText
                  text={leverage.rest}
                  paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
                />
              </UpsellBlurOverlay>
            </div>
          ) : (
            <HighlightCard
              title="Highest Leverage Opportunity"
              body={content.highlights.highestLeverageOpportunity}
              tintClass="rpt-highlight-green"
              icon={Target}
            />
          )}
        </div>
      </div>

      <div className="rpt-card p-5">
        <h3 className="rpt-card-title mb-4">What To Do First</h3>
        <div className="hidden md:block rpt-timeline-rail" aria-hidden />
        <div className="grid md:grid-cols-3 gap-4">
          <PhaseColumn phase={TIMELINE_PHASES[0]!} items={phaseItems.thisWeek} />
          {isFree ? (
            <div className="md:col-span-2">
              <UpsellBlurOverlay message="Unlock 6 more prioritized actions in your 90-day plan">
                <div className="grid md:grid-cols-2 gap-4">
                  {lockedPhases.map((phase) => (
                    <PhaseColumn
                      key={phase.key}
                      phase={phase}
                      items={phaseItems[phase.key]}
                    />
                  ))}
                </div>
              </UpsellBlurOverlay>
            </div>
          ) : (
            lockedPhases.map((phase) => (
              <PhaseColumn
                key={phase.key}
                phase={phase}
                items={phaseItems[phase.key]}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {competitive && (
          <div className="rpt-card p-5">
            <h3 className="rpt-card-title mb-3">Competitive Snapshot</h3>
            <p className="rpt-caption mb-2 normal-case tracking-normal">
              Search: &apos;{competitive.searchQuery}&apos;
            </p>
            <div className="rpt-alert-red rounded-md px-3 py-2 mb-4">
              <FormattedReportText
                text={competitive.positionAlert}
                paragraphClassName="text-sm font-medium"
                emphasizeLeadIn={false}
              />
            </div>
            {isFree ? (
              <>
                {previewCompetitor && (
                  <>
                    <p className="rpt-muted-text text-sm mb-3">
                      <span className="font-medium text-inherit">{previewCompetitor.domain}</span>{" "}
                      ranks #{previewCompetitor.serpPosition} for &apos;{competitive.searchQuery}&apos;
                    </p>
                    <CompetitiveTable rows={[previewCompetitor]} />
                  </>
                )}
                {hiddenCompetitorCount > 0 ? (
                  <p className="rpt-muted-text text-sm mt-3">
                    {previewCompetitor
                      ? `#1 is ${previewCompetitor.domain} — unlock to see all ${competitive.competitorCount ?? hiddenCompetitorCount + 1} competitors and how you compare`
                      : `${competitive.competitorCount ?? hiddenCompetitorCount} competitors analyzed — unlock to see who ranks above you`}
                  </p>
                ) : !previewCompetitor ? (
                  <p className="rpt-muted-text text-xs">
                    Unlock the full report for competitive rankings from live search data.
                  </p>
                ) : null}
              </>
            ) : competitive.rows.length > 0 ? (
              <CompetitiveTable rows={competitive.rows} />
            ) : (
              <p className="rpt-muted-text text-xs">
                SERP competitor data unavailable — see Competitive Context for full analysis.
              </p>
            )}
            <button
              type="button"
              onClick={() => onSelectTab("competitive_context")}
              className="rpt-link mt-4 inline-flex items-center gap-1"
            >
              {isFree
                ? "Unlock full competitive analysis"
                : "View full competitive analysis in Competitive Context"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="rpt-card p-5">
          <h3 className="rpt-card-title mb-4">Key Strengths &amp; Opportunities</h3>
          {content.strengths.length > 0 && (
            <div className="mb-4">
              <p className="rpt-caption mb-2">Strengths</p>
              <ul className="space-y-2 list-none pl-0">
                {content.strengths.slice(0, isFree ? 1 : content.strengths.length).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 rpt-strength-icon mt-0.5" aria-hidden />
                    <FormattedReportText
                      text={s}
                      paragraphClassName="rpt-muted-text text-sm"
                      emphasizeLeadIn={false}
                    />
                  </li>
                ))}
              </ul>
              {isFree && content.strengths.length > 1 && (
                <div className="mt-2">
                  <UpsellBlurOverlay message="Unlock all strengths in your Full Report">
                    <ul className="space-y-2 list-none pl-0">
                      {content.strengths.slice(1).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                          <FormattedReportText
                            text={s}
                            paragraphClassName="text-sm"
                            emphasizeLeadIn={false}
                          />
                        </li>
                      ))}
                    </ul>
                  </UpsellBlurOverlay>
                </div>
              )}
            </div>
          )}
          {content.topOpportunities.length > 0 && (
            <div>
              <p className="rpt-caption mb-2">Top Opportunities</p>
              <ul className="space-y-2 list-none pl-0">
                {content.topOpportunities
                  .slice(0, isFree ? 1 : content.topOpportunities.length)
                  .map((o, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Gem className="h-4 w-4 shrink-0 rpt-opportunity-icon mt-0.5" aria-hidden />
                      <FormattedReportText
                        text={o}
                        paragraphClassName="rpt-muted-text text-sm"
                        emphasizeLeadIn={false}
                      />
                    </li>
                  ))}
              </ul>
              {isFree && content.topOpportunities.length > 1 && (
                <div className="mt-2">
                  <UpsellBlurOverlay message="Unlock all opportunities in your Full Report">
                    <ul className="space-y-2 list-none pl-0">
                      {content.topOpportunities.slice(1).map((o, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Gem className="h-4 w-4 shrink-0" aria-hidden />
                          <FormattedReportText
                            text={o}
                            paragraphClassName="text-sm"
                            emphasizeLeadIn={false}
                          />
                        </li>
                      ))}
                    </ul>
                  </UpsellBlurOverlay>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onSelectTab("action_plan")}
            className="rpt-link mt-4 inline-flex items-center gap-1"
          >
            {isFree
              ? "Unlock full action plan"
              : "See all opportunities in Action Plan section"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <p className="rpt-muted-text text-xs text-center px-6 pb-4">
        Diagnostic only — LevelStack does not guarantee rankings or revenue outcomes.
      </p>
    </div>
  )
}
