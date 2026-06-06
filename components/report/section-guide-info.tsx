"use client"

import { Info } from "lucide-react"

import { SectionGuideBody } from "@/components/report/section-guide-content"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getSectionGuide } from "@/lib/report/section-guides"
import { cn } from "@/lib/utils"

export function SectionGuideInfo({
  tabId,
  tone = "default",
}: {
  tabId: string
  tone?: "default" | "on-dark"
}) {
  const guide = getSectionGuide(tabId)
  if (!guide) return null

  const isRich =
    typeof guide.what !== "string" || typeof guide.why !== "string"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "shrink-0",
            tone === "on-dark"
              ? "text-white/40 hover:text-white/80 hover:bg-white/10"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label="About this section"
        >
          <Info className="size-3.5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className={cn(
          "w-auto gap-0 p-4 max-h-[min(70vh,28rem)] overflow-y-auto",
          isRich ? "max-w-md" : "max-w-sm",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          What this section shows
        </p>
        <SectionGuideBody content={guide.what} />

        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2">
          Why it matters for your business
        </p>
        <div className="text-muted-foreground [&_strong]:text-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          <SectionGuideBody content={guide.why} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
