import { createGHLContact } from "@/lib/ghl/ghl-api"
import { getGHLFieldKey } from "@/lib/ghl/field-mapping"
import { splitFullName } from "@/lib/ghl/split-name"
import { env } from "@/env.mjs"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { ReportTier } from "@/lib/levelstack-plans"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { getAppUrl } from "@/lib/urls"

export type GHLSyncResult = {
  success: boolean
  contactId?: string
  error?: string
}

function parseGHLResponse(
  response: Awaited<ReturnType<typeof createGHLContact>>,
): GHLSyncResult {
  if (!response) {
    return {
      success: false,
      error: "GHL API not configured — GHL_API_KEY and/or GHL_LOCATION_ID missing",
    }
  }

  if (response.errors?.length) {
    return {
      success: false,
      error: response.errors.map((e) => e.message).join(", "),
    }
  }

  if (response.contact?.id) {
    return { success: true, contactId: response.contact.id }
  }

  return {
    success: false,
    error: response.message ?? "GHL API returned unexpected response",
  }
}

function buildReportUrl(reportId: string): string {
  return getAppUrl(`/reports/${reportId}`)
}

function paidAmountForPlan(planId: string): string {
  if (planId === "levelstack-strategy-call" || planId === "levelstack-review-call") {
    return "297"
  }
  return "97"
}

export async function syncFreeSnapshotLead(params: {
  email: string
  businessName: string
  websiteUrl: string
  marketCity?: string
  reportId: string
}): Promise<GHLSyncResult> {
  const { firstName, lastName } = splitFullName(params.businessName)
  const customFields: Record<string, string> = {
    [getGHLFieldKey("Website URL")]: params.websiteUrl,
    [getGHLFieldKey("Intake Source")]: "levelstack_free_snapshot",
    [getGHLFieldKey("LevelStack Report URL")]: buildReportUrl(params.reportId),
  }

  if (params.marketCity?.trim()) {
    customFields[getGHLFieldKey("Market City")] = params.marketCity.trim()
  }

  const response = await createGHLContact({
    firstName,
    lastName,
    email: params.email.trim().toLowerCase(),
    companyName: params.businessName.trim(),
    source: "LevelStack Free Snapshot",
    tags: ["levelstack", "levelstack_free_snapshot"],
    customFields,
  })

  return parseGHLResponse(response)
}

export async function syncPaidIntakeLead(params: {
  email: string
  ownerName: string
  formData: LevelstackIntakeFormValues
  planId: string
  reportId: string
}): Promise<GHLSyncResult> {
  const { firstName, lastName } = splitFullName(params.ownerName)
  const { formData, planId } = params

  const customFields: Record<string, string> = {
    [getGHLFieldKey("Website URL")]: formData.websiteUrl,
    [getGHLFieldKey("Intake Source")]: "levelstack_paid_intake",
    [getGHLFieldKey("LevelStack Report URL")]: buildReportUrl(params.reportId),
    [getGHLFieldKey("Primary Service")]: formData.primaryService,
    [getGHLFieldKey("Purchase Motivation")]: formData.purchaseMotivation,
    [getGHLFieldKey("Geo Focus")]: formData.geoMarket,
    [getGHLFieldKey("LevelStack Paid Amount")]: paidAmountForPlan(planId),
  }

  if (formData.marketCity?.trim()) {
    customFields[getGHLFieldKey("Market City")] = formData.marketCity.trim()
  }
  if (formData.ninetyDayGoal) {
    customFields[getGHLFieldKey("Ninety Day Goal")] = formData.ninetyDayGoal
  }
  if (formData.contractValueTier) {
    customFields[getGHLFieldKey("Contract Value Tier")] = formData.contractValueTier
  }
  if (formData.topCompetitorUrl?.trim()) {
    customFields[getGHLFieldKey("Top Competitor")] = formData.topCompetitorUrl.trim()
  }

  const response = await createGHLContact({
    firstName,
    lastName,
    email: params.email.trim().toLowerCase(),
    companyName: formData.primaryBusinessName.trim(),
    source: "LevelStack Paid Intake",
    tags: ["levelstack", "levelstack_paid_intake", planId],
    customFields,
  })

  return parseGHLResponse(response)
}

export type ReportCompleteEnrichmentParams = {
  email: string
  reportId: string
  reportTier: ReportTier
  reportJson: LevelstackReportJson
  topFinding?: string
  accessUrl?: string
}

export function buildReportCompleteCustomFields(
  params: ReportCompleteEnrichmentParams,
): Record<string, string> {
  const { reportJson, reportTier, reportId, topFinding, accessUrl } = params
  const customFields: Record<string, string> = {
    [getGHLFieldKey("LevelStack Report URL")]:
      accessUrl?.trim() || buildReportUrl(reportId),
    [getGHLFieldKey("Report Tier")]: reportTier,
  }
  if (reportTier === "full_report") {
    customFields[getGHLFieldKey("LevelStack SAP Credit Eligible")] = "yes"
  }

  const topCompetitor = reportJson.meta.upgradeTeasers?.previewCompetitor?.domain?.trim()
  if (topCompetitor) {
    customFields[getGHLFieldKey("Top Competitor")] = topCompetitor
  }

  const resolvedTopFinding =
    topFinding?.trim() || reportJson.executiveSummary.criticalIssue?.trim()
  if (resolvedTopFinding) {
    customFields[getGHLFieldKey("Top Finding")] = resolvedTopFinding
  }

  return customFields
}

export function buildReportCompleteTags(_reportTier: ReportTier): string[] {
  // Nurture tags removed — Plunk handles sequences; keep lightweight CRM label only.
  return ["levelstack"]
}

function isGhlSyncEnabled(): boolean {
  return env.GHL_SYNC_ENABLED !== false && Boolean(env.GHL_API_KEY && env.GHL_LOCATION_ID)
}

export async function syncReportCompleteEnrichment(
  params: ReportCompleteEnrichmentParams,
): Promise<GHLSyncResult> {
  if (!isGhlSyncEnabled()) {
    return { success: false, error: "GHL sync disabled or not configured" }
  }

  const customFields = buildReportCompleteCustomFields(params)
  const tags = buildReportCompleteTags(params.reportTier)

  const response = await createGHLContact({
    firstName: "LevelStack",
    lastName: "Report Ready",
    email: params.email.trim().toLowerCase(),
    source: "LevelStack Report Complete",
    tags,
    customFields,
  })

  return parseGHLResponse(response)
}
