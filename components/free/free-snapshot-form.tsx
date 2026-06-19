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
import { getHubPricingUrl } from "@/lib/urls"

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
  const [submitting, setSubmitting] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!submitNotice) return
    noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [submitNotice])

  async function onSubmit(values: FreeSnapshotFormValues) {
    setSubmitError(null)
    setSubmitNotice(null)
    setExistingUserSignInUrl(null)

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
      }

      if (!res.ok) {
        setSubmitError(json.message ?? "Submission failed.")
        return
      }

      if (json.existingUser) {
        setSubmitNotice(
          json.message ??
            "Welcome back! We're refreshing your snapshot. Sign in below to watch progress — we'll email you when it's ready.",
        )
        if (json.signInUrl) {
          setExistingUserSignInUrl(json.signInUrl)
        }
        return
      }

      if (json.signInUrl) {
        window.location.assign(json.signInUrl)
        return
      }

      if (json.reportId) {
        router.push(`/reports/${json.reportId}`)
      }
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

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

        <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
          {submitting ? "Running your snapshot…" : "Run my snapshot"}
        </Button>

        <p className="text-muted-foreground text-xs text-center">
          Full six-section report from{" "}
          <Link href={getHubPricingUrl()} className="underline">
            $97
          </Link>
          . No credit card required for the snapshot.
        </p>
      </form>
    </Form>
  )
}
