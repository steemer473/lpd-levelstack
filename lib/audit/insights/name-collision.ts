import type { AuditInsight } from "@/lib/audit/types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

export function detectNameCollisions(bundle: ResearchBundle): AuditInsight[] {
  const { collisions, severity } = bundle.nameCollisions

  if (collisions.length === 0) return []

  return [
    {
      id: "name_collision",
      label: "Name Collision Scoring",
      severity,
      summary: `${collisions.length} other entit${collisions.length === 1 ? "y competes" : "ies compete"} for your brand name in search (${severity} severity).`,
      details: collisions.map((c) => `${c.type}: ${c.title} — ${c.link}`),
      remediation:
        severity === "high"
          ? [
              "Differentiate brand name in marketing copy",
              "Consider trademark review",
              "Build branded search assets (GBP, social, PR)",
            ]
          : ["Monitor search results monthly", "Strengthen branded content on owned properties"],
    },
  ]
}
