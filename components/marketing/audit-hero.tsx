import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type HeroBadge = {
  icon: LucideIcon
  label: string
}

type AuditHeroProps = {
  tagline: string
  heading: string
  headingHighlight: string
  description: string
  badges?: HeroBadge[]
  className?: string
}

export function AuditHero({
  tagline,
  heading,
  headingHighlight,
  description,
  badges = [],
  className,
}: AuditHeroProps) {
  const parts = heading.split(headingHighlight)
  const before = parts[0] ?? ""
  const after = parts[1] ?? ""

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden text-center pt-20 pb-24 md:pb-28",
        "bg-hero hero-mesh text-white",
        className,
      )}
    >
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <p className="mb-4 text-sm font-semibold drop-shadow-md">
          <span className="text-brand-orange">•</span> {tagline}
        </p>
        <h1 className="hero-h1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
          {before && <span className="drop-shadow-lg">{before}</span>}
          <span className="gradient-text drop-shadow-lg">{headingHighlight}</span>
          {after && <span className="drop-shadow-lg">{after}</span>}
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto line-spacing-consistent drop-shadow-md">
          {description}
        </p>
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {badges.map(({ icon: Icon, label }) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-sm py-2 px-4 border-white/30 bg-white/15 text-white hover:bg-white/20"
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
