"use client"

import { AlertCircle, AlertTriangle, Check, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import {
  LPD,
  biggestProblemSections,
  flagLabel,
  planDisplayName,
  priorityBreakdown,
  scoreBarColor,
  sectionDotClass,
  sectionStatusBadge,
  severityToFlag,
  SECTION_TAB_ORDER,
} from "@/lib/report/display-helpers"
import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"
import { getHubSeoWaitlistUrl } from "@/lib/urls"
import { cn } from "@/lib/utils"

type LevelstackReportViewProps = {
  report: LevelstackReportJson
}

function FindingFlag({ severity }: { severity: string }) {
  const kind = severityToFlag(severity)
  const Icon =
    kind === "critical" ? AlertCircle : kind === "attention" ? AlertTriangle : Check

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded mt-2",
        kind === "critical" && "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
        kind === "attention" &&
          "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
        kind === "good" &&
          "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {flagLabel(severity)}
    </span>
  )
}

function FindingCard({ finding }: { finding: ReportFinding }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 mb-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {finding.label}
      </p>
      <p className="text-sm font-medium text-foreground leading-snug">{finding.value}</p>
      {finding.detail ? (
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
          {finding.detail}
        </p>
      ) : null}
      <FindingFlag severity={finding.severity} />
    </div>
  )
}

function ScoreRows({ section }: { section: ReportSection }) {
  if (!section.scoreRows?.length) return null
  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-3">
      {section.scoreRows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between py-2 border-b border-border/60 text-sm"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium flex items-center gap-2">
            <span
              className="inline-block w-20 h-1.5 rounded-full bg-border overflow-hidden"
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
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function CompetitiveGrid({ section }: { section: ReportSection }) {
  const grid = section.competitiveGrid
  if (!grid?.rows.length) return null

  return (
    <div className="overflow-x-auto mb-3 rounded-lg border border-border">
      <table className="w-full min-w-[480px] text-xs border-collapse">
        <thead>
          <tr className="bg-muted/60">
            <th className="w-[140px] px-2 py-2" />
            {grid.columnHeaders.map((head) => (
              <th
                key={head}
                className="text-left text-[10px] uppercase tracking-wide font-medium text-muted-foreground px-2 py-2"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => (
            <tr key={row.label} className="border-t border-border/60">
              <td className="px-2 py-2 font-medium text-muted-foreground bg-muted/20">
                {row.label}
              </td>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-2 py-2 bg-card",
                    row.youColumnIndex === ci &&
                      "font-medium text-red-700 dark:text-red-300",
                    row.youColumnIndex !== ci &&
                      ci >= 0 &&
                      "text-green-700 dark:text-green-400",
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
  )
}

function UpsellStrip({ variant }: { variant: "search" | "closing" }) {
  const href = getHubSeoWaitlistUrl()
  const text =
    variant === "search" ? (
      <>
        <strong className="text-white block mb-0.5">
          SEO Automator Pro is designed to address this.
        </strong>
        Continuous monitoring of AI search visibility (AISO, AEO, GEO) — structured
        content signals so AI engines can find and cite your business.
      </>
    ) : (
      <>
        <strong className="text-white block mb-0.5">
          SEO Automator Pro is designed to keep these gaps closed.
        </strong>
        LevelStack finds them once. SEO Automator Pro monitors traditional SEO, local
        SEO, and AI visibility continuously.
      </>
    )

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#090E18] p-4">
      <p className="text-xs text-white/60 leading-relaxed max-w-xl">{text}</p>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[11px] font-medium text-white bg-[#FF6633] hover:bg-[#ff7a4d] rounded px-3 py-1.5 inline-flex items-center gap-1"
      >
        Join the waitlist
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}

function ReportDashboard({ report }: { report: LevelstackReportJson }) {
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
          <div
            className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 text-center"
            style={{ borderColor: LPD.orange }}
          >
            <span className="text-3xl font-semibold" style={{ color: LPD.orange }}>
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
              {contentSections.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 truncate text-muted-foreground">{s.label}</span>
                  <span
                    className="h-2 flex-1 max-w-[200px] rounded-full bg-muted overflow-hidden"
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
                  <span className="w-8 text-right font-medium">{s.score}</span>
                </div>
              ))}
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

function ActionPlanPanel({
  report,
}: {
  report: LevelstackReportJson
}) {
  const groups = [
    { key: "week", label: "This week", className: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200" },
    { key: "month", label: "This month", className: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" },
    { key: "quarter", label: "This quarter", className: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200" },
  ] as const

  const items = {
    week: report.actionPlan.thisWeek,
    month: report.actionPlan.thisMonth,
    quarter: report.actionPlan.thisQuarter,
  }

  let num = 0

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key}>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded inline-block mb-2",
              g.className,
            )}
          >
            {g.label}
          </span>
          <div className="grid grid-cols-[20px_1fr_80px_64px] gap-2 text-[10px] uppercase text-muted-foreground border-b border-border pb-1 mb-1">
            <span>#</span>
            <span>Action</span>
            <span className="text-right">Who</span>
            <span className="text-right">Time</span>
          </div>
          {items[g.key].map((item) => {
            num += 1
            return (
              <div
                key={`${g.key}-${num}`}
                className="grid grid-cols-[20px_1fr_80px_64px] gap-2 py-2 border-b border-border/60 text-sm items-start"
              >
                <span className="text-muted-foreground text-xs pt-0.5">{num}</span>
                <div>
                  <p className="font-medium leading-snug">{item.task}</p>
                  {item.sub ? (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.sub}
                    </p>
                  ) : null}
                  {item.findingRef ? (
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      From: {item.findingRef}
                    </p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground text-right pt-0.5">
                  {item.who}
                </span>
                <span className="text-xs text-muted-foreground text-right pt-0.5">
                  {item.time}
                </span>
              </div>
            )
          })}
        </div>
      ))}
      <UpsellStrip variant="closing" />
    </div>
  )
}

function SectionPanel({
  section,
  reportDate,
}: {
  section: ReportSection
  reportDate: string
}) {
  const statusClass =
    section.status === "critical"
      ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
      : section.status === "attention"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"

  if (section.id === "action_plan") {
    return null
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 className="text-[15px] font-medium">{section.label}</h3>
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded", statusClass)}>
          {sectionStatusBadge(section)}
        </span>
      </div>

      {section.findings.map((f, i) => (
        <FindingCard key={i} finding={f} />
      ))}

      {section.scoreRows && section.scoreRows.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4 mb-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Website & presence signals
          </p>
          <ScoreRows section={section} />
        </div>
      )}

      {section.aiPreview && section.aiPreview.length > 0 && (
        <>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground my-3">
            AI search visibility preview (as of {reportDate})
          </p>
          <div className="grid sm:grid-cols-3 gap-2 mb-2">
            {section.aiPreview.map((ai, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {ai.platform}
                </p>
                <p className="text-xs leading-relaxed">{ai.result}</p>
                <FindingFlag severity={ai.severity} />
              </div>
            ))}
          </div>
        </>
      )}

      {section.competitiveGrid && <CompetitiveGrid section={section} />}

      {section.id === "search_footprint" && <UpsellStrip variant="search" />}
    </div>
  )
}

export function LevelstackReportView({ report }: LevelstackReportViewProps) {
  const { meta, executiveSummary, sections, actionPlan } = report
  const tabs = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.id, s]))
    return SECTION_TAB_ORDER.map((t) => ({
      ...t,
      section: byId.get(t.id),
    })).filter((t) => t.section || t.id === "action_plan")
  }, [sections])

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "search_footprint")
  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const sectionCount = contentSections.length

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-[#090E18] text-white px-6 pt-5 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-medium leading-tight">
              {meta.ownerName} · {meta.businessName}
            </h1>
            <p className="text-xs text-white/45 mt-1 tracking-wide">{meta.marketLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-[#FF6633] leading-none">
              {meta.letterGrade}
            </p>
            <p className="text-[11px] text-white/45 mt-1">{meta.overallScore}/100</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 border-t border-white/10 py-3 text-xs">
          <div>
            <p className="text-white/35 uppercase tracking-wider text-[10px]">Report date</p>
            <p className="text-white/70 font-medium mt-0.5">{meta.reportDate}</p>
          </div>
          <div>
            <p className="text-white/35 uppercase tracking-wider text-[10px]">Report type</p>
            <p className="text-white/70 font-medium mt-0.5">{planDisplayName(meta.planId)}</p>
          </div>
          <div>
            <p className="text-white/35 uppercase tracking-wider text-[10px]">Sections</p>
            <p className="text-white/70 font-medium mt-0.5">{sectionCount} of 6 complete</p>
          </div>
          <div>
            <p className="text-white/35 uppercase tracking-wider text-[10px]">Findings</p>
            <p className="text-white/70 font-medium mt-0.5">
              {meta.totalFindings} total · {meta.criticalCount} critical
            </p>
          </div>
        </div>

        <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-1 px-1">
          {tabs.map((tab) => {
            const section = tab.section
            const dotClass = section
              ? sectionDotClass(section.status)
              : "bg-[#E24B4A]"
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 h-10 px-3.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-white border-[#FF6633]"
                    : "text-white/40 border-transparent hover:text-white/70",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-b border-border bg-muted/20 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Executive summary
        </h2>
        {executiveSummary.paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground mb-3 last:mb-0">
            {p}
          </p>
        ))}
        <div className="mt-4 rounded-md border border-red-200/80 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-800 dark:text-red-200 mb-1">
            Your most critical issue
          </p>
          <p className="text-sm text-red-950 dark:text-red-100 leading-relaxed">
            {executiveSummary.criticalIssue}
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-4 mb-2">
          What to do first
        </p>
        <ul className="text-sm list-disc pl-5 space-y-1">
          {executiveSummary.firstSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-4 italic">
          Diagnostic only — you or your team execute fixes. LevelStack does not guarantee
          rankings or revenue outcomes.
        </p>
      </div>

      <ReportDashboard report={report} />

      <div>
        {activeTab === "action_plan" ? (
          <div className="px-6 py-5">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-[15px] font-medium">Prioritized action plan</h3>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">
                {actionPlan.thisWeek.length + actionPlan.thisMonth.length + actionPlan.thisQuarter.length} items
              </span>
            </div>
            <ActionPlanPanel report={report} />
          </div>
        ) : (
          sections
            .filter((s) => s.id === activeTab)
            .map((s) => (
              <SectionPanel key={s.id} section={s} reportDate={meta.reportDate} />
            ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-3 text-[11px] text-muted-foreground">
        <p>
          Generated by <strong className="text-[#FF6633] font-medium">LevelStack</strong>
          {" · "}Level Play Digital
        </p>
        <p className="italic">As of {meta.reportDate}</p>
      </div>
    </div>
  )
}
