"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  slug: string
  description?: string | null
  clubs: Array<{
    id: string
    name: string
    description?: string | null
  }>
}

export function ManageClubsClient({ departments }: { departments: Department[] }) {
  const [activeTab, setActiveTab] = useState<"departments" | "clubs">("departments")
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "departments"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("departments")}
        >
          Departments
        </button>
        <button
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "clubs"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("clubs")}
        >
          Clubs
        </button>
      </div>

      {activeTab === "departments" && (
        <DepartmentManagement departments={departments} />
      )}
      {activeTab === "clubs" && (
        <ClubManagement departments={departments} />
      )}
    </div>
  )
}

function DepartmentManagement({ departments }: { departments: Department[] }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const formData = new FormData(e.currentTarget)
        const res = await fetch("/api/departments", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create department")
        setFeedback({ type: "success", text: "Department created!" })
        setName("")
        setSlug("")
        setDescription("")
        window.location.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Department</CardTitle>
          <CardDescription>Add a new academic department.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="d-name">Name</Label>
              <Input id="d-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-slug">Slug</Label>
              <Input id="d-slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-desc">Description</Label>
              <Textarea id="d-desc" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            {feedback && (
              <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-destructive")}>
                {feedback.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" /> : <Plus className="size-4 mr-2" />}
              Create Department
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Departments</CardTitle>
          <CardDescription>{departments.length} departments</CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No departments yet.</p>
          ) : (
            <div className="space-y-2">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground text-sm">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.clubs.length} clubs</p>
                  </div>
                  <Badge variant="secondary">{d.slug}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ClubManagement({ departments }: { departments: Department[] }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [description, setDescription] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const formData = new FormData(e.currentTarget)
        const res = await fetch("/api/clubs", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create club")
        setFeedback({ type: "success", text: "Club created!" })
        setName("")
        setDescription("")
        window.location.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Club</CardTitle>
          <CardDescription>Add a new club under a department.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-dept">Department</Label>
              <select id="c-dept" name="departmentId" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea id="c-desc" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            {feedback && (
              <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-destructive")}>
                {feedback.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" /> : <Plus className="size-4 mr-2" />}
              Create Club
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Clubs</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.flatMap((d) => d.clubs).length === 0 ? (
            <p className="text-muted-foreground text-sm">No clubs yet.</p>
          ) : (
            <div className="space-y-2">
              {departments.flatMap((d) => d.clubs.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                  </div>
                  <Badge variant="default">Approved</Badge>
                </div>
              )))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
