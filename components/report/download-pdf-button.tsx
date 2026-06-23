"use client"

import { FileDown } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DownloadPdfButtonProps = {
  reportId: string
  className?: string
  label?: ReactNode
}

export function DownloadPdfButton({ reportId, className, label }: DownloadPdfButtonProps) {
  return (
    <Button asChild variant="outline" size="sm" className={cn("gap-1.5", className)}>
      <Link href={`/reports/${reportId}/print`} target="_blank" rel="noopener noreferrer">
        {label ?? (
          <>
            <FileDown className="h-4 w-4" aria-hidden />
            Download PDF
          </>
        )}
      </Link>
    </Button>
  )
}
