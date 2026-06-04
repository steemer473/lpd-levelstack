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
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PIPELINE_STEPS } from "@/lib/pipeline/constants"

const stepIcons = [Search, Shield, Globe, Megaphone, BarChart3, Target] as const

type ReportGeneratingProps = {
  reportId: string
  businessLabel: string
}

type StatusResponse = {
  success: boolean
  reportStatus: string
  completedSteps?: string[]
  currentStep?: string | null
  progress?: number
  error?: string | null
}

export function ReportGenerating({ reportId, businessLabel }: ReportGeneratingProps) {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(PIPELINE_STEPS[0].id)
  const [isComplete, setIsComplete] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showSlowNotice, setShowSlowNotice] = useState(false)

  const stepIndexFromApi = useCallback(() => {
    if (!currentStep) return PIPELINE_STEPS.length - 1
    const idx = PIPELINE_STEPS.findIndex((s) => s.id === currentStep)
    return idx >= 0 ? idx : 0
  }, [currentStep])

  const displayActiveIndex = Math.min(
    stepIndexFromApi(),
    PIPELINE_STEPS.length - 1,
  )

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
          setCompletedSteps(PIPELINE_STEPS.map((s) => s.id))
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
  }, [reportId, router])

  if (failed) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Report generation failed</CardTitle>
          <CardDescription>{failed}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Your LevelStack report is ready</CardTitle>
          <CardDescription>Loading full report for {businessLabel}…</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <CardTitle className="text-2xl">Building your LevelStack report</CardTitle>
        <CardDescription className="text-base mt-2">
          Researching digital presence for{" "}
          <span className="font-medium text-foreground">{businessLabel}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, index) => {
            const Icon = stepIcons[index] ?? Search
            const done =
              completedSteps.includes(step.id) ||
              index < displayActiveIndex
            const active =
              !done &&
              (step.id === currentStep || index === displayActiveIndex)

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : done
                      ? "border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/30"
                      : "border-muted bg-muted/30 opacity-70"
                }`}
              >
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : active ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium text-sm ${
                        active ? "text-primary" : done ? "text-green-800 dark:text-green-300" : ""
                      }`}
                    >
                      {step.label}
                    </span>
                    {active && (
                      <span className="text-xs text-primary animate-pulse shrink-0">
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
      </CardContent>
    </Card>
  )
}
