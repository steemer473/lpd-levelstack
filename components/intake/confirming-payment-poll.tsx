"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

const POLL_INTERVAL_MS = 2500
const MAX_ATTEMPTS = 16

type EntitlementPollResponse = {
  paid?: boolean
  signedInEmail?: string | null
  checkoutEmailHint?: string | null
  mismatch?: boolean
}

type ConfirmingPaymentPollProps = {
  reportId?: string
  signedInEmail?: string | null
}

export function ConfirmingPaymentPoll({
  reportId,
  signedInEmail: initialSignedInEmail,
}: ConfirmingPaymentPollProps) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [mismatch, setMismatch] = useState(false)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(
    initialSignedInEmail ?? null,
  )
  const [checkoutEmailHint, setCheckoutEmailHint] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      try {
        const qs = reportId ? `?reportId=${encodeURIComponent(reportId)}` : ""
        const res = await fetch(`/api/levelstack/entitlement${qs}`)
        if (!res.ok || cancelled) return
        const data = (await res.json()) as EntitlementPollResponse
        if (data.signedInEmail) setSignedInEmail(data.signedInEmail)
        if (data.mismatch) {
          setMismatch(true)
          setCheckoutEmailHint(data.checkoutEmailHint ?? null)
          setTimedOut(true)
          return
        }
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
  }, [router, reportId])

  if (timedOut) {
    return (
      <div className="text-center space-y-4 py-8">
        {mismatch ? (
          <>
            <p className="font-semibold">Payment found — different account</p>
            <p className="text-muted-foreground text-sm">
              This upgrade was paid with
              {checkoutEmailHint ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">{checkoutEmailHint}</span>
                </>
              ) : (
                " a different email"
              )}
              {signedInEmail ? (
                <>
                  , but you&apos;re signed in as{" "}
                  <span className="font-medium text-foreground">{signedInEmail}</span>
                </>
              ) : null}
              . Sign in with the email used at checkout to finish intake.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              We&apos;re still confirming your payment. This can take a minute after checkout.
            </p>
            <p className="text-muted-foreground text-sm">
              Use the <span className="font-medium text-foreground">same email</span> you used
              when you ordered LevelStack
              {signedInEmail ? (
                <>
                  {" "}
                  (signed in as{" "}
                  <span className="font-medium text-foreground">{signedInEmail}</span>)
                </>
              ) : null}
              .
            </p>
          </>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="brand" onClick={() => router.refresh()}>
            Refresh page
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/auth/sign-in?redirect=${encodeURIComponent(
                `/intake?from=upgrade${reportId ? `&reportId=${reportId}` : ""}`,
              )}`}
            >
              Sign in with checkout email
            </Link>
          </Button>
          {reportId ? (
            <Button variant="outline" asChild>
              <a href={`/reports/${reportId}`}>View your snapshot</a>
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Check your order confirmation email for the address used at checkout, then sign in with
          that address on LevelStack.
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
        <p className="text-xs text-muted-foreground">
          Still working — usually under 30 seconds. If you checked out with a different email than
          this account, use that email to sign in.
        </p>
      ) : null}
    </div>
  )
}
