import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { users } from "./schema/users"
import { skills } from "./schema/skills"
import { siteConfig } from "./schema/site-config"
import { subjects } from "./schema/subjects"
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
  let subjectInserted = 0
  let courseInserted = 0

  for (const subject of uuCseCoursesSeed.subjects) {
    const existing = await db.query.subjects.findFirst({
      where: eq(subjects.slug, subject.slug),
    })
    if (existing) {
      console.log(`[seed] Subject already exists, skipping: ${subject.slug}`)
      continue
    }
    await db.insert(subjects).values({
      slug: subject.slug,
      name: subject.name,
    })
    subjectInserted++
  }

  for (const course of uuCseCoursesSeed.courses) {
    const existing = await db.query.courses.findFirst({
      where: eq(courses.code, course.code),
    })
    if (existing) {
      console.log(`[seed] Course already exists, skipping: ${course.code}`)
      continue
    }
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.slug, course.subjectSlug),
    })
    if (!subject) {
      throw new Error(`[seed] Subject not found for course: ${course.code} → ${course.subjectSlug}`)
    }
    await db.insert(courses).values({
      code: course.code,
      title: course.title,
      creditHours: course.creditHours.toString(),
      subjectId: subject.id,
    })
    courseInserted++
  }

  console.log(
    `[seed] subjects: ${subjectInserted}, courses: ${courseInserted}`
  )
  return { subjectInserted, courseInserted }
}

async function seed() {
  const adminCount = await seedAdmin()
  const skillCount = await seedSkills()
  const batchCount = await seedCurrentBatch()
  const { subjectInserted, courseInserted } = await seedQuestionBank()
  console.log(
    `[seed] Done. admin inserted: ${adminCount}, skills inserted: ${skillCount}, currentBatch inserted: ${batchCount}, subjects inserted: ${subjectInserted}, courses inserted: ${courseInserted}`
  )
}

seed().catch((error) => {
  console.error("[seed] Failed:", error)
  process.exit(1)
})
