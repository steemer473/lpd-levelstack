"use client"

import type { ReactNode } from "react"
import { Lock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getHubCartUrl, type HubUpgradeSource } from "@/lib/urls"
import { cn } from "@/lib/utils"

type UpsellBlurOverlayProps = {
  message: string
  className?: string
  children: ReactNode
  reportId?: string
  source?: HubUpgradeSource
}

export function UpsellBlurOverlay({
  message,
  className,
  children,
  reportId,
  source = "levelstack_report",
}: UpsellBlurOverlayProps) {
  const upgradeUrl = getHubCartUrl({ reportId, source })
  return (
    <div className={cn("grid overflow-hidden rounded-lg", className)}>
      <div
        className="col-start-1 row-start-1 pointer-events-none select-none blur-[5px] opacity-70"
        aria-hidden
      >
        {children}
      </div>
      <div className="col-start-1 row-start-1 z-10 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-white/55 via-white/80 to-white/95 px-4 py-6 text-center dark:from-background/55 dark:via-background/80 dark:to-background/95">
        <Lock className="h-5 w-5 shrink-0 text-brand-orange" aria-hidden />
        <p className="text-sm font-medium text-foreground max-w-xs">{message}</p>
        <Button variant="brand" size="sm" asChild className="shrink-0">
          <Link href={upgradeUrl}>Unlock Action Roadmap — $97</Link>
        </Button>
      </div>
    </div>
  )
}
