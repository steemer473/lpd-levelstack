import { z } from "zod"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { completeOpenAiJson, isOpenAiConfigured } from "@/lib/llm/openai-json"
import {
  buildActionPlanFromSections,
  normalizeLlmActionPlan,
} from "@/lib/pipeline/action-plan"
import { buildReportSections } from "@/lib/pipeline/build-sections"
import { runQualityGate } from "@/lib/pipeline/quality-gate"
import {
  actionPlanSchema,
  executiveSummarySchema,
  reportSectionSchema,
  type LevelstackReportJson,
  type ReportSection,
} from "@/lib/pipeline/report-types"
import { normalizeSynthesisPayload } from "@/lib/pipeline/normalize-llm-synthesis"
import {
  buildExecutiveSummaryFromResearch,
  buildSectionsFromResearch,
  researchBundleHasSerpData,
} from "@/lib/pipeline/serp-backed-sections"
import { SYNTHESIS_SYSTEM_PROMPT } from "@/lib/pipeline/synthesis-prompts"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

const synthesisExecutiveSchema = executiveSummarySchema.extend({
  paragraphs: z.array(z.string()).min(2).max(5),
  criticalIssue: z.string().min(1),
  firstSteps: z.array(z.string()).min(1).max(4),
})

const synthesisCoreSchema = z.object({
  sections: z.array(reportSectionSchema),
  executiveSummary: synthesisExecutiveSchema,
})

const synthesisFullSchema = synthesisCoreSchema.extend({
  actionPlan: actionPlanSchema,
})

export type SynthesisResult = {
  sections: ReportSection[]
  executiveSummary: LevelstackReportJson["executiveSummary"]
  actionPlan: LevelstackReportJson["actionPlan"]
  usedLlm: boolean
  qualityWarnings: string[]
}

function compactBundleForPrompt(bundle: ResearchBundle): string {
  const slim = {
    searchFootprint: bundle.searchFootprint.searches.map((s) => ({
      query: s.query,
      limitation: s.limitation,
      aiOverview: s.aiOverview,
      topResults: s.results.slice(0, 5).map((r) => ({
        position: r.position,
        title: r.title,
        link: r.link,
        snippet: r.snippet.slice(0, 200),
      })),
    })),
    reputation: bundle.reputation.searches.map((s) => ({
      query: s.query,
      limitation: s.limitation,
      topResults: s.results.slice(0, 5).map((r) => ({
        position: r.position,
        title: r.title,
        link: r.link,
        snippet: r.snippet.slice(0, 200),
      })),
    })),
    digitalPresence: {
      website: bundle.digitalPresence.website,
      pageSpeed: bundle.digitalPresence.pageSpeed,
      gbp: bundle.digitalPresence.gbp,
      social: bundle.digitalPresence.social,
    },
    revenueFunnel: {
      intakeNotes: bundle.revenueFunnel.intakeNotes,
      pageSpeed: bundle.revenueFunnel.pageSpeed,
    },
    competitiveContext: {
      serviceSearch: bundle.competitiveContext.serviceSearch
        ? {
            query: bundle.competitiveContext.serviceSearch.query,
            topResults: bundle.competitiveContext.serviceSearch.results
              .slice(0, 5)
              .map((r) => ({
                position: r.position,
                title: r.title,
                link: r.link,
              })),
          }
        : null,
      competitorDomains: bundle.competitiveContext.competitorDomains,
      competitorSnapshots: bundle.competitiveContext.competitorSnapshots,
    },
  }

  const raw = JSON.stringify(slim)
  return raw.length > 14_000 ? `${raw.slice(0, 14_000)}…[truncated]` : raw
}

function finalizeSynthesis(
  intake: LevelstackIntakeFormValues,
  sections: ReportSection[],
  executiveSummary: LevelstackReportJson["executiveSummary"],
  actionPlan: LevelstackReportJson["actionPlan"],
  usedLlm: boolean,
): SynthesisResult {
  const draft: LevelstackReportJson = {
    meta: {
      businessName: intake.primaryBusinessName,
      ownerName: intake.ownerName,
      marketLabel: "",
      reportDate: "",
      planId: null,
      overallScore: 0,
      letterGrade: "F",
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
    executiveSummary,
    sections,
    actionPlan,
  }
  const gate = runQualityGate(draft, intake)
  return {
    sections,
    executiveSummary,
    actionPlan,
    usedLlm,
    qualityWarnings: gate.warnings,
  }
}

function serpFallbackResult(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  extraParagraph?: string,
): SynthesisResult {
  const sections = buildSectionsFromResearch(intake, bundle)
  const executiveSummary = buildExecutiveSummaryFromResearch(intake, bundle, sections)
  if (extraParagraph) {
    executiveSummary.paragraphs.push(extraParagraph)
  }
  const actionPlan = buildActionPlanFromSections(sections, intake)
  executiveSummary.firstSteps = actionPlan.thisWeek
    .slice(0, 4)
    .map((a) => a.task)
  return finalizeSynthesis(intake, sections, executiveSummary, actionPlan, false)
}

export async function synthesizeReportSections(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): Promise<SynthesisResult> {
  const fallbackSections = await buildReportSections(intake)
  const planSource = fallbackSections.filter((s) => s.id !== "action_plan")

  if (!isOpenAiConfigured()) {
    if (researchBundleHasSerpData(bundle)) {
      return serpFallbackResult(intake, bundle)
    }
    const actionPlan = buildActionPlanFromSections(planSource, intake)
    return finalizeSynthesis(
      intake,
      planSource,
      {
        paragraphs: [
          `When prospects search for ${intake.ownerName} or ${intake.primaryBusinessName}, results depend on live Google data. Add OPENAI_API_KEY and at least one SERP provider to .env.local, restart the dev server, then regenerate this report.`,
          `You rated reputation ${intake.reputationScale}/10. Intake note: ${intake.complaintsAwareness.slice(0, 180)}`,
          "This report is diagnostic only — you execute the fixes listed in the action plan.",
        ],
        criticalIssue:
          fallbackSections
            .flatMap((s) => s.findings)
            .find((f) => f.severity === "critical" || f.severity === "high")?.value ??
          "Configure SERP provider(s) + OpenAI for research-backed findings.",
        firstSteps: actionPlan.thisWeek.map((a) => a.task),
      },
      actionPlan,
      false,
    )
  }

  const userPrompt = `Report date: ${bundle.searchFootprint.reportDate}

INTAKE:
${JSON.stringify(intake, null, 2)}

RESEARCH:
${compactBundleForPrompt(bundle)}

Produce sections, executiveSummary, and actionPlan per schema.`

  const result = await completeOpenAiJson<unknown>({
    system: SYNTHESIS_SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 8000,
  })

  if (!result.ok) {
    console.warn("[synthesis]", result.error)
    if (researchBundleHasSerpData(bundle)) {
      return serpFallbackResult(
        intake,
        bundle,
        `Note: AI narrative synthesis was skipped (${result.error}).`,
      )
    }
    const actionPlan = buildActionPlanFromSections(planSource, intake)
    return finalizeSynthesis(
      intake,
      planSource,
      {
        paragraphs: [
          `Research APIs were unavailable or synthesis failed. This report uses intake and limited public signals for ${intake.primaryBusinessName}.`,
          "Diagnostic only — you execute fixes; LevelStack does not implement them for you.",
        ],
        criticalIssue:
          "Re-run generation with a configured SERP provider and OPENAI_API_KEY for live search-based findings.",
        firstSteps: actionPlan.thisWeek.map((a) => a.task),
      },
      actionPlan,
      false,
    )
  }

  const baselineSections = researchBundleHasSerpData(bundle)
    ? buildSectionsFromResearch(intake, bundle)
    : planSource

  const normalized = normalizeSynthesisPayload(
    result.json,
    baselineSections,
    intake,
    researchBundleHasSerpData(bundle) ? bundle : null,
  )

  const fullParsed = synthesisFullSchema.safeParse({
    sections: normalized.sections,
    executiveSummary: normalized.executiveSummary,
    actionPlan: normalized.actionPlan,
  })
  if (fullParsed.success) {
    const actionPlan = normalizeLlmActionPlan(fullParsed.data.actionPlan)
    const firstSteps =
      fullParsed.data.executiveSummary.firstSteps.length > 0
        ? fullParsed.data.executiveSummary.firstSteps
        : actionPlan.thisWeek.map((a) => a.task)
    return finalizeSynthesis(
      intake,
      fullParsed.data.sections,
      { ...fullParsed.data.executiveSummary, firstSteps },
      actionPlan,
      true,
    )
  }

  const coreParsed = synthesisCoreSchema.safeParse({
    sections: normalized.sections,
    executiveSummary: normalized.executiveSummary,
  })
  if (coreParsed.success) {
    console.warn("[synthesis] actionPlan missing or invalid; using finding-linked fallback")
    const actionPlan = buildActionPlanFromSections(coreParsed.data.sections, intake)
    return finalizeSynthesis(
      intake,
      coreParsed.data.sections,
      {
        ...coreParsed.data.executiveSummary,
        firstSteps: actionPlan.thisWeek.map((a) => a.task),
      },
      actionPlan,
      true,
    )
  }

  console.warn("[synthesis] validation", fullParsed.error.flatten())
  if (researchBundleHasSerpData(bundle)) {
    return serpFallbackResult(intake, bundle)
  }
  const actionPlan = buildActionPlanFromSections(planSource, intake)
  return finalizeSynthesis(
    intake,
    planSource,
    {
      paragraphs: [
        `Synthesis validation failed for ${intake.primaryBusinessName}. Regenerate after checking API keys.`,
      ],
      criticalIssue: "Regenerate the report to refresh findings.",
      firstSteps: actionPlan.thisWeek.map((a) => a.task),
    },
    actionPlan,
    false,
  )
}

export function appendActionPlanSection(
  contentSections: ReportSection[],
): ReportSection[] {
  const actionPlan = contentSections.find((s) => s.id === "action_plan")
  if (actionPlan) return contentSections

  return [
    ...contentSections,
    {
      id: "action_plan",
      label: "Prioritized action plan",
      status: "attention",
      score: 55,
      findings: [
        {
          label: "Plan compiled",
          value: "Prioritized tasks are listed in the Action plan tab.",
          detail:
            "Each task links to findings above and is ordered by trust and revenue impact.",
          severity: "good",
        },
      ],
    },
  ]
}
