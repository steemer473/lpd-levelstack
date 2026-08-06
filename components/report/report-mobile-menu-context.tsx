"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type ReportMobileMenuTab = {
  id: string
  label: string
  locked?: boolean
}

export type ReportMobileMenuRegistration = {
  tabs: ReportMobileMenuTab[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  onLockedTabClick?: (tabId: string) => void
  reportId?: string
}

type ReportMobileMenuContextValue = {
  registration: ReportMobileMenuRegistration | null
  register: (next: ReportMobileMenuRegistration) => void
  unregister: () => void
}

const ReportMobileMenuContext = createContext<ReportMobileMenuContextValue | null>(
  null,
)

export function ReportMobileMenuProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] =
    useState<ReportMobileMenuRegistration | null>(null)

  const register = useCallback((next: ReportMobileMenuRegistration) => {
    setRegistration(next)
  }, [])

  const unregister = useCallback(() => {
    setRegistration(null)
  }, [])

  const value = useMemo(
    () => ({ registration, register, unregister }),
    [registration, register, unregister],
  )

  return (
    <ReportMobileMenuContext.Provider value={value}>
      {children}
    </ReportMobileMenuContext.Provider>
  )
}

export function useReportMobileMenu() {
  const ctx = useContext(ReportMobileMenuContext)
  if (!ctx) {
    return {
      registration: null as ReportMobileMenuRegistration | null,
      register: () => {},
      unregister: () => {},
    }
  }
  return ctx
}

/** Register report section chrome for the top hamburger; clears on unmount. */
export function useRegisterReportMobileMenu(
  registration: ReportMobileMenuRegistration | null,
) {
  const { register, unregister } = useReportMobileMenu()

  useEffect(() => {
    if (!registration) {
      unregister()
      return
    }
    register(registration)
    return () => unregister()
  }, [registration, register, unregister])
}
