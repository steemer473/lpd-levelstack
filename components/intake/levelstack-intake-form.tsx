"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { applyZodErrors } from "@/lib/intake/apply-zod-errors"
import {
  levelstackIntakeDefaults,
  levelstackIntakeSchema,
  type LevelstackIntakeFormValues,
} from "@/lib/intake/schema"

export function LevelstackIntakeForm() {
  const router = useRouter()
  const form = useForm<LevelstackIntakeFormValues>({
    defaultValues: levelstackIntakeDefaults,
  })

  const priorNames =
    useWatch({ control: form.control, name: "priorBusinessNames" }) ??
    levelstackIntakeDefaults.priorBusinessNames
  const hasAdSpend =
    useWatch({ control: form.control, name: "hasActiveAdSpend" }) === "yes"
  const geoMarket =
    useWatch({ control: form.control, name: "geoMarket" }) ??
    levelstackIntakeDefaults.geoMarket
  const needsMarketCity = geoMarket === "local" || geoMarket === "regional"
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationSummary, setValidationSummary] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(values: LevelstackIntakeFormValues) {
    setSubmitError(null)
    setValidationSummary([])

    const payload = {
      ...values,
      priorBusinessNames: values.priorBusinessNames
        .map((n) => n.trim())
        .filter(Boolean),
    }

    const parsed = levelstackIntakeSchema.safeParse(payload)
    if (!parsed.success) {
      const messages = applyZodErrors(form.setError, parsed.error)
      setValidationSummary(messages)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const contentType = res.headers.get("content-type") ?? ""
      const data = contentType.includes("application/json")
        ? await res.json()
        : null

      if (!res.ok) {
        if (res.status === 409 && data?.reportId) {
          router.push(`/reports/${data.reportId}`)
          router.refresh()
          return
        }
        setSubmitError(
          (data && typeof data.message === "string" && data.message) ||
            `Submission failed (${res.status}). Check the fields above and try again.`,
        )
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      if (data?.reportId) {
        router.push(`/reports/${data.reportId}`)
      } else {
        router.push("/intake/complete")
      }
      router.refresh()
    } catch {
      setSubmitError("Something went wrong. Please try again.")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {(validationSummary.length > 0 || submitError) && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm"
          >
            {submitError && <p className="font-medium">{submitError}</p>}
            {validationSummary.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {validationSummary.slice(0, 6).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Business identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primaryBusinessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary business name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="marketCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Primary city / metro
                      {needsMarketCity ? " (required)" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Atlanta" />
                    </FormControl>
                    <FormDescription>
                      Required for local and regional businesses. We append this to
                      searches so a common name (e.g. Platinum Real Estate) resolves
                      to your market, not another city.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / province (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. GA" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Prior business names, brands, or DBAs</Label>
              <FormDescription>
                Include all names prospects might search. Use “None” in one row if not
                applicable.
              </FormDescription>
              {priorNames.map((_, index) => (
                <FormField
                  key={`prior-${index}`}
                  control={form.control}
                  name={`priorBusinessNames.${index}`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...nameField} placeholder="Prior name or DBA" />
                        </FormControl>
                        {priorNames.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const next = [...priorNames]
                              next.splice(index, 1)
                              form.setValue("priorBusinessNames", next)
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  form.setValue("priorBusinessNames", [...priorNames, ""])
                }
              >
                Add another name
              </Button>
            </div>
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner / personal brand name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offer & marketing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primaryService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary service or offer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current price point</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. $2,500 coaching package" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasActiveAdSpend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active paid ad spend?</FormLabel>
                  <FormControl>
                    <select
                      className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {hasAdSpend && (
              <>
                <FormField
                  control={form.control}
                  name="adPlatforms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platforms</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Meta, Google, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approximate monthly budget</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Digital footprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://" />
                  </FormControl>
                  <FormDescription>
                    Use a full URL or domain (we add https://). The server checks
                    that the site responds — this can take up to 10 seconds.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialProfiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active social profiles</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="One per line or comma-separated" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailListSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approximate email list size</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 2,400 subscribers" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="geoMarket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographic market</FormLabel>
                  <FormControl>
                    <select
                      className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="local">Local</option>
                      <option value="regional">Regional</option>
                      <option value="national">National</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reputation & context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="complaintsAwareness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Complaints, press, or disputes we should research
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reputationScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reputation self-rating (1–10)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reputationSelfAssessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why that rating?</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseMotivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What prompted your purchase?</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" variant="brand" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit intake"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
