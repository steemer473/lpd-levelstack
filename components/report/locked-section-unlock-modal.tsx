"use client"

import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { usePaidOwnerReportChrome } from "@/components/report/paid-owner-report-context"
import { Unlock97CtaLabel } from "@/components/report/unlock-97-cta-label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  LOCKED_SECTION_MODAL,
  SAMPLE_ACTION_ROADMAP_PATH,
} from "@/lib/report/outcome-copy"
import { getHubCartUrl } from "@/lib/urls"

type LockedSectionUnlockModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId?: string
  price?: string
  /** Deep-link tab on the sample Action Roadmap (e.g. competitive_context). */
  sampleTab?: string
}

export function LockedSectionUnlockModal({
  open,
  onOpenChange,
  reportId,
  price,
  sampleTab,
}: LockedSectionUnlockModalProps) {
  const { suppressLevelstackPurchaseCtas, actionRoadmapReportId } =
    usePaidOwnerReportChrome()

  const paidOwner =
    suppressLevelstackPurchaseCtas && Boolean(actionRoadmapReportId)
  const primaryHref = paidOwner
    ? `/reports/${actionRoadmapReportId}`
    : getHubCartUrl({ reportId, source: "levelstack_report" })

  const sampleHref = sampleTab
    ? `${SAMPLE_ACTION_ROADMAP_PATH}?tab=${encodeURIComponent(sampleTab)}`
    : SAMPLE_ACTION_ROADMAP_PATH

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-balance leading-snug pr-6">
            {paidOwner
              ? "Included in your Action Roadmap"
              : LOCKED_SECTION_MODAL.title}
          </DialogTitle>
          <DialogDescription>
            {paidOwner
              ? "This free Visibility Snapshot does not include every section. Open your Action Roadmap for the full diagnostic."
              : LOCKED_SECTION_MODAL.description}
          </DialogDescription>
        </DialogHeader>
        {!paidOwner ? (
          <ul className="space-y-2">
            {LOCKED_SECTION_MODAL.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 text-sm text-[var(--rpt-body)]"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          {paidOwner ? (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-auto min-h-10 w-full whitespace-normal py-2 text-center sm:w-auto sm:text-left"
            >
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              asChild
              className="h-auto min-h-10 w-full whitespace-normal py-2 text-center sm:w-auto sm:text-left"
            >
              <Link href={sampleHref}>{LOCKED_SECTION_MODAL.secondaryCta}</Link>
            </Button>
          )}
          <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
            <Button
              variant="brand"
              size="lg"
              asChild
              className="w-full justify-center text-center sm:w-auto"
            >
              <Link href={primaryHref}>
                {paidOwner ? (
                  "View your Action Roadmap"
                ) : price && price !== "$97" ? (
                  LOCKED_SECTION_MODAL.primaryCta(price)
                ) : (
                  <Unlock97CtaLabel mobileBreakpoint="sm" />
                )}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            {!paidOwner ? (
              <p className="text-center text-xs text-muted-foreground sm:text-right">
                {LOCKED_SECTION_MODAL.creditNote}
              </p>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
