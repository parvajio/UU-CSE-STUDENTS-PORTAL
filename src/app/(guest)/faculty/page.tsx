import type { Metadata } from "next"
import { TriangleAlert } from "lucide-react"
import { FacultyDirectory } from "@/components/faculty/FacultyDirectory"
import { EmptyState } from "@/components/shared/EmptyState"
import { getFacultyList } from "@/lib/faculty"

export const metadata: Metadata = {
  title: "Faculty Directory",
  description:
    "Browse faculty members of the Department of Computer Science & Engineering — search by name, designation, email, or university.",
}

// Refresh the upstream faculty list at most once an hour.
// force-dynamic: the upstream fetch bypasses the Next data cache (its ~13MB
// payload exceeds the 2MB entry limit), so this route renders on demand and
// shares one hourly in-memory copy across all requests on this instance.
export const revalidate = 3600
export const dynamic = "force-dynamic"

export default async function FacultyPage() {
  const faculty = await getFacultyList()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Faculty Directory
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Faculty members of the Department of Computer Science &amp;
          Engineering. Search by name, designation, email, or university — tap
          an email to write to them, or copy any contact detail in one tap.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Source: Uttara University · Dept. of CSE ·{" "}
          {faculty.length > 0 ? `${faculty.length} members` : "live directory"}
        </p>
      </div>

      {faculty.length === 0 ? (
        <EmptyState
          title="Faculty directory is temporarily unavailable"
          description="We couldn't reach the university directory just now. Please try again in a little while."
          icon={<TriangleAlert className="size-10" strokeWidth={1.25} />}
        />
      ) : (
        <FacultyDirectory faculty={faculty} />
      )}
    </main>
  )
}
