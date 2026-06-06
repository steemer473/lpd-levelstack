"use client"

import { FileDown } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type DownloadPdfButtonProps = {
  reportId: string
}

export function DownloadPdfButton({ reportId }: DownloadPdfButtonProps) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-1.5">
      <Link href={`/reports/${reportId}/print`} target="_blank" rel="noopener noreferrer">
        <FileDown className="h-4 w-4" aria-hidden />
        Download PDF
      </Link>
    </Button>
  )
}
