import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { getCourses } from "@/lib/db/queries/catalog"
import { CoursesManagement } from "@/components/admin/CoursesManagement"

export const metadata: Metadata = {
  title: "Manage Courses",
}

export default async function ManageCoursesPage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const courses = await getCourses()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpen className="size-6" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Manage Courses
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add or update courses in the department catalog.
          </p>
        </div>
      </div>

      <CoursesManagement initialCourses={courses} />
    </main>
  )
}
