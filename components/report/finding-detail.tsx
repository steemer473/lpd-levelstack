import Link from "next/link"
import type { ReactNode } from "react"

import { DETAIL_KEY_LABELS } from "@/lib/report/customer-terms"
import { cn } from "@/lib/utils"
import {
  parseFindingDetail,
  splitFindingValue,
  type ParsedFindingDetail,
  type SerpResultItem,
} from "@/lib/report/parse-finding-detail"

function SerpResultsList({
  intro,
  items,
}: {
  intro?: string
  items: SerpResultItem[]
}) {
  return (
    <div className="mt-2 space-y-2">
      {intro ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {intro}
        </p>
      ) : null}
      <ol className="space-y-2 list-none pl-0">
        {items.map((item) => (
          <li
            key={`${item.position}-${item.url}`}
            className="flex gap-2 text-[13px] leading-snug text-muted-foreground"
          >
            <span className="shrink-0 font-semibold tabular-nums text-lpd-orange">
              #{item.position}
            </span>
            <span className="min-w-0">
              <span className="text-foreground">{item.title}</span>
              <span className="block mt-0.5">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-lpd-orange/90 hover:text-lpd-orange hover:underline break-all"
                >
                  {item.url}
                </Link>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ParsedDetailBody({ parsed }: { parsed: ParsedFindingDetail }) {
  switch (parsed.kind) {
    case "serp":
      return <SerpResultsList intro={parsed.intro} items={parsed.items} />
    case "keyValue":
      return (
        <ul className="mt-2 space-y-1.5 list-none pl-0">
          {parsed.items.map((item) => (
            <li
              key={item.key}
              className="text-[13px] leading-relaxed text-muted-foreground"
            >
              <span className="font-semibold text-foreground">
                {DETAIL_KEY_LABELS[item.key] ?? item.key}:{" "}
              </span>
              {item.value}
            </li>
          ))}
        </ul>
      )
    case "bullets":
      return (
        <ul className="mt-2 space-y-1.5 list-disc pl-4 marker:text-lpd-orange">
          {parsed.items.map((item, i) => (
            <li
              key={i}
              className="text-[13px] leading-relaxed text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      )
    case "paragraphs":
      return (
        <div className="mt-2 space-y-2">
          {parsed.paragraphs.map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
      )
    case "plain":
      return (
        <p className="text-[13px] leading-relaxed text-muted-foreground mt-2">
          {parsed.text}
        </p>
      )
    default:
      return null
  }
}

export function FindingValueHeadline({ value }: { value: string }) {
  const { lead, emphasis } = splitFindingValue(value)

  if (!emphasis) {
    return (
      <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
    )
  }

  return (
    <p className="text-sm leading-snug text-foreground">
      <span className="font-semibold">{lead} </span>
      <span className="font-semibold text-lpd-orange">{emphasis}</span>
    </p>
  )
}

export function FindingDetailContent({ detail }: { detail: string }) {
  const parsed = parseFindingDetail(detail)
  if (!parsed) return null
  return <ParsedDetailBody parsed={parsed} />
}

export function DataPanel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-muted/40 p-4 mb-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DataPanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 leading-tight">
      {children}
    </p>
  )
}
