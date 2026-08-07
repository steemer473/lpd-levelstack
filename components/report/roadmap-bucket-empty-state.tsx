import { ROADMAP_BUCKET_EMPTY_COPY } from "@/lib/report/outcome-copy"
import type { RoadmapBucketKey } from "@/lib/report/roadmap-from-recommendations"
import { cn } from "@/lib/utils"

type RoadmapBucketEmptyStateProps = {
  bucket: RoadmapBucketKey
  variant?: "list" | "kanban"
}

export function RoadmapBucketEmptyState({
  bucket,
  variant = "list",
}: RoadmapBucketEmptyStateProps) {
  return (
    <div
      data-testid={`roadmap-empty-${bucket}`}
      className={cn(
        "rounded-md border border-dashed border-border/80 bg-muted/20 text-sm text-muted-foreground",
        variant === "kanban" ? "px-3 py-4 text-center" : "px-4 py-5",
      )}
    >
      {ROADMAP_BUCKET_EMPTY_COPY[bucket]}
    </div>
  )
}
