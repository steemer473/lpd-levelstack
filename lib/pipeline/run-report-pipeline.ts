import { levelstackIntakeSchema } from "@/lib/intake/schema"
import { assembleReportJson } from "@/lib/pipeline/build-sections"
import { RESEARCH_COLLECTORS } from "@/lib/pipeline/collect-research"
import { PIPELINE_STEPS } from "@/lib/pipeline/constants"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import {
  appendActionPlanSection,
  synthesizeReportSections,
} from "@/lib/pipeline/synthesis"
import { createAdminClient } from "@/lib/supabase/admin"

const STEP_DELAY_MS = 100

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
        current_step: PIPELINE_STEPS[0].id,
        completed_steps: [],
        progress: 0,
        research_mode: "2.3",
      },
    })
    .eq("id", jobId)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle()

  if (!claimed) {
    return
  }

  const { data: intakeRow, error: intakeError } = await admin
    .from("levelstack_intakes")
    .select("form_data, user_id")
    .eq("id", intakeId)
    .single()

  if (intakeError || !intakeRow) {
    await failPipeline(admin, jobId, reportId, intakeError?.message ?? "Intake not found")
    return
  }

  const parsed = levelstackIntakeSchema.safeParse(intakeRow.form_data)
  if (!parsed.success) {
    await failPipeline(admin, jobId, reportId, "Invalid intake form data")
    return
  }

  const { data: reportRow } = await admin
    .from("levelstack_reports")
    .select("plan_id, status")
    .eq("id", reportId)
    .single()

  if (!reportRow) {
    await failPipeline(admin, jobId, reportId, "Report not found")
    return
  }

  if (reportRow.status === "ready") {
    return
  }

  const planId = reportRow.plan_id ?? null
  const completedSteps: string[] = []
  const bundle = emptyResearchBundle()
  bundle.digitalPresence.website.url = parsed.data.websiteUrl
  bundle.revenueFunnel.website.url = parsed.data.websiteUrl

  await admin
    .from("levelstack_reports")
    .update({ status: "generating" })
    .eq("id", reportId)

  try {
    for (const [i, step] of PIPELINE_STEPS.entries()) {
      const progress = Math.round(((i + 1) / PIPELINE_STEPS.length) * 100)
      const nextStep = PIPELINE_STEPS[i + 1]
      const collector = RESEARCH_COLLECTORS[step.id]

      if (collector) {
        await collector(parsed.data, bundle)
      }

      completedSteps.push(step.id)

      await admin
        .from("levelstack_research_jobs")
        .update({
          metadata: {
            current_step: nextStep?.id ?? null,
            completed_steps: [...completedSteps],
            progress,
            research_mode: "2.3",
          },
        })
        .eq("id", jobId)

      if (step.id !== "action_plan") {
        await sleep(STEP_DELAY_MS)
      }
    }

    const synthesis = await synthesizeReportSections(parsed.data, bundle)

    const fullSections = appendActionPlanSection(synthesis.sections)
    const reportJson = assembleReportJson(parsed.data, fullSections, planId, {
      executiveSummary: synthesis.executiveSummary,
      actionPlan: synthesis.actionPlan,
    })

    const validated = levelstackReportJsonSchema.safeParse(reportJson)
    if (!validated.success) {
      await failPipeline(admin, jobId, reportId, "Report JSON validation failed")
      return
    }

    await admin
      .from("levelstack_reports")
      .update({
        status: "ready",
        report_json: validated.data,
        error_message: null,
      })
      .eq("id", reportId)

    await admin
      .from("levelstack_research_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        metadata: {
          current_step: null,
          completed_steps: PIPELINE_STEPS.map((s) => s.id),
          progress: 100,
          research_mode: "2.3",
          synthesis_llm: synthesis.usedLlm,
          quality_warnings: synthesis.qualityWarnings,
          quality_passed: synthesis.qualityWarnings.length === 0,
        },
      })
      .eq("id", jobId)
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
    .update({
      status: "failed",
      error_message: message,
    })
    .eq("id", reportId)
}
