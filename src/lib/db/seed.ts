import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { users } from "./schema/users"
import { skills } from "./schema/skills"
import { siteConfig } from "./schema/site-config"
import { courses } from "./schema/courses"
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
  // 004 revision: `subjects` is removed — the flat `courses` catalog is seeded
  // directly (idempotent by `code`, dedupe rule unchanged).
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

async function seed() {
  const adminCount = await seedAdmin()
  const skillCount = await seedSkills()
  const batchCount = await seedCurrentBatch()
  const { courseInserted } = await seedQuestionBank()
  console.log(
    `[seed] Done. admin inserted: ${adminCount}, skills inserted: ${skillCount}, currentBatch inserted: ${batchCount}, subjects: removed, courses inserted: ${courseInserted}`
  )
}

seed().catch((error) => {
  console.error("[seed] Failed:", error)
  process.exit(1)
})