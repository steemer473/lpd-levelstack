import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Matches the primary CTA styling used on the live LevelStack pricing matrix:
 * `bg-primary text-primary-foreground hover:bg-primary/90` with brand-orange
 * focus ring. Renders an `<a>` when `href` is provided, otherwise a `<button>`.
 */
export function PricingCta({
  href,
  ariaLabel,
  children,
  className,
}: {
  href?: string
  ariaLabel: string
  children: ReactNode
  className?: string
}) {
  const classes = cn(
    "inline-flex h-11 w-full items-center justify-center gap-2 break-words rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-orange)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    className,
  )

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
