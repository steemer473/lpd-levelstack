"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  freeSnapshotDefaults,
  freeSnapshotSchema,
  type FreeSnapshotFormValues,
} from "@/lib/intake/free-snapshot-schema"
import { getHubPricingUrl } from "@/lib/urls"

export function FreeSnapshotForm() {
  const router = useRouter()
  const form = useForm<FreeSnapshotFormValues>({
    defaultValues: freeSnapshotDefaults,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(values: FreeSnapshotFormValues) {
    setSubmitError(null)

    const parsed = freeSnapshotSchema.safeParse(values)
    if (!parsed.success) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/free-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const json = (await res.json()) as {
        success?: boolean
        message?: string
        reportId?: string
        signInUrl?: string
      }

      if (res.status === 409 && json.reportId) {
        router.push(`/reports/${json.reportId}`)
        return
      }

      if (!res.ok) {
        setSubmitError(json.message ?? "Submission failed.")
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
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
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

        {submitError && (
          <p className="text-destructive text-sm rounded-md bg-destructive/10 border border-destructive/20 p-3">
            {submitError}
          </p>
        )}

        <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
          {submitting ? "Starting your snapshot…" : "Get my free snapshot"}
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
