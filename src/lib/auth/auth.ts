import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { credentialsProvider, googleProvider } from "./providers"
import type { Role } from "./types"

export const authConfig = {
  providers: [googleProvider, credentialsProvider],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        if (!user.email) return token
        const existing = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        })
        if (existing) {
          token.sub = existing.id
          token.role = existing.role
          return token
        }
        const [created] = await db
          .insert(users)
          .values({
            email: user.email,
            authProvider: "google",
            role: "user",
          })
          .returning({ id: users.id, role: users.role })
        if (!created) return token
        token.sub = created.id
        token.role = created.role
        return token
      }

      if (token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
        })
        token.role = (dbUser?.role ?? "user") as Role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = (token.role as Role) ?? "user"
      session.user.id = (token.sub as string) ?? ""
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
