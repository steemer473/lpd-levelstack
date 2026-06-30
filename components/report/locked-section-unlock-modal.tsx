"use client"

import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LOCKED_SECTION_MODAL } from "@/lib/report/outcome-copy"
import { getHubUpgradeUrl } from "@/lib/urls"

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
  const upgradeUrl = getHubUpgradeUrl({ reportId, source: "levelstack_report" })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{LOCKED_SECTION_MODAL.title}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {LOCKED_SECTION_MODAL.secondaryCta}
          </Button>
          <Button variant="brand" asChild>
            <Link href={upgradeUrl}>{LOCKED_SECTION_MODAL.primaryCta(price)}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
