import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { users } from "./schema/users"
import { skills } from "./schema/skills"
import { siteConfig } from "./schema/site-config"
import { courses } from "./schema/courses"
import { departments } from "./schema/departments"
import { clubs } from "./schema/clubs"
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
  { name: "ACM", description: "Association for Computing Machinery", departmentSlug: "cse" },
  { name: "IEEE", description: "Institute of Electrical and Electronics Engineers", departmentSlug: "cse" },
  { name: "CodeChef", description: "Programming competitive club", departmentSlug: "cse" },
  { name: "Google Developer Students Club", description: "GDSC CSE", departmentSlug: "cse" },
  { name: "Robotics Club", description: "Robotics and automation", departmentSlug: "cse" },
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
        status: "approved",
      })
      console.log(`[seed] Created club: ${club.name}`)
    }
  }
}

async function seed() {
  const adminCount = await seedAdmin()
  const skillCount = await seedSkills()
  const batchCount = await seedCurrentBatch()
  const { courseInserted } = await seedQuestionBank()
  await seedDepartmentsAndClubs()
  console.log(
    `[seed] Done. admin inserted: ${adminCount}, skills inserted: ${skillCount}, currentBatch inserted: ${batchCount}, subjects: removed, courses inserted: ${courseInserted}, departments+clubs seeded`
  )
}

seed().catch((error) => {
  console.error("[seed] Failed:", error)
  process.exit(1)
})