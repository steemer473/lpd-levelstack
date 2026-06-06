import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type FormPanelProps = {
  children: ReactNode
  className?: string
}

/** White elevated panel — seo-audit / seo-foundation form card pattern */
export function FormPanel({ children, className }: FormPanelProps) {
  return (
    <div className={cn("form-panel p-6 md:p-8 lg:p-10", className)}>{children}</div>
  )
}
