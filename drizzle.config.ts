import { defineConfig } from "drizzle-kit"

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error(
    "DATABASE_URL environment variable is required for drizzle-kit.\n" +
    "Ensure it is set in .env or shell environment."
  )
}

export default defineConfig({
  schema: "./src/lib/db/schema/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
})
