import { PLUNK_EVENTS } from "@/lib/plunk/constants"
import { plunkTrack } from "@/lib/plunk/client"
import type { ReportTier } from "@/lib/levelstack-plans"

export type ReportReadyNurtureParams = {
  email: string
  firstName: string
  reportId: string
  reportTier: ReportTier
  reportUrl?: string
  topCompetitor?: string
  topFinding?: string
}

/** Start Workflow A after report delivery (Email 1 stays on Resend). */
export async function trackReportReadyForNurture(
  params: ReportReadyNurtureParams,
): Promise<boolean> {
  const result = await plunkTrack({
    email: params.email,
    event: PLUNK_EVENTS.reportReady,
    subscribed: true,
    data: {
      firstName: params.firstName,
      reportUrl: params.reportUrl ?? "",
      reportId: params.reportId,
      reportTier: params.reportTier,
      topCompetitor: params.topCompetitor ?? "",
      topFinding: params.topFinding ?? "",
    },
  })
  return result.ok
}

export async function trackLevelstackPurchased(params: {
  email: string
  reportId?: string
  planId?: string
}): Promise<boolean> {
  const result = await plunkTrack({
    email: params.email,
    event: PLUNK_EVENTS.purchased,
    data: {
      reportId: params.reportId ?? "",
      planId: params.planId ?? "",
    },
  })
  return result.ok
}

export async function trackSapWaitlistJoined(params: {
  email: string
  firstName?: string
  reportId?: string
  sapCreditEligible: boolean
}): Promise<boolean> {
  const result = await plunkTrack({
    email: params.email,
    event: PLUNK_EVENTS.waitlistJoined,
    subscribed: true,
    data: {
      firstName: params.firstName ?? "",
      reportId: params.reportId ?? "",
      sapCreditEligible: params.sapCreditEligible,
    },
  })
  return result.ok
}
