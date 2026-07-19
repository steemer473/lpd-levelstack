"use client"

import {
  ArrowUp,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
} from "lucide-react"
import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { ExecutiveSummaryConversion } from "@/components/report/executive-summary-conversion"
import { ExecutiveSummaryDashboard } from "@/components/report/executive-summary-dashboard"
import { ActionItemMatrixRow } from "@/components/report/action-item-matrix-row"
import { LockedSectionPreview } from "@/components/report/locked-section-preview"
import { RecommendationMatrixRow } from "@/components/report/recommendation-matrix-row"
import { SapBridgeBlock } from "@/components/report/sap-bridge-block"
import { usePaidOwnerReportChrome } from "@/components/report/paid-owner-report-context"
import { FindingCard, FindingSeverityBlock } from "@/components/report/finding-card"
import {
  DataPanel,
  DataPanelLabel,
  FindingDetailContent,
} from "@/components/report/finding-detail"
import { scoreRowHint } from "@/lib/report/finding-context"
import { SectionGuideInfo } from "@/components/report/section-guide-info"
import { Button } from "@/components/ui/button"
import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"
import {
  LPD,
  biggestProblemSections,
  PAID_TAB_IDS,
  priorityBreakdown,
  scoreBarColor,
  sectionScoreAccent,
  sectionStatusBadge,
  SECTION_TAB_ORDER,
} from "@/lib/report/display-helpers"
import { REPORT_INTRO } from "@/lib/report/section-guides"
import { UPGRADE_BANNER } from "@/lib/report/outcome-copy"
import {
  ownerRoleLabel,
  roadmapBucketsFromReport,
} from "@/lib/report/roadmap-from-recommendations"
import { getHubCartUrl, getHubSeoWaitlistUrl, getHubWorkflowWaitlistUrl } from "@/lib/urls"
import { cn } from "@/lib/utils"

export type ReportViewProps = {
  report: LevelstackReportJson
}

export function useReportTabs(report: LevelstackReportJson) {
  const { meta, executiveSummary, sections, actionPlan } = report
  const isFree = meta.reportTier === "free_snapshot"
  const tabs = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.id, s]))
    return SECTION_TAB_ORDER.map((t) => ({
      ...t,
      section: byId.get(t.id),
      locked: isFree && PAID_TAB_IDS.has(t.id),
    }))
  }, [sections, isFree])

  const [activeTab, setActiveTab] = useState("executive_summary")
  const [howToReadOpen, setHowToReadOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const sectionCount = contentSections.length

  const scrollToReportTop = useCallback(() => {
    if (reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const selectTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId)
      requestAnimationFrame(() => scrollToReportTop())
    },
    [scrollToReportTop],
  )

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return [
    {
      meta,
      executiveSummary,
      sections,
      actionPlan,
      tabs,
      activeTab,
      howToReadOpen,
      setHowToReadOpen,
      showScrollTop,
      selectTab,
      scrollToReportTop,
      contentSections,
      sectionCount,
    },
    reportRef,
  ] as const
}

export function ScoreRows({ section }: { section: ReportSection }) {
  if (!section.scoreRows?.length) return null
  return (
    <ul className="mt-1 divide-y divide-[var(--rpt-card-border)] list-none pl-0">
      {section.scoreRows.map((row) => {
        const hint = scoreRowHint(row.label, row.tone)
        return (
          <li key={row.label} className="py-3 first:pt-0 last:pb-0">
            <p className="rpt-caption mb-1">{row.label}</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[var(--rpt-heading)]">
                {row.value}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span
                  className="inline-block w-20 h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${row.percent}%`,
                      backgroundColor:
                        row.tone === "red"
                          ? LPD.red
                          : row.tone === "amber"
                            ? LPD.amber
                            : LPD.green,
                    }}
                  />
                </span>
                <span className="text-xs tabular-nums text-[var(--rpt-muted)] w-8 text-right">
                  {row.percent}%
                </span>
              </span>
            </div>
            {hint ? (
              <p className="text-xs text-[var(--rpt-muted)] mt-1 leading-snug">{hint}</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function CompetitiveGrid({ section }: { section: ReportSection }) {
  const grid = section.competitiveGrid
  if (!grid?.rows.length) return null

  return (
    <DataPanel className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-[140px] px-3 py-2.5" />
              {grid.columnHeaders.map((head) => (
                <th
                  key={head}
                  className="text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-3 py-2.5"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.label} className="border-t border-border/60">
                <td className="px-3 py-2.5 text-[10px] uppercase tracking-wide font-medium text-muted-foreground bg-muted/30">
                  {row.label}
                </td>
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-2.5 text-[13px] leading-snug",
                      row.youColumnIndex === ci &&
                        "font-semibold text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-950/20",
                      row.youColumnIndex !== ci && ci >= 0 && "text-foreground",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataPanel>
  )
}

export function UpgradeBanner({
  report,
  reportId,
}: {
  report: LevelstackReportJson
  reportId?: string
}) {
  const { suppressLevelstackPurchaseCtas, actionRoadmapReportId } =
    usePaidOwnerReportChrome()

  if (report.meta.reportTier !== "free_snapshot") return null

  const issueCount =
    report.meta.issueCountForUpgrade ??
    report.meta.criticalCount + report.meta.highCount

  if (suppressLevelstackPurchaseCtas && actionRoadmapReportId) {
    return (
      <div className="rpt-upsell flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-relaxed">
          <p className="font-medium text-white">
            You already have an Action Roadmap
          </p>
          <p className="mt-1 text-white/80">
            This page is a free Visibility Snapshot. Open your full Action Roadmap
            anytime.
          </p>
        </div>
        <Button variant="brand" asChild className="min-h-10 shrink-0">
          <Link href={`/reports/${actionRoadmapReportId}`}>
            View your Action Roadmap
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    )
  }

  const upgradeUrl = getHubCartUrl({ reportId, source: "levelstack_report" })

  return (
    <div className="rpt-upsell flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm leading-relaxed">
        <p className="font-medium text-white">{UPGRADE_BANNER.leadLine}</p>
        <p className="mt-1 text-white/80">
          We found {issueCount} issue{issueCount === 1 ? "" : "s"} in your public presence.
        </p>
        <p className="mt-1 text-white/60">{UPGRADE_BANNER.body}</p>
      </div>
      <Button variant="brand" asChild className="min-h-10 shrink-0">
        <Link href={upgradeUrl}>
          {UPGRADE_BANNER.button}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  )
}

export function AutomatorFlagCallout({
  product = "seo",
  reportId,
}: {
  product?: "seo" | "workflow"
  reportId?: string
}) {
  const isWorkflow = product === "workflow"
  const label = isWorkflow ? "Workflow Automator Pro" : "SEO Automator Pro"
  const href = isWorkflow
    ? getHubWorkflowWaitlistUrl()
    : getHubSeoWaitlistUrl({ reportId, source: "levelstack_report" })
  const detail = isWorkflow
    ? "This operational gap is addressed by structured workflows in Workflow Automator Pro."
    : "This issue is monitored and corrected automatically by SEO Automator Pro."

  return (
    <p className="text-[11px] mt-2 p-2 rounded bg-muted/60 border border-border/60 text-muted-foreground leading-relaxed">
      <strong className="text-foreground">{label}:</strong> {detail}{" "}
      <Link href={href} className="text-brand-orange underline">
        Learn more
      </Link>
    </p>
  )
}

export function ReportDashboard({ report }: { report: LevelstackReportJson }) {
  const { meta, sections } = report
  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const priorities = priorityBreakdown(meta)
  const problems = biggestProblemSections(contentSections)

  return (
    <div className="border-b border-border bg-card px-6 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        LevelStack readiness dashboard
      </h2>
      <div className="grid lg:grid-cols-[auto_1fr] gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-border text-center">
            <span className="text-3xl font-semibold text-foreground">
              {meta.letterGrade}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">Grade</span>
          </div>
          <div>
            <p className="text-2xl font-semibold">{meta.overallScore}/100</p>
            <p className="text-sm text-muted-foreground">Overall readiness</p>
            <p className="text-xs text-muted-foreground mt-1">
              {meta.totalFindings} findings · {meta.criticalCount} critical
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {priorities.map((p) => (
              <div
                key={p.label}
                className="rounded-md border px-3 py-2 min-w-[88px] text-center"
              >
                <p className="text-lg font-semibold" style={{ color: p.color }}>
                  {p.count}
                </p>
                <p className="text-[10px] uppercase text-muted-foreground">{p.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Section scores
            </p>
            <div className="space-y-2">
              {contentSections.map((s) => {
                const score =
                  s.status !== "insufficient_data" &&
                  typeof s.score === "number" &&
                  Number.isFinite(s.score)
                    ? s.score
                    : null
                return (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 truncate text-muted-foreground">{s.label}</span>
                  <span
                    className="h-2 flex-1 max-w-[200px] rounded-full bg-muted overflow-hidden"
                    aria-hidden
                  >
                    {score != null ? (
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${score}%`,
                          backgroundColor: scoreBarColor(score),
                        }}
                      />
                    ) : null}
                  </span>
                  <span className="min-w-8 text-right font-medium">
                    {score != null ? score : "—"}
                  </span>
                </div>
                )
              })}
            </div>
          </div>

          {problems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Biggest problem areas
              </p>
              <ul className="text-sm list-disc pl-5 space-y-0.5">
                {problems.map((s) => (
                  <li key={s.id}>
                    {s.label} ({s.score}/100)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ACTION_PLAN_GROUPS = [
  {
    key: "week" as const,
    label: "This week",
    className:
      "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  },
  {
    key: "month" as const,
    label: "This month",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  {
    key: "quarter" as const,
    label: "This quarter",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200",
  },
] as const

export function ActionPlanPanel({
  report,
  reportId,
}: {
  report: LevelstackReportJson
  reportId?: string
}) {
  const isFree = report.meta.reportTier === "free_snapshot"
  const recBuckets = roadmapBucketsFromReport(report)

  if (recBuckets) {
    const flat = [
      ...recBuckets.week.map((rec) => ({ bucket: "week" as const, rec })),
      ...recBuckets.month.map((rec) => ({ bucket: "month" as const, rec })),
      ...recBuckets.quarter.map((rec) => ({ bucket: "quarter" as const, rec })),
    ]
    const numberById = new Map(flat.map((row, i) => [row.rec.id, i + 1]))

    return (
      <div className="space-y-5">
        {ACTION_PLAN_GROUPS.map((g) => (
          <div key={g.key}>
            <span
              className={cn(
                "mb-2 inline-block rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider",
                g.className,
              )}
            >
              {g.label}
            </span>
            <div className="space-y-2">
              {recBuckets[g.key].map((rec) => (
                <div key={rec.id}>
                  <RecommendationMatrixRow
                    recommendation={rec}
                    itemNumber={numberById.get(rec.id) ?? 1}
                    reportId={reportId}
                  />
                  {rec.sourceSectionId ? (
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      From: {rec.sourceSectionId.replaceAll("_", " ")}
                    </p>
                  ) : null}
                  {rec.automatability.automatable ? (
                    <AutomatorFlagCallout
                      product={rec.automatability.lpdProduct ?? "seo"}
                      reportId={reportId}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!isFree ? (
          <SapBridgeBlock placement="fullActionPlan" reportId={reportId} />
        ) : null}
      </div>
    )
  }

  const items = {
    week: report.actionPlan.thisWeek,
    month: report.actionPlan.thisMonth,
    quarter: report.actionPlan.thisQuarter,
  }
  const legacyFlat = [
    ...items.week.map((item, i) => ({ key: "week" as const, item, n: i })),
    ...items.month.map((item, i) => ({
      key: "month" as const,
      item,
      n: items.week.length + i,
    })),
    ...items.quarter.map((item, i) => ({
      key: "quarter" as const,
      item,
      n: items.week.length + items.month.length + i,
    })),
  ]

  return (
    <div className="space-y-5">
      {ACTION_PLAN_GROUPS.map((g) => (
        <div key={g.key}>
          <span
            className={cn(
              "mb-2 inline-block rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider",
              g.className,
            )}
          >
            {g.label}
          </span>
          <div className="space-y-2">
            {legacyFlat
              .filter((row) => row.key === g.key)
              .map((row) => (
                <div key={`${g.key}-${row.n}`}>
                  <ActionItemMatrixRow
                    item={row.item}
                    itemNumber={row.n + 1}
                    reportId={reportId}
                  />
                  {row.item.findingRef ? (
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      From: {row.item.findingRef}
                    </p>
                  ) : null}
                  {row.item.automatorFlag ? (
                    <AutomatorFlagCallout
                      product={row.item.automatorProduct ?? "seo"}
                      reportId={reportId}
                    />
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      ))}
      {!isFree ? (
        <SapBridgeBlock placement="fullActionPlan" reportId={reportId} />
      ) : null}
    </div>
  )
}

export function ActionPlanKanban({
  report,
  reportId,
}: {
  report: LevelstackReportJson
  reportId?: string
}) {
  const recBuckets = roadmapBucketsFromReport(report)
  const columns = [
    {
      key: "week" as const,
      label: "This week",
      accent: "border-t-red-500 bg-red-50/50 dark:bg-red-950/20",
    },
    {
      key: "month" as const,
      label: "This month",
      accent: "border-t-amber-500 bg-amber-50/40 dark:bg-amber-950/20",
    },
    {
      key: "quarter" as const,
      label: "This quarter",
      accent: "border-t-green-600 bg-green-50/40 dark:bg-green-950/20",
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => (
        <div
          key={col.key}
          className={cn(
            "rounded-lg border border-border border-t-4 p-3",
            col.accent,
          )}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {col.label}
          </p>
          <ul className="space-y-3">
            {recBuckets
              ? recBuckets[col.key].map((rec) => (
                  <li
                    key={rec.id}
                    className="rounded-md border border-border/80 bg-card p-3 text-sm shadow-sm"
                  >
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="font-medium leading-snug">{rec.title}</p>
                    {rec.summary ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rec.summary}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span>{ownerRoleLabel(rec.owner.role)}</span>
                      <span>·</span>
                      <span>{rec.effortHint ?? "—"}</span>
                    </div>
                  </li>
                ))
              : report.actionPlan[
                  col.key === "week"
                    ? "thisWeek"
                    : col.key === "month"
                      ? "thisMonth"
                      : "thisQuarter"
                ].map((item, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-border/80 bg-card p-3 text-sm shadow-sm"
                  >
                    <p className="font-medium leading-snug">{item.task}</p>
                    {item.sub ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.sub}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span>{item.who}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                    </div>
                  </li>
                ))}
          </ul>
        </div>
      ))}
      {report.meta.reportTier !== "free_snapshot" ? (
        <div className="lg:col-span-3">
          <SapBridgeBlock placement="fullActionPlan" reportId={reportId} />
        </div>
      ) : null}
    </div>
  )
}

export function SectionPanel({
  section,
  reportDate,
}: {
  section: ReportSection
  reportDate: string
}) {
  const statusClass =
    section.status === "critical"
      ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
      : section.status === "attention" || section.status === "insufficient_data"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"

  if (section.id === "action_plan") return null

  const accent = sectionScoreAccent(section.id)
  const hasScore =
    section.status !== "insufficient_data" &&
    typeof section.score === "number" &&
    Number.isFinite(section.score)

  return (
    <div className="rpt-dash-panel">
      <div
        className="rpt-section-score-header mb-4"
        style={{ borderLeftColor: accent.bar }}
      >
        <div>
          <p className="rpt-caption">Section score</p>
          <p className="rpt-section-score-value">
            {hasScore ? (
              <>
                {section.score}
                <span className="rpt-section-score-denom">/100</span>
              </>
            ) : (
              <span className="text-[0.85em]">Insufficient data</span>
            )}
          </p>
        </div>
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded", statusClass)}>
          {sectionStatusBadge(section)}
        </span>
      </div>

      <SectionPanelHeader
        title={section.label}
        tabId={section.id}
        trailing={null}
      />

      {section.findings.map((f, i) => (
        <FindingCard key={i} finding={f} sectionId={section.id} />
      ))}

      {section.scoreRows && section.scoreRows.length > 0 && (
        <DataPanel>
          <DataPanelLabel subtitle="Quick health checks for your website and Google Maps listing.">
            Website &amp; presence signals
          </DataPanelLabel>
          <ScoreRows section={section} />
        </DataPanel>
      )}

      {section.aiPreview && section.aiPreview.length > 0 && (
        <>
          <p className="rpt-caption my-3 mb-2">
            AI search visibility preview (as of {reportDate})
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
            {section.aiPreview.map((ai, i) => (
              <DataPanel key={i} className="mb-0">
                <DataPanelLabel subtitle="Summary shown when prospects ask AI about you.">
                  {ai.platform}
                </DataPanelLabel>
                <FindingDetailContent detail={ai.result} />
                <FindingSeverityBlock
                  sectionId="search_footprint"
                  finding={{
                    label: ai.platform,
                    value: ai.result.slice(0, 160),
                    detail: ai.result,
                    severity: ai.severity,
                  }}
                />
              </DataPanel>
            ))}
          </div>
        </>
      )}

      {section.competitiveGrid && <CompetitiveGrid section={section} />}
    </div>
  )
}

export function SectionPanelHeader({
  title,
  tabId,
  trailing,
  subtitle,
}: {
  title: string
  tabId: string
  trailing?: ReactNode
  subtitle?: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--rpt-card-border)] pb-3 mb-4 gap-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold truncate font-[family-name:var(--font-heading)] text-[var(--rpt-heading)]">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-[var(--rpt-muted)] mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        <SectionGuideInfo tabId={tabId} />
      </div>
      {trailing}
    </div>
  )
}

export function ReportHowToRead({
  open,
  onToggle,
  compact,
}: {
  open: boolean
  onToggle: () => void
  compact?: boolean
}) {
  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="rpt-intro flex w-full items-center gap-2 border-b px-6 py-2.5 text-left text-sm hover:opacity-90 transition-colors"
        aria-expanded={false}
      >
        <Info className="h-3.5 w-3.5 shrink-0 rpt-intro-icon" aria-hidden />
        <span className="truncate">
          New here? <span className="text-foreground font-medium">{REPORT_INTRO.title}</span>
          {" — "}
          tap to expand
        </span>
        <ChevronDown className="h-3.5 w-3.5 ml-auto shrink-0" aria-hidden />
      </button>
    )
  }

  return (
    <div className="rpt-intro border-b">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-6 py-3 text-left text-sm font-semibold hover:opacity-90 transition-colors"
        style={{ color: "var(--rpt-heading, #111827)" }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 rpt-intro-icon" aria-hidden />
          {REPORT_INTRO.title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>
      {open && (
        <div className="px-6 pb-4 space-y-2 rpt-muted-text leading-relaxed">
          {REPORT_INTRO.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <p className="text-xs italic pt-1">{REPORT_INTRO.note}</p>
        </div>
      )}
    </div>
  )
}

export function ScrollToTopButton({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) {
  if (!visible) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full shadow-lg border-border bg-background/95 backdrop-blur-sm hover:bg-muted"
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </Button>
  )
}

export function ReportTabNavigation({
  tabs,
  activeTab,
  onSelectTab,
  prominent,
}: {
  tabs: { id: string; label: string }[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  prominent?: boolean
}) {
  const idx = tabs.findIndex((t) => t.id === activeTab)
  const prev = idx > 0 ? tabs[idx - 1] : null
  const next = idx >= 0 && idx < tabs.length - 1 ? tabs[idx + 1] : null

  return (
    <div
      className={cn(
        "rpt-footer-nav flex flex-wrap items-center justify-between gap-3 px-6 py-3",
        prominent && "shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
      )}
    >
      <Button
        type="button"
        variant={prominent ? "outline" : "outline"}
        size={prominent ? "default" : "sm"}
        disabled={!prev}
        onClick={() => prev && onSelectTab(prev.id)}
        className="gap-1 flex-1 sm:flex-none min-w-0"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{prev ? `Previous: ${prev.label}` : "Previous"}</span>
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {idx + 1} of {tabs.length}
      </span>
      <Button
        type="button"
        variant={prominent ? "brand" : "outline"}
        size={prominent ? "default" : "sm"}
        disabled={!next}
        onClick={() => next && onSelectTab(next.id)}
        className="gap-1 flex-1 sm:flex-none min-w-0"
      >
        <span className="truncate">{next ? `Next: ${next.label}` : "Next"}</span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </Button>
    </div>
  )
}

export function ExecutiveSummaryPanel({
  summary,
  collapsibleParagraphs,
}: {
  summary: LevelstackReportJson["executiveSummary"]
  collapsibleParagraphs?: boolean
}) {
  const [expanded, setExpanded] = useState(!collapsibleParagraphs)

  return (
    <div className="px-6 py-5">
      <SectionPanelHeader title="Executive summary" tabId="executive_summary" />
      {collapsibleParagraphs && summary.paragraphs.length > 2 && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-muted-foreground hover:text-foreground mb-3 text-left underline-offset-2 hover:underline"
        >
          Read full executive narrative ({summary.paragraphs.length} paragraphs)
        </button>
      ) : (
        summary.paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground mb-3 last:mb-0">
            {p}
          </p>
        ))
      )}
      <div className="mt-4 rounded-md border border-red-200/80 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-red-800 dark:text-red-200 mb-1">
          Your most critical issue
        </p>
        <p className="text-sm text-red-950 dark:text-red-100 leading-relaxed">
          {summary.criticalIssue}
        </p>
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-4 mb-2">
        Your next decisions
      </p>
      <ul className="text-sm list-disc pl-5 space-y-1">
        {summary.firstSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-4 italic">
        Diagnostic only — you or your team execute fixes. LevelStack does not guarantee
        rankings or revenue outcomes.
      </p>
    </div>
  )
}

export function ReportFooter({ meta }: { meta: LevelstackReportJson["meta"] }) {
  return (
    <div className="rpt-report-footer flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-[11px]">
      <p>
        Generated by <strong className="font-medium" style={{ color: "var(--rpt-orange, #f0ad4e)" }}>LevelStack</strong>
        {" · "}Level Play Digital
      </p>
      <p className="italic">As of {meta.reportDate}</p>
    </div>
  )
}

export function ReportTabContent({
  report,
  activeTab,
  reportDate,
  actionPlanVariant = "table",
  onSelectTab,
  reportId,
}: {
  report: LevelstackReportJson
  activeTab: string
  reportDate: string
  actionPlanVariant?: "table" | "kanban"
  onSelectTab?: (tabId: string) => void
  reportId?: string
}) {
  const { sections, actionPlan, recommendations } = report
  const roadmapItemCount =
    (recommendations?.length ?? 0) > 0
      ? recommendations!.length
      : actionPlan.thisWeek.length +
        actionPlan.thisMonth.length +
        actionPlan.thisQuarter.length

  if (activeTab === "executive_summary") {
    const onTab = onSelectTab ?? (() => {})
    if (report.meta.reportTier === "free_snapshot") {
      return (
        <ExecutiveSummaryConversion
          report={report}
          onSelectTab={onTab}
          reportId={reportId}
        />
      )
    }
    return <ExecutiveSummaryDashboard report={report} onSelectTab={onTab} />
  }

  if (activeTab === "action_plan") {
    if (report.meta.reportTier === "free_snapshot") {
      return (
        <LockedSectionPreview
          sectionId="action_plan"
          report={report}
          reportId={reportId}
        />
      )
    }
    return (
      <div className="px-6 py-5">
        <SectionPanelHeader
          title="Prioritized action plan"
          tabId="action_plan"
          trailing={
            <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {roadmapItemCount} items
            </span>
          }
        />
        {actionPlanVariant === "kanban" ? (
          <ActionPlanKanban report={report} reportId={reportId} />
        ) : (
          <ActionPlanPanel report={report} reportId={reportId} />
        )}
      </div>
    )
  }

  const lockedIds = new Set(["revenue_funnel", "competitive_context", "action_plan"])

  if (
    report.meta.reportTier === "free_snapshot" &&
    lockedIds.has(activeTab)
  ) {
    return (
      <LockedSectionPreview
        sectionId={activeTab}
        report={report}
        reportId={reportId}
      />
    )
  }

  const matching = sections.filter((s) => s.id === activeTab)
  if (matching.length === 0) {
    const tabLabel =
      SECTION_TAB_ORDER.find((t) => t.id === activeTab)?.label ?? activeTab
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center space-y-3">
        <h3 className="text-base font-semibold text-foreground">{tabLabel}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This section wasn&apos;t included in this report version. Rebuild the
          report from your latest intake to refresh findings, or open a newer
          Visibility Snapshot if you have one.
        </p>
        {reportId ? (
          <p className="text-sm">
            <a
              href={`/reports/${reportId}?view=snapshot`}
              className="text-brand-orange font-medium underline-offset-4 hover:underline"
            >
              Try free snapshot backup
            </a>
          </p>
        ) : null}
      </div>
    )
  }

  return matching.map((s) => (
    <SectionPanel key={s.id} section={s} reportDate={reportDate} />
  ))
}
