import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { users } from "./schema/users"
import { skills } from "./schema/skills"
import { siteConfig } from "./schema/site-config"
import { courses } from "./schema/courses"
import { departments } from "./schema/departments"
import { clubs } from "./schema/clubs"
import { clubMembers } from "./schema/club-members"
import { clubGalleryAlbums } from "./schema/club-gallery-albums"
import { clubGalleryImages } from "./schema/club-gallery-images"
import { clubAchievements } from "./schema/club-achievements"
import { events } from "./schema/events"
import { profiles } from "./schema/profiles"
import uuCseCoursesSeed from "./seed-data/uu-cse-courses-seed.json"
import { CURRENT_BATCH } from "../../../config/site"

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@cse-portal.edu"
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "changeme123"

const TOP_LEVEL_SKILLS = [
  { name: "Web Development", slug: "web-development", colorKey: "web" },
  { name: "ML/AI", slug: "ml-ai", colorKey: "ml" },
  { name: "Competitive Programming", slug: "competitive-programming", colorKey: "cp" },
  { name: "Cybersecurity", slug: "cybersecurity", colorKey: "cyber" },
  { name: "Research", slug: "research", colorKey: "research" },
  { name: "Design", slug: "design", colorKey: "design" },
]

const SEED_DEPARTMENTS = [
  { name: "CSE", slug: "cse", description: "Computer Science and Engineering" },
  { name: "IT", slug: "it", description: "Information Technology" },
  { name: "AIML", slug: "aiml", description: "Artificial Intelligence and Machine Learning" },
]

const SEED_CLUBS = [
  {
    name: "ACM",
    description: "Association for Computing Machinery — workshops, hackathons and more. Join us at https://acm.example.edu and our community at www.example.edu/acm-chat.",
    departmentSlug: "cse",
    pageUrl: "https://acm.example.edu",
    fbGroupUrl: "https://facebook.com/groups/acm-example",
    msgGroupUrl: "https://chat.example.edu/acm",
    contacts: "ACM Helpdesk, Room 304",
    mail: "acm@example.edu",
  },
  { name: "IEEE", description: "Institute of Electrical and Electronics Engineers", departmentSlug: "cse" },
  { name: "CodeChef", description: "Programming competitive club", departmentSlug: "cse" },
  { name: "Google Developer Students Club", description: "GDSC CSE", departmentSlug: "cse" },
  { name: "Robotics Club", description: "Robotics and automation", departmentSlug: "cse" },
]

// T061: comprehensive club content seed (idempotent — skipped when present).
const SEED_GALLERY_ALBUMS = [
  { clubName: "ACM", title: "HackNight 2026", description: "Photos from our flagship hackathon. Full album at https://photos.example.edu/hacknight.", displayOrder: 0 },
  { clubName: "ACM", title: "Workshops", description: "Hands-on workshop sessions.", displayOrder: 1 },
]

const SEED_GALLERY_IMAGES = [
  { albumTitle: "HackNight 2026", imageUrl: "https://picsum.photos/seed/acm-hack1/800/600", caption: "Opening ceremony — see www.example.edu/acm-recap for the recap.", displayOrder: 0 },
  { albumTitle: "HackNight 2026", imageUrl: "https://picsum.photos/seed/acm-hack2/800/600", caption: "Final demos", displayOrder: 1 },
  { albumTitle: "Workshops", imageUrl: "https://picsum.photos/seed/acm-ws1/800/600", caption: "Git workshop", displayOrder: 0 },
]

const SEED_ACHIEVEMENTS = [
  {
    clubName: "ACM",
    title: "National Hackathon Champions 2025",
    description: "First place among 200 teams. Read more at https://news.example.edu/acm-win.",
    linkUrl: "https://news.example.edu/acm-win",
  },
  {
    clubName: "IEEE",
    title: "Best Student Branch Award",
    description: "Recognized for outstanding technical activities.",
  },
]

function seedEventDates() {
  const now = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString()
  return [
    {
      clubName: "ACM",
      name: "Upcoming Coding Contest",
      place: "Lab 301",
      description: "Weekly contest — register at https://contests.example.edu/acm.",
      date: iso(now + 7 * 86400_000),
      deadline: iso(now + 6 * 86400_000),
      startTime: iso(now + 7 * 86400_000),
      endTime: iso(now + 7 * 86400_000 + 3 * 3600_000),
    },
    {
      clubName: "ACM",
      name: "Ongoing Build Sprint",
      place: "Innovation Hub",
      description: "48-hour build sprint, currently running.",
      date: iso(now - 3600_000),
      deadline: null,
      startTime: iso(now - 3600_000),
      endTime: iso(now + 2 * 3600_000),
    },
    {
      clubName: "IEEE",
      name: "Past Tech Talk",
      place: "Seminar Hall",
      description: "Intro to embedded systems.",
      date: iso(now - 30 * 86400_000),
      deadline: null,
      startTime: iso(now - 30 * 86400_000),
      endTime: iso(now - 30 * 86400_000 + 2 * 3600_000),
    },
  ]
}

async function seedAdmin() {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  })
  if (existing) {
    console.log(`[seed] Admin already exists, skipping: ${ADMIN_EMAIL}`)
    return 0
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  await db.insert(users).values({
    email: ADMIN_EMAIL,
    passwordHash,
    authProvider: "credentials",
    role: "admin",
  })
  console.log(`[seed] Created admin user: ${ADMIN_EMAIL}`)
  return 1
}

async function seedSkills() {
  let inserted = 0
  for (const skill of TOP_LEVEL_SKILLS) {
    const existing = await db.query.skills.findFirst({
      where: eq(skills.slug, skill.slug),
    })
    if (existing) {
      console.log(`[seed] Skill already exists, skipping: ${skill.slug}`)
      continue
    }
    await db.insert(skills).values({
      name: skill.name,
      slug: skill.slug,
      colorKey: skill.colorKey,
    })
    inserted++
  }
  console.log(`[seed] Inserted ${inserted} top-level skill(s)`)
  return inserted
}

async function seedCurrentBatch() {
  const existing = await db.query.siteConfig.findFirst({
    where: eq(siteConfig.key, "currentBatch"),
  })
  if (existing) {
    console.log(
      `[seed] currentBatch already set, skipping (value: ${JSON.stringify(existing.value)})`
    )
    return 0
  }
  await db.insert(siteConfig).values({
    key: "currentBatch",
    value: CURRENT_BATCH,
  })
  console.log(`[seed] Set currentBatch to ${CURRENT_BATCH}`)
  return 1
}

async function seedQuestionBank() {
  let courseInserted = 0
  for (const course of uuCseCoursesSeed.courses) {
    const existing = await db.query.courses.findFirst({
      where: eq(courses.code, course.code),
    })
    if (existing) {
      console.log(`[seed] Course already exists, skipping: ${course.code}`)
      continue
    }
    await db.insert(courses).values({
      code: course.code,
      title: course.title,
      creditHours: course.creditHours.toString(),
    })
    courseInserted++
  }
  console.log(
    `[seed] subjects: removed, courses: ${courseInserted}`
  )
  return { courseInserted }
}

async function seedDepartmentsAndClubs() {
  let deptInserted = 0
  for (const dept of SEED_DEPARTMENTS) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.slug, dept.slug),
    })
    if (!existing) {
      await db.insert(departments).values(dept)
      deptInserted++
      console.log(`[seed] Created department: ${dept.name}`)
    }
  }

  const existingDept = await db.query.departments.findMany({ columns: { id: true, slug: true } })
  const deptMap = Object.fromEntries(existingDept.map((d) => [d.slug, d.id]))

  for (const club of SEED_CLUBS) {
    const existing = await db.query.clubs.findFirst({
      where: eq(clubs.name, club.name),
    })
    if (!existing && deptMap[club.departmentSlug]) {
      await db.insert(clubs).values({
        name: club.name,
        description: club.description,
        departmentId: deptMap[club.departmentSlug],
        pageUrl: club.pageUrl ?? null,
        fbGroupUrl: club.fbGroupUrl ?? null,
        msgGroupUrl: club.msgGroupUrl ?? null,
        contacts: club.contacts ?? null,
        mail: club.mail ?? null,
        status: "approved",
      })
      console.log(`[seed] Created club: ${club.name}`)
    }
  }
}

async function seedClubContent() {
  const allClubs = await db.query.clubs.findMany({ columns: { id: true, name: true } })
  const clubMap = Object.fromEntries(allClubs.map((c) => [c.name, c.id]))
  if (Object.keys(clubMap).length === 0) {
    console.log("[seed] No clubs found, skipping club content seed")
    return
  }

  // Gallery albums + images
  const albumMap: Record<string, string> = {}
  for (const album of SEED_GALLERY_ALBUMS) {
    const clubId = clubMap[album.clubName]
    if (!clubId) continue
    const existing = await db.query.clubGalleryAlbums.findFirst({
      where: eq(clubGalleryAlbums.title, album.title),
    })
    if (existing) {
      albumMap[album.title] = existing.id
      continue
    }
    const [row] = await db
      .insert(clubGalleryAlbums)
      .values({ clubId, title: album.title, description: album.description, displayOrder: album.displayOrder })
      .returning({ id: clubGalleryAlbums.id })
    albumMap[album.title] = row.id
    console.log(`[seed] Created gallery album: ${album.title}`)
  }
  for (const image of SEED_GALLERY_IMAGES) {
    const albumId = albumMap[image.albumTitle]
    if (!albumId) continue
    const existing = await db.query.clubGalleryImages.findFirst({
      where: eq(clubGalleryImages.imageUrl, image.imageUrl),
    })
    if (existing) continue
    await db.insert(clubGalleryImages).values({
      albumId,
      imageUrl: image.imageUrl,
      caption: image.caption,
      displayOrder: image.displayOrder,
    })
    console.log(`[seed] Added gallery image to: ${image.albumTitle}`)
  }

  // Achievements
  for (const achievement of SEED_ACHIEVEMENTS) {
    const clubId = clubMap[achievement.clubName]
    if (!clubId) continue
    const existing = await db.query.clubAchievements.findFirst({
      where: eq(clubAchievements.title, achievement.title),
    })
    if (existing) continue
    await db.insert(clubAchievements).values({
      clubId,
      title: achievement.title,
      description: achievement.description,
      linkUrl: achievement.linkUrl ?? null,
    })
    console.log(`[seed] Created achievement: ${achievement.title}`)
  }

  // Events: one upcoming, one ongoing, one completed (covers timer states)
  for (const event of seedEventDates()) {
    const clubId = clubMap[event.clubName]
    if (!clubId) continue
    const existing = await db.query.events.findFirst({
      where: eq(events.name, event.name),
    })
    if (existing) continue
    await db.insert(events).values({
      clubId,
      name: event.name,
      place: event.place,
      description: event.description,
      date: event.date,
      deadline: event.deadline,
      startTime: event.startTime,
      endTime: event.endTime,
    })
    console.log(`[seed] Created event: ${event.name}`)
  }

  // Members: attach existing approved profiles opportunistically
  const approvedProfiles = await db.query.profiles.findMany({
    where: eq(profiles.status, "approved"),
    columns: { id: true, fullName: true },
  })
  const acmId = clubMap["ACM"]
  if (acmId && approvedProfiles.length > 0) {
    const roles = ["executive", "member", "advisor"] as const
    const designations = ["President", "General Secretary", "Faculty Advisor"]
    for (let i = 0; i < Math.min(approvedProfiles.length, 3); i++) {
      const profile = approvedProfiles[i]
      const existing = await db.query.clubMembers.findMany({
        where: eq(clubMembers.clubId, acmId),
      })
      if (existing.some((m) => m.profileId === profile.id)) continue
      await db.insert(clubMembers).values({
        clubId: acmId,
        profileId: profile.id,
        roleInClub: roles[i],
        position: designations[i],
        designation: designations[i],
      })
      console.log(`[seed] Added member ${profile.fullName} to ACM`)
    }
  } else {
    console.log("[seed] No approved profiles found, skipping member seed")
  }
}

async function seed() {
  const adminCount = await seedAdmin()
  const skillCount = await seedSkills()
  const batchCount = await seedCurrentBatch()
  const { courseInserted } = await seedQuestionBank()
  await seedDepartmentsAndClubs()
  await seedClubContent()
  console.log(
    `[seed] Done. admin inserted: ${adminCount}, skills inserted: ${skillCount}, currentBatch inserted: ${batchCount}, subjects: removed, courses inserted: ${courseInserted}, departments+clubs seeded`
  )
}

seed().catch((error) => {
  console.error("[seed] Failed:", error)
  process.exit(1)
})