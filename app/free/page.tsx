import { BarChart3, CheckCircle2, Shield } from "lucide-react"

import { FreeSnapshotForm } from "@/components/free/free-snapshot-form"
import { ProductShell } from "@/components/layout/product-shell"
import { ReportFaqSection } from "@/components/report/report-faq-section"
import { FormPanel } from "@/components/ui/form-panel"

export default function FreeSnapshotPage() {
  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "What prospects see before they call you.",
        headingHighlight: "before they call you",
        description:
          "Tell us your business. We research how you show up online and email you when your Visibility Snapshot is ready.",
        badges: [
          { icon: CheckCircle2, label: "Free snapshot" },
          { icon: BarChart3, label: "Live research" },
          { icon: Shield, label: "No credit card" },
        ],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-center mb-1">Let&apos;s pull your snapshot</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          We&apos;ll take you straight to your live progress screen. Your report-ready
          email includes a link that works for 30 days — use sign-in if you need a
          fresh link after that.
        </p>
        <FreeSnapshotForm />
      </FormPanel>
      <div className="mx-auto mt-6 max-w-2xl">
        <ReportFaqSection />
      </div>
    </ProductShell>
  )
}
