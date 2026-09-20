import { desc, eq, sql, type InferSelectModel } from "drizzle-orm"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema/departments"
import { clubs } from "@/lib/db/schema/clubs"
import { clubMembers } from "@/lib/db/schema/club-members"
import { clubGalleryAlbums } from "@/lib/db/schema/club-gallery-albums"
import { clubGalleryImages } from "@/lib/db/schema/club-gallery-images"
import { clubAchievements } from "@/lib/db/schema/club-achievements"
import { events } from "@/lib/db/schema/events"
import { profiles } from "@/lib/db/schema/profiles"

export type DepartmentGroup = {
  department: InferSelectModel<typeof departments>
  clubs: InferSelectModel<typeof clubs>[]
}

export async function getDepartmentsWithClubs(): Promise<DepartmentGroup[]> {
  const rows = await db.query.departments.findMany({
    with: {
      clubs: {
        where: eq(clubs.status, "approved"),
        orderBy: [desc(clubs.createdAt)],
      },
    },
    orderBy: [desc(departments.createdAt)],
  })

  return rows.map((row) => ({
    department: row,
    clubs: row.clubs.filter((c) => c.status === "approved"),
  }))
}

export async function getClubById(clubId: string): Promise<InferSelectModel<typeof clubs> | null> {
  const row = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
  })
  return row ?? null
}

export async function getApprovedClubs(): Promise<InferSelectModel<typeof clubs>[]> {
  const rows = await db.query.clubs.findMany({
    where: eq(clubs.status, "approved"),
    orderBy: [desc(clubs.createdAt)],
  })
  return rows
}

export async function getClubDetail(clubId: string) {
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
    with: {
      department: {
        columns: { name: true },
      },
    },
  })
  if (!club) return null

  const members = await db.query.clubMembers.findMany({
    where: eq(clubMembers.clubId, clubId),
    with: {
      profile: {
        columns: {
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  })

  const albums = await db.query.clubGalleryAlbums.findMany({
    where: eq(clubGalleryAlbums.clubId, clubId),
    with: {
      clubGalleryImages: {
        orderBy: [desc(clubGalleryImages.displayOrder)],
      },
    },
  })

  const achievements = await db.query.clubAchievements.findMany({
    where: eq(clubAchievements.clubId, clubId),
    orderBy: [desc(clubAchievements.createdAt)],
  })

  const clubEvents = await db.query.events.findMany({
    where: eq(events.clubId, clubId),
    orderBy: [desc(events.createdAt)],
  })

  return {
    club,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      profileId: m.profileId,
      avatarUrl: m.profile?.avatarUrl ?? null,
      fullName: m.profile?.fullName ?? null,
      roleInClub: m.roleInClub,
      position: m.position ?? null,
      designation: m.designation ?? null,
      joinedAt: m.joinedAt,
    })),
    albums: albums.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      images: a.clubGalleryImages.map((i) => ({
        id: i.id,
        imageUrl: i.imageUrl,
        caption: i.caption,
        displayOrder: i.displayOrder,
      })),
    })),
    achievements: achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      date: a.date,
      imageUrl: a.imageUrl,
      linkUrl: a.linkUrl,
    })),
    events: clubEvents.map((e) => ({
      id: e.id,
      name: e.name,
      place: e.place,
      description: e.description,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      deadline: e.deadline,
      clubId: e.clubId,
      status: computeEventStatus(e.startTime, e.endTime),
    })),
  }
}

export function computeEventStatus(startTime: string | null, endTime: string | null): string {
  const now = new Date()
  const endTimeDate = endTime ? new Date(endTime) : null
  const startTimeDate = startTime ? new Date(startTime) : null

  if (endTimeDate && endTimeDate <= now) return "completed"
  if (startTimeDate && startTimeDate > now) return "upcoming"
  return "ongoing"
}

export async function getEventsForPage(clubId?: string | null) {
  if (clubId) {
    const clubEvents = await db.query.events.findMany({
      where: eq(events.clubId, clubId),
      orderBy: [desc(events.createdAt)],
      with: {
        club: {
          columns: { name: true },
        },
      },
    })
    return clubEvents.map((e) => ({
      ...e,
      status: computeEventStatus(e.startTime, e.endTime),
      clubName: e.club?.name ?? "",
    }))
  }

  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.createdAt)],
    with: {
      club: {
        columns: { name: true },
      },
    },
  })
  return allEvents.map((e) => ({
    ...e,
    status: computeEventStatus(e.startTime, e.endTime),
    clubName: e.club?.name ?? "",
  }))
}
