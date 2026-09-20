"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Settings2,
  Building2,
  Users,
  Search,
  X,
  FolderOpen,
  CalendarDays,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ClubManagementForm, type ClubFormData } from "@/components/clubs/ClubManagementForm"

interface Department {
  id: string
  name: string
  slug: string
  description?: string | null
  clubs: Array<{
    id: string
    name: string
    description?: string | null
    logoUrl?: string | null
  }>
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string }

function FeedbackBanner({ feedback, onDismiss }: { feedback: Feedback | null; onDismiss: () => void }) {
  if (!feedback) return null
  return (
    <div
      role={feedback.type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
        feedback.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      <p>{feedback.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ElementType
  title: string
  hint: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" strokeWidth={1.5} />
      </span>
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ManageClubsClient({
  departments,
  initialTab = "departments",
}: {
  departments: Department[]
  initialTab?: "departments" | "clubs"
}) {
  const [activeTab, setActiveTab] = useState<"departments" | "clubs">(initialTab)
  const totalClubs = useMemo(() => departments.reduce((n, d) => n + d.clubs.length, 0), [departments])
  const [clubDeptFilter, setClubDeptFilter] = useState<string>("all")

  function viewClubsOf(departmentId: string) {
    setClubDeptFilter(departmentId)
    setActiveTab("clubs")
  }

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--card-shadow)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-5 text-primary" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold leading-none text-foreground">{departments.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Departments</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--card-shadow)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
            <Users className="size-5 text-secondary" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold leading-none text-foreground">{totalClubs}</p>
            <p className="mt-1 text-xs text-muted-foreground">Clubs</p>
          </div>
        </div>
        <Link
          href="/manage/clubs/events"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-foreground">All events</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Browse every club event</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Manage departments or clubs">
        {(
          [
            { key: "departments", label: "Departments", count: departments.length },
            { key: "clubs", label: "Clubs", count: totalClubs },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] leading-4">
              {t.count}
            </Badge>
          </button>
        ))}
      </div>

      {activeTab === "departments" ? (
        <DepartmentManagement departments={departments} onViewClubs={viewClubsOf} />
      ) : (
        <ClubManagement
          departments={departments}
          deptFilter={clubDeptFilter}
          onDeptFilterChange={setClubDeptFilter}
        />
      )}
    </div>
  )
}

/* ---------------- Departments ---------------- */

function DepartmentManagement({
  departments,
  onViewClubs,
}: {
  departments: Department[]
  onViewClubs: (departmentId: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  // Edit form state
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const isEditing = editing !== null
  const formVisible = formOpen || isEditing

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return departments
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
    )
  }, [departments, search])

  function openCreate() {
    setEditing(null)
    setName("")
    setSlug("")
    setDescription("")
    setFeedback(null)
    setFormOpen(true)
  }

  function openEdit(d: Department) {
    setFormOpen(false)
    setEditing(d)
    setEditName(d.name)
    setEditSlug(d.slug)
    setEditDescription(d.description ?? "")
    setFeedback(null)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!formVisible) return
    // Auto-suggest slug only while creating and slug untouched
    if (!isEditing && !slug) setSlug(v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, description }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create department")
        setFeedback({ type: "success", text: `Department "${name}" created.` })
        setName("")
        setSlug("")
        setDescription("")
        setFormOpen(false)
        window.location.reload()
      } catch (err: unknown) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to create department" })
      }
    })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/departments/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName, slug: editSlug, description: editDescription }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update department")
        setEditing(null)
        window.location.reload()
      } catch (err: unknown) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to update department" })
      }
    })
  }

  async function handleDelete(d: Department) {
    const confirmed = window.confirm(
      `Delete department "${d.name}"? This will also permanently delete its ${d.clubs.length} club(s) and all of their members, gallery, achievements and events. This cannot be undone.`
    )
    if (!confirmed) return
    setDeletingId(d.id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/departments/${d.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete department")
      window.location.reload()
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to delete department" })
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            aria-label="Search departments"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-muted-foreground sm:block" aria-live="polite">
            {filtered.length} of {departments.length}
          </p>
          {formVisible ? (
            <Button variant="outline" onClick={closeForm}>
              <X className="size-4 mr-2" strokeWidth={1.5} />
              Close
            </Button>
          ) : (
            <Button onClick={openCreate}>
              <Plus className="size-4 mr-2" strokeWidth={1.5} />
              New Department
            </Button>
          )}
        </div>
      </div>

      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* Full-width create / edit panel — same stacked layout as the individual club manage page */}
      {formVisible && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-heading text-lg font-semibold">
                {isEditing ? `Edit ${editing.name}` : "New department"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update the name, URL slug and description."
                  : "Add a new academic department. Clubs live under a department."}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={closeForm} aria-label="Close form">
              <X className="size-4" strokeWidth={1.5} />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={isEditing ? handleEdit : handleCreate} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={isEditing ? "edit-dept-name" : "new-dept-name"}>Name *</Label>
                  <Input
                    id={isEditing ? "edit-dept-name" : "new-dept-name"}
                    value={isEditing ? editName : name}
                    onChange={(e) => (isEditing ? setEditName(e.target.value) : handleNameChange(e.target.value))}
                    placeholder="e.g. Computer Science"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={isEditing ? "edit-dept-slug" : "new-dept-slug"}>Slug *</Label>
                  <Input
                    id={isEditing ? "edit-dept-slug" : "new-dept-slug"}
                    value={isEditing ? editSlug : slug}
                    onChange={(e) => (isEditing ? setEditSlug(e.target.value) : setSlug(e.target.value))}
                    placeholder="e.g. computer-science"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={isEditing ? "edit-dept-desc" : "new-dept-desc"}>Description</Label>
                <Textarea
                  id={isEditing ? "edit-dept-desc" : "new-dept-desc"}
                  value={isEditing ? editDescription : description}
                  onChange={(e) => (isEditing ? setEditDescription(e.target.value) : setDescription(e.target.value))}
                  rows={3}
                  disabled={isPending}
                  placeholder="What this department covers…"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" strokeWidth={1.5} />}
                  {isEditing ? "Save changes" : "Create department"}
                </Button>
                <Button type="button" variant="outline" disabled={isPending} onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search ? Search : FolderOpen}
          title={search ? `No departments match "${search}"` : "No departments yet"}
          hint={
            search
              ? "Try a different search, or create a department with that name."
              : "Create your first department to start organising clubs."
          }
          action={
            !search && !formVisible ? (
              <Button onClick={openCreate}>
                <Plus className="size-4 mr-2" strokeWidth={1.5} />
                New Department
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="size-5 text-primary" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading truncate text-base font-semibold">{d.name}</CardTitle>
                    <div className="mt-1.5">
                      <Badge variant="secondary" className="font-mono text-[11px]">{d.slug}</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(d)} aria-label={`Edit ${d.name}`}>
                      <Pencil className="size-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d)}
                      aria-label={`Delete ${d.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === d.id ? (
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />
                      ) : (
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {d.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/70">No description yet.</p>
                )}
                <div className="mt-auto flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    {d.clubs.length > 0 ? (
                      <div className="flex -space-x-2">
                        {d.clubs.slice(0, 4).map((c) => (
                          <Avatar key={c.id} className="size-6 border-2 border-card">
                            <AvatarImage src={c.logoUrl ?? undefined} alt="" />
                            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                              {c.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {d.clubs.length} {d.clubs.length === 1 ? "club" : "clubs"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-primary hover:text-primary"
                    onClick={() => onViewClubs(d.id)}
                  >
                    View clubs
                    <ArrowRight className="ml-1 size-3.5" strokeWidth={1.5} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Clubs ---------------- */

function ClubManagement({
  departments,
  deptFilter,
  onDeptFilterChange,
}: {
  departments: Department[]
  deptFilter: string
  onDeptFilterChange: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const allClubs = useMemo(
    () => departments.flatMap((d) => d.clubs.map((c) => ({ ...c, departmentId: d.id, departmentName: d.name }))),
    [departments]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allClubs.filter((c) => {
      if (deptFilter !== "all" && c.departmentId !== deptFilter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.departmentName.toLowerCase().includes(q)
      )
    })
  }, [allClubs, search, deptFilter])

  async function handleCreate(data: ClubFormData) {
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Failed to create club")
    setFeedback({ type: "success", text: `Club "${data.name}" created.` })
    setFormOpen(false)
    window.location.reload()
  }

  async function handleDelete(clubId: string, clubName: string) {
    const confirmed = window.confirm(
      `Delete club "${clubName}"? This will also permanently delete its members, gallery, achievements and events. This cannot be undone.`
    )
    if (!confirmed) return
    setDeletingId(clubId)
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}`, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to delete club")
        window.location.reload()
      } catch (err: unknown) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to delete club" })
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs…"
            aria-label="Search clubs"
            className="pl-9"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={deptFilter}
            onChange={(e) => onDeptFilterChange(e.target.value)}
            aria-label="Filter clubs by department"
            className="flex h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.clubs.length})
              </option>
            ))}
          </select>
          {formOpen ? (
            <Button variant="outline" onClick={() => setFormOpen(false)} className="shrink-0">
              <X className="size-4 mr-2" strokeWidth={1.5} />
              Close
            </Button>
          ) : (
            <Button onClick={() => { setFeedback(null); setFormOpen(true) }} className="shrink-0" disabled={departments.length === 0}>
              <Plus className="size-4 mr-2" strokeWidth={1.5} />
              New Club
            </Button>
          )}
        </div>
      </div>
      {!formOpen && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {filtered.length} of {allClubs.length} clubs
          {deptFilter !== "all" && (
            <>
              {" in "}
              <span className="font-medium text-foreground">
                {departments.find((d) => d.id === deptFilter)?.name}
              </span>{" "}
              <button
                type="button"
                onClick={() => onDeptFilterChange("all")}
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Clear filter
              </button>
            </>
          )}
        </p>
      )}

      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {departments.length === 0 && !formOpen ? (
        <EmptyState
          icon={Building2}
          title="Create a department first"
          hint="Clubs live under a department. Add a department, then come back to create clubs."
        />
      ) : (
        <>
          {/* Full-width create panel — same stacked layout as the individual club manage page */}
          {formOpen && (
            <Card className="animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="font-heading text-lg font-semibold">New club</CardTitle>
                  <CardDescription>
                    Add a new club under a department — logo, cover image, links, contacts and email can all be set right here.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} aria-label="Close form">
                  <X className="size-4" strokeWidth={1.5} />
                </Button>
              </CardHeader>
              <CardContent>
                <ClubManagementForm departments={departments} onSubmit={handleCreate} submitLabel="Create Club" />
              </CardContent>
            </Card>
          )}

          {filtered.length === 0 && !formOpen ? (
            <EmptyState
              icon={search || deptFilter !== "all" ? Search : Users}
              title={search || deptFilter !== "all" ? "No clubs match your filters" : "No clubs yet"}
              hint={
                search || deptFilter !== "all"
                  ? "Try a different search or clear the department filter."
                  : "Create your first club to get started."
              }
              action={
                search || deptFilter !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => { setSearch(""); onDeptFilterChange("all") }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="size-4 mr-2" strokeWidth={1.5} />
                    New Club
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <Card
                  key={c.id}
                  className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <CardContent className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 shrink-0">
                        <AvatarImage src={c.logoUrl ?? undefined} alt={`${c.name} logo`} />
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                          {c.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading truncate text-[15px] font-semibold text-foreground">{c.name}</p>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[11px]">{c.departmentName}</Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === c.id || isPending}
                        onClick={() => handleDelete(c.id, c.name)}
                        aria-label={`Delete ${c.name}`}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />
                        ) : (
                          <Trash2 className="size-4" strokeWidth={1.5} />
                        )}
                      </Button>
                    </div>
                    {c.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground/70">No description yet.</p>
                    )}
                    <div className="mt-auto flex gap-2 border-t pt-3">
                      <Button type="button" size="sm" className="flex-1" asChild>
                        <Link href={`/manage/clubs/${c.id}`}>
                          <Settings2 className="size-4 mr-1.5" strokeWidth={1.5} />
                          Manage
                        </Link>
                      </Button>
                      <Button type="button" variant="outline" size="sm" asChild aria-label={`Edit ${c.name}`}>
                        <Link href={`/manage/clubs/${c.id}#edit-club`}>
                          <Pencil className="size-4" strokeWidth={1.5} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
