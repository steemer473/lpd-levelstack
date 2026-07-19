"use client"

import { createContext, useContext, type ReactNode } from "react"

export type PaidOwnerReportChrome = {
  /** Paid entitlement + ready Action Roadmap — hide LevelStack buy CTAs. */
  suppressLevelstackPurchaseCtas: boolean
  /** Latest ready paid report id for "View your Action Roadmap". */
  actionRoadmapReportId?: string
}

const PaidOwnerReportContext = createContext<PaidOwnerReportChrome>({
  suppressLevelstackPurchaseCtas: false,
})

export function PaidOwnerReportProvider({
  value,
  children,
}: {
  value: PaidOwnerReportChrome
  children: ReactNode
}) {
  return (
    <PaidOwnerReportContext.Provider value={value}>
      {children}
    </PaidOwnerReportContext.Provider>
  )
}

export function usePaidOwnerReportChrome(): PaidOwnerReportChrome {
  return useContext(PaidOwnerReportContext)
}
