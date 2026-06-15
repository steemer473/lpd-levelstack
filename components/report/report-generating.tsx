"use client"

import {
  BarChart3,
  CheckCircle2,
  Globe,
  Loader2,
  Megaphone,
  Search,
  Shield,
  Target,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ReportTier } from "@/lib/levelstack-plans"
import { PIPELINE_STEPS } from "@/lib/pipeline/constants"
import { pipelineStepsForTier } from "@/lib/pipeline/progress"

const stepIcons = [Search, Shield, Globe, Megaphone, BarChart3, Target] as const
const TOTAL_SECTIONS = PIPELINE_STEPS.length

type ReportGeneratingProps = {
  reportId: string
  businessLabel: string
}

type StatusResponse = {
  success: boolean
  reportStatus: string
  reportTier?: ReportTier
  completedSteps?: string[]
  currentStep?: string | null
  progress?: number
  error?: string | null
}

export function ReportGenerating({ reportId, businessLabel }: ReportGeneratingProps) {
  const router = useRouter()
  const [reportTier, setReportTier] = useState<ReportTier>("full_report")
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showSlowNotice, setShowSlowNotice] = useState(false)

  const displaySteps = useMemo(
    () => pipelineStepsForTier(reportTier),
    [reportTier],
  )

  const progressHeadline = useMemo(() => {
    if (currentStep) {
      const stepIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep)
      const resolvedIndex = stepIndex >= 0 ? stepIndex : 0
      const step = PIPELINE_STEPS[resolvedIndex]!
      const stepNumber = resolvedIndex + 1
      return `Checking your ${step.label.toLowerCase()}… ${stepNumber} of ${TOTAL_SECTIONS}`
    }
    return "Checking your search footprint…"
  }, [currentStep])

  useEffect(() => {
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      setElapsedTime(elapsed)
      if (elapsed > 120 && !isComplete) {
        setShowSlowNotice(true)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [isComplete])

  useEffect(() => {
    async function startPipeline() {
      try {
        const statusRes = await fetch(`/api/reports/${reportId}/status`)
        if (statusRes.ok) {
          const status = (await statusRes.json()) as StatusResponse & {
            jobStatus?: string | null
          }
          if (
            status.jobStatus === "running" ||
            status.reportStatus === "generating" ||
            status.reportStatus === "ready"
          ) {
            return
          }
        }

        await fetch(`/api/reports/${reportId}/run`, { method: "POST" })
      } catch {
        /* poll will surface errors */
      }
    }

    void startPipeline()
  }, [reportId])

  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}/status`)
        if (!res.ok || !mounted) return
        const data = (await res.json()) as StatusResponse
        if (!data.success) return

        if (data.reportTier) {
          setReportTier(data.reportTier)
        }
        if (data.completedSteps) {
          setCompletedSteps(data.completedSteps)
        }
        if (data.currentStep !== undefined) {
          setCurrentStep(data.currentStep)
        }

        if (data.reportStatus === "failed") {
          setFailed(data.error ?? "Report generation failed.")
          return
        }

        if (data.reportStatus === "ready") {
          setIsComplete(true)
          const steps = pipelineStepsForTier(data.reportTier ?? reportTier)
          setCompletedSteps(steps.map((s) => s.id))
          setTimeout(() => {
            if (mounted) router.refresh()
          }, 1500)
        }
      } catch {
        /* ignore transient network errors */
      }
    }

    poll()
    intervalId = setInterval(poll, 2500)

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [reportId, reportTier, router])

  if (failed) {
    return (
      <div className="text-center space-y-4">
        <p className="text-destructive text-sm">{failed}</p>
        <Button variant="brand" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="text-center py-6 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <p className="text-lg font-semibold">Your LevelStack report is ready</p>
        <p className="text-muted-foreground text-sm">
          Loading full report for {businessLabel}…
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange mx-auto" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-center mb-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-orange" />
      </div>
      <p className="text-center text-lg font-semibold mb-6">{progressHeadline}</p>
      <div>
        <div className="space-y-3">
          {displaySteps.map((step, index) => {
            const Icon = stepIcons[index] ?? Search
            const done = completedSteps.includes(step.id)
            const active = !done && step.id === currentStep

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                  active
                    ? "border-brand-orange/40 bg-brand-orange/5 shadow-sm"
                    : done
                      ? "border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/30"
                      : "border-muted bg-muted/30 opacity-70"
                }`}
              >
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : active ? (
                    <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium text-sm ${
                        active ? "text-brand-orange" : done ? "text-green-800" : ""
                      }`}
                    >
                      {step.label}
                    </span>
                    {active && (
                      <span className="text-xs text-brand-orange animate-pulse shrink-0">
                        In progress
                      </span>
                    )}
                    {done && (
                      <span className="text-xs text-green-700 dark:text-green-400 shrink-0">
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground space-y-1">
          <p>This page updates automatically when your report is ready.</p>
          {elapsedTime > 0 && (
            <p className="text-xs">
              Elapsed: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
            </p>
          )}
          {showSlowNotice && (
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
              Research is still running. You can leave this tab open — we&apos;ll show
              your report here when generation finishes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
