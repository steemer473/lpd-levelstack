"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { SapWaitlistModal } from "@/components/report/sap-waitlist-modal"
import { SAP_BRIDGE_COPY, type SapBridgePlacement } from "@/lib/report/sap-bridge-copy"

export function SapBridgeBlock({ placement }: { placement: SapBridgePlacement }) {
  const copy = SAP_BRIDGE_COPY[placement]
  const [sapModalOpen, setSapModalOpen] = useState(false)

  return (
    <>
      <div className="rpt-upsell mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-white/60 max-w-xl">{copy.body}</p>
        <button
          type="button"
          onClick={() => setSapModalOpen(true)}
          className="rpt-upsell-btn inline-flex shrink-0 items-center gap-1"
        >
          {copy.ctaLabel}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
      <SapWaitlistModal open={sapModalOpen} onOpenChange={setSapModalOpen} />
    </>
  )
}
