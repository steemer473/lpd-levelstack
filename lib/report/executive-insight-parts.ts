export type ExecutiveInsightPart =
  | { kind: "text"; text: string }
  /** Company-specific paragraph (e.g. search context with names/market). */
  | { kind: "highlight"; text: string }
  /** Diagnostic finding from public research — bold the core signal. */
  | {
      kind: "finding"
      prefix?: string
      text: string
      suffix?: string
    }
  /** Free-tier limitation or upgrade CTA. */
  | { kind: "muted"; text: string }

export type StructuredExecutiveInsights = {
  whatProspectsSee: ExecutiveInsightPart[]
  reputationGap: ExecutiveInsightPart[]
  revenueRisk: ExecutiveInsightPart[]
}

function flattenPart(part: ExecutiveInsightPart): string {
  switch (part.kind) {
    case "text":
    case "highlight":
    case "muted":
      return part.text
    case "finding": {
      const chunks = [part.prefix, part.text, part.suffix].filter(Boolean)
      return chunks.join(" ")
    }
  }
}

export function flattenExecutiveInsight(parts: ExecutiveInsightPart[]): string {
  return parts.map(flattenPart).filter(Boolean).join("\n\n")
}

export function flattenStructuredExecutiveInsights(
  insights: StructuredExecutiveInsights,
): {
  whatProspectsSee: string
  reputationGap: string
  revenueRisk: string
} {
  return {
    whatProspectsSee: flattenExecutiveInsight(insights.whatProspectsSee),
    reputationGap: flattenExecutiveInsight(insights.reputationGap),
    revenueRisk: flattenExecutiveInsight(insights.revenueRisk),
  }
}
