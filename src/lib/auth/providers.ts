import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const googleProvider = Google({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
})

export const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email =
      typeof credentials?.email === "string"
        ? credentials.email.trim().toLowerCase()
        : ""
    const password =
      typeof credentials?.password === "string" ? credentials.password : ""

    if (!email || !password) return null

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (!user || !user.passwordHash) return null
    if (user.authProvider === "unclaimed") return null

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return null

    return { id: user.id, email: user.email, role: user.role }
  },
})
