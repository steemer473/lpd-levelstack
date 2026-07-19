"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  freeSnapshotDefaults,
  freeSnapshotSchema,
  parseFreeSnapshotInput,
  type FreeSnapshotFormValues,
} from "@/lib/intake/free-snapshot-schema"
import { resolveFreeSnapshotSubmitRedirect } from "@/lib/intake/resolve-free-snapshot-submit-redirect"
import { getHubPricingUrl } from "@/lib/urls"

type PaidOwnerRefreshState = {
  message: string
  actionRoadmapReportId: string
  freeReportId: string
  signInUrl?: string
  /** Session already matches — can open free report without magic link. */
  canOpenFreeDirectly: boolean
}

export function FreeSnapshotForm() {
  const router = useRouter()
  const form = useForm<FreeSnapshotFormValues>({
    // @hookform/resolvers supports Zod 4 at runtime; typings still target Zod 3 shapes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(freeSnapshotSchema as any) as Resolver<FreeSnapshotFormValues>,
    defaultValues: freeSnapshotDefaults,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [existingUserSignInUrl, setExistingUserSignInUrl] = useState<string | null>(
    null,
  )
  const [paidOwnerRefresh, setPaidOwnerRefresh] = useState<PaidOwnerRefreshState | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!submitNotice && !paidOwnerRefresh) return
    noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [submitNotice, paidOwnerRefresh])

  async function onSubmit(values: FreeSnapshotFormValues) {
    setSubmitError(null)
    setSubmitNotice(null)
    setExistingUserSignInUrl(null)
    setPaidOwnerRefresh(null)

    setSubmitting(true)
    try {
      const res = await fetch("/api/free-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseFreeSnapshotInput(values)),
      })
      const json = (await res.json()) as {
        success?: boolean
        message?: string
        reportId?: string
        signInUrl?: string
        existingUser?: boolean
        redirectImmediately?: boolean
        branch?: string
        actionRoadmapReportId?: string
      }

      if (!res.ok) {
        setSubmitError(json.message ?? "Submission failed.")
        return
      }

      const action = resolveFreeSnapshotSubmitRedirect(json)

      switch (action?.type) {
        case "paid_owner_refresh": {
          setPaidOwnerRefresh({
            message:
              json.message ??
              "You already have an Action Roadmap. Continue with this free snapshot when you're ready.",
            actionRoadmapReportId: action.actionRoadmapReportId,
            freeReportId: action.reportId,
            signInUrl: action.signInUrl,
            canOpenFreeDirectly: Boolean(action.redirectImmediately),
          })
          return
        }
        case "redirect_report":
        case "redirect_report_fallback":
          router.push(`/reports/${action.reportId}`)
          return
        case "redirect_magic_link":
          window.location.assign(action.signInUrl)
          return
        case "welcome_back":
          setSubmitNotice(
            json.message ??
              "Welcome back! We're refreshing your snapshot. Sign in below to watch progress — we'll email you when it's ready.",
          )
          if (action.signInUrl) {
            setExistingUserSignInUrl(action.signInUrl)
          }
          return
        default:
          break
      }
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formLocked = Boolean(submitNotice) || Boolean(paidOwnerRefresh)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@business.com" {...field} />
              </FormControl>
              <FormDescription>
                We&apos;ll use this to send your report and to log you in later. No spam.
                Unsubscribe anytime.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Consulting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input placeholder="yourbusiness.com" {...field} />
              </FormControl>
              <FormDescription>
                No https:// or trailing slash — we handle that
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="marketCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Atlanta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {paidOwnerRefresh && (
          <div
            ref={noticeRef}
            className="rounded-md bg-muted border border-border p-4 space-y-3"
            role="status"
          >
            <p className="text-sm text-muted-foreground">{paidOwnerRefresh.message}</p>
            <div className="flex flex-col gap-2">
              <Button variant="brand" asChild className="w-full">
                <Link href={`/reports/${paidOwnerRefresh.actionRoadmapReportId}`}>
                  View your Action Roadmap
                </Link>
              </Button>
              {paidOwnerRefresh.canOpenFreeDirectly || !paidOwnerRefresh.signInUrl ? (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/reports/${paidOwnerRefresh.freeReportId}`}>
                    Continue with this free snapshot
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <a href={paidOwnerRefresh.signInUrl}>
                    Continue with this free snapshot
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {submitNotice && (
          <div
            ref={noticeRef}
            className="rounded-md bg-muted border border-border p-3 space-y-2"
            role="status"
          >
            <p className="text-sm text-muted-foreground">{submitNotice}</p>
            {existingUserSignInUrl && (
              <a
                href={existingUserSignInUrl}
                className="inline-flex text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Sign in to view your snapshot →
              </a>
            )}
          </div>
        )}

        {submitError && (
          <p className="text-destructive text-sm rounded-md bg-destructive/10 border border-destructive/20 p-3">
            {submitError}
          </p>
        )}

        {!paidOwnerRefresh && (
          <Button
            type="submit"
            variant="brand"
            className="w-full"
            disabled={submitting || formLocked}
          >
            {submitting
              ? "Running your snapshot…"
              : submitNotice
                ? "Use the link above to continue"
                : "Run my snapshot"}
          </Button>
        )}

        {!paidOwnerRefresh && (
          <p className="text-muted-foreground text-xs text-center">
            Action Roadmap from{" "}
            <Link href={getHubPricingUrl()} className="underline">
              $97
            </Link>
            . No credit card required for the snapshot.
          </p>
        )}
      </form>
    </Form>
  )
}
