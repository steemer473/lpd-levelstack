"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

const POLL_INTERVAL_MS = 2500
const MAX_ATTEMPTS = 16

type ConfirmingPaymentPollProps = {
  reportId?: string
}

export function ConfirmingPaymentPoll({ reportId }: ConfirmingPaymentPollProps) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      try {
        const res = await fetch("/api/levelstack/entitlement")
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { paid?: boolean }
        if (data.paid) {
          router.refresh()
          return
        }
      } catch {
        /* retry */
      }

      attempts += 1
      if (!cancelled) setAttempt(attempts)
      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true)
        return
      }
      if (!cancelled) {
        window.setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [router])

  if (timedOut) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-muted-foreground text-sm">
          We&apos;re still confirming your payment. This can take a minute after checkout.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="brand" onClick={() => router.refresh()}>
            Refresh page
          </Button>
          {reportId ? (
            <Button variant="outline" asChild>
              <a href={`/reports/${reportId}`}>View your snapshot</a>
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          If payment completed, check your email for a link to finish intake.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4 py-12">
      <Loader2 className="h-10 w-10 animate-spin text-brand-orange mx-auto" />
      <div>
        <p className="font-semibold">Confirming your payment…</p>
        <p className="text-muted-foreground text-sm mt-1">
          You&apos;ll be able to complete your intake in just a moment.
        </p>
      </div>
      {attempt > 3 ? (
        <p className="text-xs text-muted-foreground">Still working — usually under 30 seconds.</p>
      ) : null}
    </div>
  )
}
