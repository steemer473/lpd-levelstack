"use client"

import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LOCKED_SECTION_MODAL } from "@/lib/report/outcome-copy"
import { getHubCartUrl } from "@/lib/urls"

type LockedSectionUnlockModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId?: string
  price?: string
}

export function LockedSectionUnlockModal({
  open,
  onOpenChange,
  reportId,
  price,
}: LockedSectionUnlockModalProps) {
  const cartUrl = getHubCartUrl({ reportId, source: "levelstack_report" })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-balance leading-snug pr-6">
            {LOCKED_SECTION_MODAL.title}
          </DialogTitle>
          <DialogDescription>{LOCKED_SECTION_MODAL.description}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {LOCKED_SECTION_MODAL.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-[var(--rpt-body)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-auto min-h-10 w-full whitespace-normal py-2 sm:w-auto"
          >
            {LOCKED_SECTION_MODAL.secondaryCta}
          </Button>
          <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
            <Button variant="brand" size="lg" asChild className="w-full sm:w-auto">
              <Link href={cartUrl}>
                {LOCKED_SECTION_MODAL.primaryCta(price)}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground sm:text-right">
              {LOCKED_SECTION_MODAL.creditNote}
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
