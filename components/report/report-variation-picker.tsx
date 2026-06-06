"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

export type ReportLayoutVariant = "a" | "b" | "c"

const VARIANTS: {
  id: ReportLayoutVariant
  label: string
  tagline: string
}[] = [
  {
    id: "a",
    label: "A · Polished tabs",
    tagline: "Sticky tab hub, meta chips, severity borders",
  },
  {
    id: "b",
    label: "B · Section rail",
    tagline: "Sidebar navigation, editorial split view",
  },
  {
    id: "c",
    label: "C · Command center",
    tagline: "Executive bento, kanban action plan",
  },
]

export function parseReportVariant(value: string | null): ReportLayoutVariant {
  if (value === "b" || value === "c") return value
  return "a"
}

export function ReportVariationPicker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = parseReportVariant(searchParams.get("variant"))

  return (
    <div
      className="rounded-lg border border-dashed border-lpd-orange/40 bg-gradient-to-r from-muted/80 to-card p-3 shadow-sm"
      role="region"
      aria-label="Report layout variations"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Design preview — pick a layout
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {VARIANTS.map((v) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("variant", v.id)
          const href = `${pathname}?${params.toString()}`
          const active = current === v.id
          return (
            <Link
              key={v.id}
              href={href}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-left transition-all",
                active
                  ? "border-lpd-orange bg-lpd-orange/10 shadow-sm ring-1 ring-lpd-orange/30"
                  : "border-border bg-card hover:border-lpd-orange/40 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "text-sm font-semibold block",
                  active ? "text-lpd-orange" : "text-foreground",
                )}
              >
                {v.label}
              </span>
              <span className="text-[11px] text-muted-foreground leading-snug block mt-0.5">
                {v.tagline}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
