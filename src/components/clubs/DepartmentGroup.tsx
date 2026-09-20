import { type departments } from "@/lib/db/schema"
import { ClubCard } from "./ClubCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function DepartmentGroup({
  department,
  clubList,
}: {
  department: typeof departments.$inferSelect
  clubList: typeof import("@/lib/db/schema").clubs.$inferSelect[]
}) {
  return (
    <section aria-label={department.name}>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span aria-hidden className="h-7 w-1 rounded-full bg-[linear-gradient(180deg,#5B5FEF,#8B5CF6)]" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {department.name}
        </h2>
        <Badge variant="secondary" className="rounded-full text-xs">
          {clubList.length} club{clubList.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      {department.description && (
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{department.description}</p>
      )}

      {clubList.length === 0 ? (
        <EmptyState
          title="No clubs yet"
          description={`${department.name} department doesn't have any clubs registered yet.`}
          icon={<FolderOpen className="size-8" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubList.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </section>
  )
}
