"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "abc12345",
  "letmein",
  "welcome1",
  "admin123",
  "changeme",
  "iloveyou",
  "monkey123",
  "dragon123",
  "football1",
  "654321",
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type RegisterInput = {
  email: string
  password: string
  confirmPassword: string
}

type RegisterResult =
  | { success: true }
  | { success: false; error: string }

export async function registerUser(
  input: RegisterInput
): Promise<RegisterResult> {
  const email = input.email?.trim().toLowerCase() ?? ""
  const password = input.password ?? ""
  const confirmPassword = input.confirmPassword ?? ""

  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "Enter a valid email address." }
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  const lowerPassword = password.toLowerCase()
  const emailLocalPart = email.split("@")[0]
  if (lowerPassword === email || lowerPassword === emailLocalPart) {
    return {
      success: false,
      error: "Password must not be the same as your email.",
    }
  }

  if (WEAK_PASSWORDS.has(lowerPassword)) {
    return {
      success: false,
      error: "That password is too common. Choose a stronger one.",
    }
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists.",
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    await db.insert(users).values({
      email,
      passwordHash,
      authProvider: "credentials",
      role: "user",
    })
  } catch {
    return {
      success: false,
      error: "Could not create account. Please try again.",
    }
  }

  return { success: true }
}
