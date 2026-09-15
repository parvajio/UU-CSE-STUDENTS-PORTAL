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
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {department.name}
        </h2>
        <Badge variant="secondary" className="text-xs">
          {clubList.length} club{clubList.length !== 1 ? "s" : ""}
        </Badge>
      </div>

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
