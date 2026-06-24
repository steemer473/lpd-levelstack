"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type RetryReportButtonProps = {
  reportId: string
  label?: string
}

/** Production retry — plain POST /run (preserves plan/tier; never uses dev ?regenerate=1). */
export function RetryReportButton({
  reportId,
  label = "Try again",
}: RetryReportButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRetry() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${reportId}/run`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof data.message === "string" ? data.message : `Failed (${res.status})`,
        )
        setLoading(false)
        return
      }
      router.push(`/reports/${reportId}`)
      router.refresh()
    } catch {
      setError("Network error — try again.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="brand" onClick={handleRetry} disabled={loading} type="button">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting…
          </>
        ) : (
          label
        )}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
