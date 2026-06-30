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
import { SAP_WAITLIST_MODAL } from "@/lib/report/outcome-copy"

type SapWaitlistModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SapWaitlistModal({ open, onOpenChange }: SapWaitlistModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{SAP_WAITLIST_MODAL.title}</DialogTitle>
          <DialogDescription>{SAP_WAITLIST_MODAL.paidStatusLine}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SAP_WAITLIST_MODAL.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-[var(--rpt-body)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="brand" asChild>
            <Link href={SAP_WAITLIST_MODAL.waitlistUrl}>
              {SAP_WAITLIST_MODAL.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
