import "../../../scripts/force-ipv4.cjs"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Check your .env file.\n" +
    "Expected: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
  )
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
