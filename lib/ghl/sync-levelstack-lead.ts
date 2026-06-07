import { createGHLContact } from "@/lib/ghl/ghl-api"
import { getGHLFieldKey } from "@/lib/ghl/field-mapping"
import { splitFullName } from "@/lib/ghl/split-name"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
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
  }

  if (formData.marketCity?.trim()) {
    customFields[getGHLFieldKey("Market City")] = formData.marketCity.trim()
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
