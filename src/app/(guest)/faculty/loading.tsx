import { Skeleton } from "@/components/ui/skeleton"
import { FacultyDirectorySkeleton } from "@/components/faculty/FacultySkeleton"

export default function FacultyLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8" aria-hidden="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>

      <FacultyDirectorySkeleton count={6} />
    </main>
  )
}
