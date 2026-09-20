"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Trash2, Users, Images, Trophy, CalendarDays, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClubManagementForm, type ClubFormData } from "@/components/clubs/ClubManagementForm"

export interface ManageClubInfo {
  id: string
  name: string
  description: string | null
  departmentId: string
  departmentName: string
  status: string
  logoUrl: string | null
  coverImgUrl: string | null
  msgGroupUrl: string | null
  pageUrl: string | null
  fbGroupUrl: string | null
  contacts: string | null
  mail: string | null
  updatedAt: string
}

interface ManageClubDetailClientProps {
  club: ManageClubInfo
  departments: { id: string; name: string; slug: string }[]
  counts: {
    members: number
    albums: number
    achievements: number
    events: number
  }
}

export function ManageClubDetailClient({ club, departments, counts }: ManageClubDetailClientProps) {
  const router = useRouter()
  const [isDeleting, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleEdit(data: ClubFormData) {
    const res = await fetch(`/api/clubs/${club.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Failed to update club")
    router.refresh()
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete club "${club.name}"? This will also permanently delete its members, gallery, achievements and events. This cannot be undone.`
    )
    if (!confirmed) return
    setDeleteError(null)
    startDelete(async () => {
      try {
        const res = await fetch(`/api/clubs/${club.id}`, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to delete club")
        router.push("/manage/clubs")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete club"
        setDeleteError(msg)
      }
    })
  }

  const subpages = [
    { href: "#club-members", icon: Users, title: "Members", description: `${counts.members} members — search profiles and assign designations`, count: counts.members },
    { href: `/manage/clubs/${club.id}/gallery`, icon: Images, title: "Gallery", description: `${counts.albums} albums — create albums and upload images`, count: counts.albums },
    { href: `/manage/clubs/${club.id}/achievements`, icon: Trophy, title: "Achievements", description: `${counts.achievements} achievements — titles, images and links`, count: counts.achievements },
    { href: `/manage/clubs/${club.id}/events`, icon: CalendarDays, title: "Events", description: `${counts.events} events — also listed on the events page`, count: counts.events },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subpages.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="group p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors motion-reduce:transition-none"
          >
            <div className="flex items-center justify-between">
              <s.icon className="size-5 text-primary" strokeWidth={1.5} />
              <Badge variant="secondary">{s.count}</Badge>
            </div>
            <p className="mt-2 font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {s.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
          </Link>
        ))}
      </div>

      <Card id="edit-club" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Edit Club</CardTitle>
          <CardDescription>
            Update {club.name}&apos;s details — logo, cover image, links, contacts and email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubManagementForm
            departments={departments}
            submitLabel="Save Changes"
            initialData={{
              name: club.name,
              description: club.description ?? "",
              departmentId: club.departmentId,
              logoUrl: club.logoUrl ?? "",
              coverImgUrl: club.coverImgUrl ?? "",
              msgGroupUrl: club.msgGroupUrl ?? "",
              pageUrl: club.pageUrl ?? "",
              fbGroupUrl: club.fbGroupUrl ?? "",
              contacts: club.contacts ?? "",
              mail: club.mail ?? "",
              updatedAt: club.updatedAt,
            }}
            onSubmit={handleEdit}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Deleting this club permanently removes its members, gallery, achievements and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deleteError && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
              {deleteError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" strokeWidth={1.5} />
              ) : (
                <Trash2 className="size-4 mr-2" strokeWidth={1.5} />
              )}
              Delete Club
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clubs/${club.id}`}>
                <ExternalLink className="size-4 mr-2" strokeWidth={1.5} />
                View Public Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
