"use client"

import { useState, useTransition, type FormEvent } from "react"
import { Loader2, Plus, Pencil, Check, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCourse, updateCourse } from "@/app/(admin)/manage/courses/actions"
import type { CourseOption } from "@/types/question-bank"

type Feedback =
  | { type: "success"; text: string }
  | { type: "error"; text: string }

export function CoursesManagement({ initialCourses }: { initialCourses: CourseOption[] }) {
  const [courses] = useState<CourseOption[]>(initialCourses)
  const [addCode, setAddCode] = useState("")
  const [addTitle, setAddTitle] = useState("")
  const [addCreditHours, setAddCreditHours] = useState("3.0")
  const [addFeedback, setAddFeedback] = useState<Feedback | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCreditHours, setEditCreditHours] = useState("")
  const [editFeedback, setEditFeedback] = useState<Feedback | null>(null)

  const [isPending, startTransition] = useTransition()

  function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddFeedback(null)

    startTransition(async () => {
      const res = await createCourse({
        code: addCode,
        title: addTitle,
        creditHours: addCreditHours,
      })

      if (res.success) {
        setAddCode("")
        setAddTitle("")
        setAddCreditHours("3.0")
        setAddFeedback({ type: "success", text: "Course added successfully." })
        window.location.reload()
      } else {
        setAddFeedback({ type: "error", text: res.error })
      }
    })
  }

  function startEdit(course: CourseOption) {
    setEditingId(course.id)
    setEditTitle(course.title)
    setEditCreditHours(String(course.creditHours))
    setEditFeedback(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditFeedback(null)
  }

  function handleUpdate(id: string) {
    setEditFeedback(null)

    startTransition(async () => {
      const res = await updateCourse({
        id,
        title: editTitle,
        creditHours: editCreditHours,
      })

      if (res.success) {
        setEditingId(null)
        window.location.reload()
      } else {
        setEditFeedback({ type: "error", text: res.error })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Add Course Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Plus className="size-5" strokeWidth={1.5} />
            Add New Course
          </CardTitle>
          <CardDescription>
            Create a course code (e.g. CSE-311), title, and credit hours.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAdd}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. CSE-311"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Database Systems"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditHours">Credit Hours</Label>
                <Input
                  id="creditHours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={addCreditHours}
                  onChange={(e) => setAddCreditHours(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            {addFeedback && (
              <p
                role={addFeedback.type === "error" ? "alert" : "status"}
                className={
                  addFeedback.type === "error"
                    ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                }
              >
                {addFeedback.text}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Plus className="size-4" strokeWidth={1.5} />
                )}
                Add Course
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Courses List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <BookOpen className="size-5" strokeWidth={1.5} />
            Course Catalog ({courses.length})
          </CardTitle>
          <CardDescription>
            Existing courses used across question uploads and filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editFeedback && (
            <div className="mb-4">
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {editFeedback.text}
              </p>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="p-3 font-medium w-[145px]">Code</th>
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium w-[120px]">Credit Hours</th>
                  <th className="p-3 font-medium w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground">
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => {
                    const isEditing = editingId === course.id
                    return (
                      <tr key={course.id} className="hover:bg-muted/20">
                        <td className="p-3 font-medium font-mono text-xs">
                          {course.code}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              disabled={isPending}
                              className="h-8 text-sm"
                            />
                          ) : (
                            course.title
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.5"
                              value={editCreditHours}
                              onChange={(e) => setEditCreditHours(e.target.value)}
                              disabled={isPending}
                              className="h-8 text-sm w-20"
                            />
                          ) : (
                            course.creditHours
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                onClick={() => handleUpdate(course.id)}
                                disabled={isPending}
                                title="Save"
                              >
                                <Check className="size-4" strokeWidth={1.5} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={cancelEdit}
                                disabled={isPending}
                                title="Cancel"
                              >
                                <X className="size-4" strokeWidth={1.5} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(course)}
                              disabled={isPending}
                              title="Edit course"
                            >
                              <Pencil className="size-4" strokeWidth={1.5} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
