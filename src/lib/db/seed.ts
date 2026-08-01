import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { users } from "./schema/users"
import { skills } from "./schema/skills"

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

async function seed() {
  const adminCount = await seedAdmin()
  const skillCount = await seedSkills()
  console.log(
    `[seed] Done. admin inserted: ${adminCount}, skills inserted: ${skillCount}`
  )
}

seed().catch((error) => {
  console.error("[seed] Failed:", error)
  process.exit(1)
})
