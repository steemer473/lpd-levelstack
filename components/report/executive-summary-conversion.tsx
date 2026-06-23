"use client"

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  Target,
} from "lucide-react"

import { ExecutiveInsightBody } from "@/components/report/executive-insight-body"
import { FormattedReportText } from "@/components/report/formatted-report-text"
import { UpsellBlurOverlay } from "@/components/report/upsell-blur-overlay"
import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"
import {
  executiveConversionHeadlineParts,
  flagLabel,
  FREE_EXECUTIVE_SECTION_ORDER,
  readinessHeadline,
  sectionScoreAccent,
} from "@/lib/report/display-helpers"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "@/lib/report/executive-summary-resolve"
import { cn } from "@/lib/utils"

type ExecutiveSummaryConversionProps = {
  report: LevelstackReportJson
  onSelectTab: (tabId: string) => void
}

function splitFirstSentence(text: string): { first: string; rest: string } {
  const match = text.match(/^(.+?[.!?])(?:\s+([\s\S]+))?$/)
  if (!match?.[1]) return { first: text, rest: "" }
  return { first: match[1], rest: match[2] ?? "" }
}

function OverallScoreCard({ meta }: { meta: LevelstackReportJson["meta"] }) {
  return (
    <div className="rpt-overall-score-card">
      <div className="score-main">
        <p className="score-label">Overall</p>
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

function KpiStrip({ meta }: { meta: LevelstackReportJson["meta"] }) {
  const items = [
    { label: "Score", value: String(meta.overallScore), critical: false, grade: false },
    { label: "Grade", value: meta.letterGrade, critical: false, grade: true },
    {
      label: "Critical issues",
      value: String(meta.criticalCount),
      critical: true,
      grade: false,
    },
    { label: "Findings", value: String(meta.totalFindings), critical: false, grade: false },
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

  return (
    <button type="button" onClick={onSelect} className="rpt-conv-sec-card">
      <p className="rpt-conv-sec-score">
        <span style={{ color: accent.bar }}>{section.score}</span>
        <span className="rpt-conv-sec-denom">/100</span>
      </p>
      <p className="rpt-conv-sec-name">{label}</p>
      <span className="rpt-conv-sec-link">
        View section
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </button>
  )
}

function MeansCard({
  title,
  body,
  tintClass,
  icon: Icon,
  blurRest,
}: {
  title: string
  body: string
  tintClass: string
  icon: typeof AlertTriangle
  blurRest?: string
}) {
  return (
    <div className={cn("rounded-lg border p-4 h-full", tintClass)}>
      <div className="flex items-start gap-2 mb-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <p className="rpt-caption">{title}</p>
      </div>
      {blurRest ? (
        <>
          <FormattedReportText
            text={body}
            paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
            className="mb-2"
          />
          <UpsellBlurOverlay message="Unlock full competitive and funnel analysis — $97">
            <FormattedReportText
              text={blurRest}
              paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
            />
          </UpsellBlurOverlay>
        </>
      ) : (
        <FormattedReportText
          text={body}
          paragraphClassName="rpt-highlight-body text-sm leading-relaxed"
        />
      )}
    </div>
  )
}

function SearchFootprintHighlight({
  report,
  onSelectTab,
}: {
  report: LevelstackReportJson
  onSelectTab: (tabId: string) => void
}) {
  const search = report.sections.find((s) => s.id === "search_footprint")
  const finding = search?.findings[0]

  if (!finding) {
    return (
      <div className="rpt-card p-5 h-full">
        <h3 className="rpt-card-title mb-3">Search footprint highlight</h3>
        <p className="rpt-muted-text text-sm">
          Open Search footprint for live Google and AI visibility findings.
        </p>
        <button
          type="button"
          onClick={() => onSelectTab("search_footprint")}
          className="rpt-link mt-4 inline-flex items-center gap-1"
        >
          View Search footprint
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="rpt-card p-5 h-full">
      <h3 className="rpt-card-title mb-3">Search footprint highlight</h3>
      <FormattedReportText
        text={finding.value || finding.label}
        paragraphClassName="text-sm font-medium text-[var(--rpt-heading)] leading-snug"
        emphasizeLeadIn={false}
      />
      {finding.detail ? (
        <FormattedReportText
          text={finding.detail}
          paragraphClassName="rpt-muted-text text-sm mt-2"
          emphasizeLeadIn={false}
        />
      ) : null}
      <span
        className={cn(
          "inline-block mt-2 text-[0.625rem] font-semibold px-2 py-0.5 rounded",
          finding.severity === "critical" || finding.severity === "high"
            ? "bg-red-50 text-red-800"
            : "bg-amber-50 text-amber-900",
        )}
      >
        {flagLabel(finding.severity)}
      </span>
      <button
        type="button"
        onClick={() => onSelectTab("search_footprint")}
        className="rpt-link mt-4 inline-flex items-center gap-1"
      >
        View Search footprint
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

function CompetitiveSnapshotPanel({
  competitive,
  onSelectTab,
}: {
  competitive: NonNullable<ReturnType<typeof resolveCompetitiveSnapshot>>
  onSelectTab: (tabId: string) => void
}) {
  const previewCompetitor = competitive.rows[0]
  const hiddenCompetitorCount = Math.max(
    0,
    (competitive.competitorCount ?? 0) - (previewCompetitor ? 1 : 0),
  )

  return (
    <div className="rpt-card p-5 h-full">
      <h3 className="rpt-card-title mb-3">Competitive snapshot</h3>
      <p className="rpt-caption mb-2 normal-case tracking-normal">
        Search: &apos;{competitive.searchQuery}&apos;
      </p>
      <div className="rpt-alert-red rounded-md px-3 py-2 mb-3">
        <FormattedReportText
          text={competitive.positionAlert}
          paragraphClassName="text-sm font-medium"
          emphasizeLeadIn={false}
        />
      </div>
      {previewCompetitor ? (
        <div className="rpt-conv-comp-row">
          <span>
            <strong>#1</strong> {previewCompetitor.domain}
          </span>
          <span className="rpt-muted-text tabular-nums">SERP #{previewCompetitor.serpPosition}</span>
        </div>
      ) : null}
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
      <button
        type="button"
        onClick={() => onSelectTab("competitive_context")}
        className="rpt-link mt-4 inline-flex items-center gap-1"
      >
        Unlock full competitive analysis
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

export function ExecutiveSummaryConversion({
  report,
  onSelectTab,
}: ExecutiveSummaryConversionProps) {
  const { meta, sections, actionPlan } = report
  const content = resolveExecutiveContent(report)
  const competitive = resolveCompetitiveSnapshot(report)
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const leverage = splitFirstSentence(content.highlights.highestLeverageOpportunity)
  const headlineParts = executiveConversionHeadlineParts(report)

  const actionItems = actionPlan.thisWeek.slice(0, 3)

  const insightRows = [
    {
      label: "What prospects see",
      parts: content.structuredInsights?.whatProspectsSee,
      body: content.insights.whatProspectsSee,
    },
    {
      label: "Reputation gap",
      parts: content.structuredInsights?.reputationGap,
      body: content.insights.reputationGap,
    },
    {
      label: "Revenue risk",
      parts: content.structuredInsights?.revenueRisk,
      body: content.insights.revenueRisk,
    },
  ]

  const visibleStrengths = content.strengths.slice(0, 1)
  const hiddenStrengths = content.strengths.slice(1)
  const visibleOpps = content.topOpportunities.slice(0, 1)
  const hiddenOpps = content.topOpportunities.slice(1)

  return (
    <div className="rpt-dash-panel rpt-conv-panel">
      <div className="rpt-conv-dash-header">
        <h2 className="rpt-conv-headline">
          Your public presence scores{" "}
          <em className="rpt-conv-headline-accent">{headlineParts.score}/100</em>
          {" — "}
          {headlineParts.pain} in {headlineParts.market}.
        </h2>
        <OverallScoreCard meta={meta} />
      </div>

      <KpiStrip meta={meta} />

      <div className="rpt-conv-pull-quote">
        <FormattedReportText
          text={content.highlights.criticalIssue}
          paragraphClassName="text-[0.9375rem] font-medium leading-snug text-[#7f1d1d]"
          emphasizeLeadIn={false}
        />
      </div>

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

      <div className="rpt-conv-means-grid">
        <MeansCard
          title="Most critical issue"
          body={content.highlights.criticalIssue}
          tintClass="rpt-highlight-critical"
          icon={AlertTriangle}
        />
        <MeansCard
          title="Business impact"
          body={content.highlights.businessImpact}
          tintClass="rpt-highlight-blue"
          icon={BarChart3}
        />
        <MeansCard
          title="Highest leverage opportunity"
          body={
            leverage.rest
              ? leverage.first
              : content.highlights.highestLeverageOpportunity
          }
          tintClass="rpt-highlight-green"
          icon={Target}
          blurRest={leverage.rest || undefined}
        />
      </div>

      <div className={cn("rpt-conv-two-col", !competitive && "is-single")}>
        {competitive ? (
          <CompetitiveSnapshotPanel
            competitive={competitive}
            onSelectTab={onSelectTab}
          />
        ) : null}
        <SearchFootprintHighlight report={report} onSelectTab={onSelectTab} />
      </div>

      <div className="rpt-conv-bottom-row">
        <div className="rpt-card p-5">
          <h3 className="rpt-card-title mb-4">What to do first</h3>
          {actionItems.length > 0 ? (
            <ul className="rpt-conv-action-list list-none pl-0">
              {actionItems.map((item, i) => (
                <li key={i}>
                  <strong>{item.task}</strong>
                  {item.sub ? <span>{item.sub}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rpt-muted-text text-sm">
              Prioritized actions appear in your Full Report after funnel and competitive analysis.
            </p>
          )}
          <button
            type="button"
            onClick={() => onSelectTab("action_plan")}
            className="rpt-link mt-4 inline-flex items-center gap-1"
          >
            View full action plan (locked)
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className="rpt-card p-5">
          <h3 className="rpt-card-title mb-4">Strengths &amp; opportunities</h3>
          {visibleStrengths.map((s, i) => (
            <div key={`s-${i}`} className="rpt-conv-strength-item">
              <span className="rpt-conv-strength-icon is-strength" aria-hidden>
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <FormattedReportText
                text={s}
                paragraphClassName="text-sm text-[var(--rpt-body)]"
                emphasizeLeadIn={false}
              />
            </div>
          ))}
          {visibleOpps.map((o, i) => (
            <div key={`o-${i}`} className="rpt-conv-strength-item">
              <span className="rpt-conv-strength-icon is-opportunity" aria-hidden>
                <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <FormattedReportText
                text={o}
                paragraphClassName="text-sm text-[var(--rpt-body)]"
                emphasizeLeadIn={false}
              />
            </div>
          ))}
          {hiddenStrengths.length > 0 || hiddenOpps.length > 0 ? (
            <div className="mt-3">
              <UpsellBlurOverlay message="Unlock all strengths and opportunities in your Full Report — $97">
                <div className="space-y-2">
                  {hiddenStrengths.map((s, i) => (
                    <div key={i} className="rpt-conv-strength-item">
                      <span className="rpt-conv-strength-icon is-strength" aria-hidden>
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                  {hiddenOpps.map((o, i) => (
                    <div key={i} className="rpt-conv-strength-item">
                      <span className="rpt-conv-strength-icon is-opportunity" aria-hidden>
                        <AlertTriangle className="h-3 w-3" />
                      </span>
                      <span className="text-sm">{o}</span>
                    </div>
                  ))}
                </div>
              </UpsellBlurOverlay>
            </div>
          ) : null}
          {visibleStrengths.length === 0 && visibleOpps.length === 0 ? (
            <p className="rpt-muted-text text-sm">
              See section tabs above for detailed findings from your free snapshot.
            </p>
          ) : null}
        </div>
      </div>

      <p className="rpt-muted-text text-xs text-center mt-8">
        Diagnostic only — LevelStack does not guarantee rankings or revenue outcomes.
      </p>
    </div>
  )
}
