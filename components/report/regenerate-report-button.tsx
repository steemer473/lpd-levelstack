"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type RegenerateReportButtonProps = {
  reportId: string
  /** Shown when the saved report is an old placeholder, not a normal rebuild */
  isStalePlaceholder?: boolean
}

export function RegenerateReportButton({
  reportId,
  isStalePlaceholder = false,
}: RegenerateReportButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/reports/${reportId}/run?regenerate=1`,
        { method: "POST" },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof data.message === "string" ? data.message : `Failed (${res.status})`,
        )
        setLoading(false)
        return
      }
      setLoading(false)
      router.push(`/reports/${reportId}`)
      router.refresh()
    } catch {
      setError("Network error — try again.")
      setLoading(false)
    }
  }

  return (
    <div
      className={
        isStalePlaceholder
          ? "rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 mb-6 space-y-3"
          : "rounded-lg border border-muted bg-muted/30 p-4 mb-6 space-y-3"
      }
    >
      <p className="text-sm text-muted-foreground">
        {isStalePlaceholder
          ? "This report was generated before research API keys were active (or OpenAI billing failed). Regenerate to run live SERP research and refresh findings."
          : "Development only: rebuild from your latest intake. You'll see the progress screen; total time is usually 1–3 minutes."}
      </p>
      <Button onClick={handleRegenerate} disabled={loading} type="button">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting…
          </>
        ) : (
          isStalePlaceholder ? "Regenerate report" : "Rebuild report (dev)"
        )}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
