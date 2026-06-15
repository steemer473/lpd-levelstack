import { scoreAllSignals } from "@/lib/audit/score-all-signals"
import { assembleFreeReportFromResearch } from "@/lib/pipeline/assemble-free-report"
import { synthesizeFreeSearchFootprint } from "@/lib/pipeline/search-footprint-synthesis"
import { levelstackIntakeSchema } from "@/lib/intake/schema"
import {
  collectPaidEnrichment,
  runAuditOperations,
} from "@/lib/pipeline/collect-research"
import {
  FREE_TIER_OPERATION_IDS,
  FULL_TIER_OPERATION_IDS,
} from "@/lib/pipeline/constants"
import {
  auditProgressPercent,
  pipelineStepsForTier,
  sectionProgressFromOps,
} from "@/lib/pipeline/progress"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import {
  appendActionPlanSection,
  synthesizeReportSections,
} from "@/lib/pipeline/synthesis"
import { assembleReportJson } from "@/lib/pipeline/build-sections"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { sendReportReadyEmail } from "@/lib/email/report-delivery"
import { planIdToReportTier, type ReportTier } from "@/lib/levelstack-plans"
import { resolveReportPlanId } from "@/lib/pipeline/resolve-report-plan-id"
import { validateResearchQuality } from "@/lib/pipeline/research-quality"
import { sanitizeReportJson } from "@/lib/pipeline/sanitize-report-sections"
import { createAdminClient } from "@/lib/supabase/admin"

const STEP_DELAY_MS = 50

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type RunReportPipelineParams = {
  jobId: string
  reportId: string
  intakeId: string
}

export async function runReportPipeline({
  jobId,
  reportId,
  intakeId,
}: RunReportPipelineParams): Promise<void> {
  const admin = createAdminClient()
  if (!admin) {
    console.error("[pipeline] Admin client not configured")
    return
  }

  const { data: claimed } = await admin
    .from("levelstack_research_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      metadata: {
        current_step: "search_footprint",
        completed_steps: [],
        progress: 0,
        research_mode: "prd-v2",
      },
    })
    .eq("id", jobId)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle()

  if (!claimed) return

  const { data: intakeRow, error: intakeError } = await admin
    .from("levelstack_intakes")
    .select("form_data, user_id")
    .eq("id", intakeId)
    .maybeSingle()

  if (intakeError) {
    await failPipeline(
      admin,
      jobId,
      reportId,
      `Intake lookup failed (${intakeId}): ${intakeError.message}`,
    )
    return
  }

  if (!intakeRow) {
    await failPipeline(admin, jobId, reportId, `Intake not found (${intakeId})`)
    return
  }

  const parsed = levelstackIntakeSchema.safeParse(intakeRow.form_data)
  if (!parsed.success) {
    await failPipeline(admin, jobId, reportId, "Invalid intake form data")
    return
  }

  const { data: reportRow, error: reportError } = await admin
    .from("levelstack_reports")
    .select("plan_id, status, user_id")
    .eq("id", reportId)
    .maybeSingle()

  if (reportError) {
    await failPipeline(
      admin,
      jobId,
      reportId,
      `Report lookup failed (${reportId}): ${reportError.message}`,
    )
    return
  }

  if (!reportRow) {
    await failPipeline(admin, jobId, reportId, `Report not found (${reportId})`)
    return
  }

  if (reportRow.status === "ready") return

  const { data: jobRow } = await admin
    .from("levelstack_research_jobs")
    .select("metadata")
    .eq("id", jobId)
    .maybeSingle()

  const planId = await resolveReportPlanId({
    supabase: admin,
    userId: intakeRow.user_id,
    reportPlanId: reportRow.plan_id ?? null,
    jobMetadata: jobRow?.metadata as { plan_id?: string } | null,
    purchaseMotivation: parsed.data.purchaseMotivation,
  })

  if (planId !== reportRow.plan_id) {
    await admin.from("levelstack_reports").update({ plan_id: planId }).eq("id", reportId)
  }

  const reportTier: ReportTier = planIdToReportTier(planId)

  const operationIds =
    reportTier === "free_snapshot"
      ? [...FREE_TIER_OPERATION_IDS]
      : [...FULL_TIER_OPERATION_IDS]

  const uiSteps = pipelineStepsForTier(reportTier)
  const bundle = emptyResearchBundle()
  bundle.digitalPresence.website.url = parsed.data.websiteUrl
  bundle.revenueFunnel.website.url = parsed.data.websiteUrl

  await admin.from("levelstack_reports").update({ status: "generating" }).eq("id", reportId)

  try {
    for (const [i, op] of operationIds.entries()) {
      await runAuditOperations(parsed.data, bundle, [op])

      const completedOpCount = i + 1
      const { currentStep, completedSteps } = sectionProgressFromOps(
        completedOpCount,
        reportTier,
      )
      const progress = auditProgressPercent(completedOpCount, reportTier)

      await admin
        .from("levelstack_research_jobs")
        .update({
          metadata: {
            current_step: currentStep,
            completed_steps: completedSteps,
            progress,
            research_mode: "prd-v2",
            report_tier: reportTier,
          },
        })
        .eq("id", jobId)

      await sleep(STEP_DELAY_MS)
    }

    const lastSectionId = uiSteps[uiSteps.length - 1]?.id ?? null
    await admin
      .from("levelstack_research_jobs")
      .update({
        metadata: {
          current_step: lastSectionId,
          completed_steps: uiSteps.slice(0, -1).map((s) => s.id),
          progress: 90,
          research_mode: "prd-v2",
          report_tier: reportTier,
        },
      })
      .eq("id", jobId)

    if (reportTier !== "free_snapshot") {
      await collectPaidEnrichment(parsed.data, bundle)
    }

    const audit = scoreAllSignals(parsed.data, bundle, reportTier)

    let reportJson
    if (reportTier === "free_snapshot") {
      const { section: searchFootprint } = await synthesizeFreeSearchFootprint(
        parsed.data,
        bundle,
        audit,
      )
      reportJson = assembleFreeReportFromResearch(
        parsed.data,
        bundle,
        audit,
        planId,
        searchFootprint,
      )
    } else {
      const synthesis = await synthesizeReportSections(parsed.data, bundle)
      const fullSections = appendActionPlanSection(synthesis.sections)
      reportJson = assembleReportJson(parsed.data, fullSections, planId, {
        executiveSummary: {
          ...synthesis.executiveSummary,
          paragraphs: [
            `Overall presence score: ${audit.overallScore}/100 (${audit.letterGrade}).`,
            ...synthesis.executiveSummary.paragraphs,
          ],
        },
        actionPlan: synthesis.actionPlan,
      })
      reportJson.meta.overallScore = audit.overallScore
      reportJson.meta.letterGrade = audit.letterGrade
      reportJson.meta.reportTier = reportTier
      reportJson.signalRows = audit.signals.map((s) => ({
        label: s.label,
        value: s.status.toUpperCase(),
        percent: s.status === "pass" ? 100 : s.status === "warning" ? 50 : 0,
        tone:
          s.status === "pass"
            ? ("green" as const)
            : s.status === "warning"
              ? ("amber" as const)
              : ("red" as const),
      }))
    }

    const researchQuality = validateResearchQuality(bundle, reportTier)
    if (!researchQuality.ok) {
      console.error(researchQuality.logReason)
      await failPipeline(admin, jobId, reportId, researchQuality.userMessage)
      return
    }

    reportJson = sanitizeReportJson(reportJson)

    const validated = levelstackReportJsonSchema.safeParse(reportJson)
    if (!validated.success) {
      await failPipeline(admin, jobId, reportId, "Report JSON validation failed")
      return
    }

    const readyUpdate = {
      status: "ready" as const,
      report_json: validated.data,
      error_message: null,
      report_tier: reportTier,
    }

    const { error: readyError } = await admin
      .from("levelstack_reports")
      .update(readyUpdate)
      .eq("id", reportId)

    if (readyError?.message.includes("report_tier")) {
      await admin
        .from("levelstack_reports")
        .update({
          status: "ready",
          report_json: validated.data,
          error_message: null,
        })
        .eq("id", reportId)
    } else if (readyError) {
      await failPipeline(admin, jobId, reportId, readyError.message)
      return
    }

    await admin
      .from("levelstack_research_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        metadata: {
          current_step: null,
          completed_steps: uiSteps.map((s) => s.id),
          progress: 100,
          research_mode: "prd-v2",
          report_tier: reportTier,
          overall_score: audit.overallScore,
        },
      })
      .eq("id", jobId)

    const { data: userRow } = await admin.auth.admin.getUserById(intakeRow.user_id)
    const email = userRow?.user?.email
    if (email) {
      const { recordPdfDeliveryPath } = await import("@/lib/pdf/record-pdf-path")
      await recordPdfDeliveryPath(reportId, admin).catch(() => undefined)

      await sendReportReadyEmail({
        to: email,
        businessName: parsed.data.primaryBusinessName,
        reportId,
        reportTier,
        topFinding:
          audit.signals.find((s) => s.status === "fail")?.finding ??
          audit.signals.find((s) => s.status === "warning")?.finding,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed"
    await failPipeline(admin, jobId, reportId, message)
  }
}

async function failPipeline(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  jobId: string,
  reportId: string,
  message: string,
) {
  await admin
    .from("levelstack_research_jobs")
    .update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)

  await admin
    .from("levelstack_reports")
    .update({ status: "failed", error_message: message })
    .eq("id", reportId)
}
