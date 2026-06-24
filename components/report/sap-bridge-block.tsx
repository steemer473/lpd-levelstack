"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { SAP_BRIDGE_COPY, type SapBridgePlacement } from "@/lib/report/sap-bridge-copy"
import { getHubSeoWaitlistUrl } from "@/lib/urls"

export function SapBridgeBlock({ placement }: { placement: SapBridgePlacement }) {
  const copy = SAP_BRIDGE_COPY[placement]
  const href = getHubSeoWaitlistUrl()

  return (
    <div className="rpt-upsell mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-white/60 max-w-xl">{copy.body}</p>
      <Link href={href} className="rpt-upsell-btn inline-flex shrink-0 items-center gap-1">
        {copy.ctaLabel}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  )
}
