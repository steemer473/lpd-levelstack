import { PricingMatrixVariationA } from "@/components/marketing/pricing-matrix/pricing-matrix-variation-a"
import { PricingMatrixVariationB } from "@/components/marketing/pricing-matrix/pricing-matrix-variation-b"
import { PricingMatrixVariationC } from "@/components/marketing/pricing-matrix/pricing-matrix-variation-c"

const VARIATIONS = [
  {
    id: "a",
    label: "Variation A",
    summary: "Column emphasis — highlighted Most Popular plan column.",
    Component: PricingMatrixVariationA,
  },
  {
    id: "b",
    label: "Variation B",
    summary: "Grouped rows — features organized by report section.",
    Component: PricingMatrixVariationB,
  },
  {
    id: "c",
    label: "Variation C",
    summary: "Card grid — matrix restructured into plan cards.",
    Component: PricingMatrixVariationC,
  },
] as const

export default function PricingVariationsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="eyebrow mb-2">Pricing matrix</p>
          <h1 className="gradient-text text-3xl font-bold sm:text-4xl">
            Three pricing matrix variations
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Each variation reuses the shared LevelStack design tokens — brand
            gradient headings, primary CTAs, border and muted surfaces — while
            restructuring the layout.
          </p>
        </header>

        <div className="space-y-16">
          {VARIATIONS.map(({ id, label, summary, Component }) => (
            <div key={id}>
              <div className="mb-5 border-b border-border pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
              </div>
              <Component />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
