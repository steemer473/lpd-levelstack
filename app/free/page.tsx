import { BarChart3, CheckCircle2, Shield } from "lucide-react"

import { FreeSnapshotForm } from "@/components/free/free-snapshot-form"
import { ProductShell } from "@/components/layout/product-shell"
import { FormPanel } from "@/components/ui/form-panel"

export default function FreeSnapshotPage() {
  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Free digital presence snapshot",
        headingHighlight: "presence snapshot",
        description:
          "See what prospects find when they search your business — search footprint, reputation signals, and presence gaps. Email required.",
        badges: [
          { icon: CheckCircle2, label: "Free" },
          { icon: BarChart3, label: "Automated" },
          { icon: Shield, label: "No credit card" },
        ],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-center mb-1">Start your snapshot</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          We&apos;ll take you straight to your live progress screen. A backup
          sign-in link is emailed too.
        </p>
        <FreeSnapshotForm />
      </FormPanel>
    </ProductShell>
  )
}
