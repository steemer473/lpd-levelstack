import type { AuditInsight } from "@/lib/audit/types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

export function detectInfrastructureLeakage(
  bundle: ResearchBundle,
): AuditInsight[] {
  const instances = bundle.infrastructureLeakage.instances

  if (instances.length === 0) return []

  const maxSeverity = instances.some((i) => i.severity === "high")
    ? "high"
    : instances.some((i) => i.severity === "medium")
      ? "medium"
      : "low"

  return [
    {
      id: "infrastructure_leakage",
      label: "Infrastructure Leakage Detection",
      severity: maxSeverity,
      summary: `${instances.length} publicly indexed page(s) may expose internal tooling or unfinished infrastructure.`,
      details: instances.map((i) => `${i.finding} — ${i.url}`),
      remediation: instances.map((i) => i.remediation),
    },
  ]
}
