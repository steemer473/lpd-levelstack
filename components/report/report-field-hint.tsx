"use client"

import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function ReportFieldHint({
  label,
  detail,
  className,
}: {
  label: string
  detail: string
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground",
            className,
          )}
          aria-label={`About ${label}`}
        >
          <Info className="size-3" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 gap-2 p-3">
        <p className="text-[11px] font-semibold text-foreground">{label}</p>
        <p className="text-[12px] leading-relaxed text-muted-foreground">{detail}</p>
      </PopoverContent>
    </Popover>
  )
}
