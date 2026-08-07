import {
  AlertTriangle,
  ShieldCheck,
  type LucideIcon,
  ScanSearch,
  TrendingUp,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { linkifyText } from "@/lib/report/linkify-urls"
import { OUTCOME_LABELS, type OutcomeLabelKey } from "@/lib/report/outcome-copy"
import { cn } from "@/lib/utils"

const OUTCOME_STYLES: Record<
  OutcomeLabelKey,
  { icon: LucideIcon; badgeClass: string; bulletClass: string }
> = {
  revenueRisk: {
    icon: AlertTriangle,
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    bulletClass: "text-red-700",
  },
  visibilityLeak: {
    icon: ScanSearch,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    bulletClass: "text-amber-700",
  },
  competitorAdvantage: {
    icon: TrendingUp,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    bulletClass: "text-sky-700",
  },
  performanceLeak: {
    icon: Zap,
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    bulletClass: "text-orange-700",
  },
  verifiedAsset: {
    icon: ShieldCheck,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bulletClass: "text-emerald-700",
  },
}

type OutcomeAuditCardProps = {
  headline: string
  /** Contextual lede rendered as a paragraph (not a bullet). */
  lede?: string
  bullets?: string[]
  outcome: OutcomeLabelKey
  className?: string
}

export function OutcomeAuditCard({
  headline,
  lede,
  bullets = [],
  outcome,
  className,
}: OutcomeAuditCardProps) {
  const style = OUTCOME_STYLES[outcome]
  const Icon = style.icon
  const visibleBullets = bullets.filter(Boolean).slice(0, 3)

  return (
    <div className={cn("rpt-finding-card mb-3 min-w-0 overflow-hidden", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline" className={cn("gap-1.5", style.badgeClass)}>
          <Icon className="size-3.5" aria-hidden />
          {OUTCOME_LABELS[outcome]}
        </Badge>
      </div>
      <p className="text-sm font-semibold leading-snug text-[var(--rpt-heading)] break-words [overflow-wrap:anywhere]">
        {linkifyText(headline)}
      </p>
      {lede ? <p className="rpt-finding-context mt-1.5">{linkifyText(lede)}</p> : null}
      {visibleBullets.length > 0 ? (
        <ul className="mt-2 min-w-0 space-y-1.5 list-none pl-0">
          {visibleBullets.map((bullet, index) => (
            <li key={`${outcome}-${index}`} className="flex min-w-0 items-start gap-2 text-[13px]">
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", style.bulletClass)} aria-hidden />
              <span className="min-w-0 leading-relaxed text-[var(--rpt-body)] break-words [overflow-wrap:anywhere]">
                {linkifyText(bullet)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
