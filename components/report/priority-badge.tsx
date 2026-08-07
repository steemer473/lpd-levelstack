import type { BadgeLevel } from "@/lib/report/action-priority-badges"
import { cn } from "@/lib/utils"

type PriorityBadgeProps = {
  level: BadgeLevel
  className?: string
}

/** High / medium / low chip using report design-system badge classes. */
export function PriorityBadge({ level, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "rpt-badge",
        level === "high" && "rpt-badge-high",
        level === "medium" && "rpt-badge-medium",
        level === "low" && "rpt-badge-low",
        className,
      )}
    >
      {level}
    </span>
  )
}

type PriorityCodeBadgeProps = {
  code: string
  className?: string
}

/** P0–P3 style priority code badge (matches exec Priority column). */
export function PriorityCodeBadge({ code, className }: PriorityCodeBadgeProps) {
  return (
    <span className={cn("rpt-badge rpt-badge-high", className)}>{code}</span>
  )
}
