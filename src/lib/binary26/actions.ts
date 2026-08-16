"use server"

import { eq, or, ilike, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { binary26Registrations, binary26Gallery, siteConfig, users } from "@/lib/db/schema"

export type Binary26ActionResult =
  | { success: true; ticketNumber?: string; data?: unknown }
  | { success: false; error: string }

function fail(error: string): Binary26ActionResult {
  return { success: false, error }
}

export async function submitBinary26Registration(input: {
  fullName: string
  phone: string
  email: string
  batch: string
  section: string
  pickupPoint: string
}): Promise<Binary26ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return fail("You must be logged in to register for Binary 26.")
  }

  const fullName = input.fullName?.trim()
  const phone = input.phone?.trim()
  const email = input.email?.trim().toLowerCase()
  const batch = input.batch?.trim()
  const section = input.section?.trim().toUpperCase()
  const pickupPoint = input.pickupPoint?.trim()

  if (!fullName) return fail("Full name is required.")
  if (!phone) return fail("Phone number is required.")
  if (!email || !email.includes("@")) return fail("Valid email is required.")
  
  const validBatches = ["58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68"]
  if (!validBatches.includes(batch)) return fail("Invalid batch selected.")

  const validSections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  if (!validSections.includes(section)) return fail("Invalid section selected.")

  if (!pickupPoint) return fail("Pickup point is required.")

  // Generate unique ticket number
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  const ticketNumber = `BIN26-${randomStr}`

  try {
    // Check if user already registered or limit check if needed
    await db.insert(binary26Registrations).values({
      userId: session.user.id,
      ticketNumber,
      fullName,
      phone,
      email,
      batch,
      section,
      pickupPoint,
      paymentStatus: "unpaid",
    })

    revalidatePath("/binary-26")
    revalidatePath("/profile")
    return { success: true, ticketNumber }
  } catch (err: unknown) {
    console.error("Failed to submit Binary 26 registration:", err)
    return fail("Failed to submit registration. Please try again.")
  }
}

export async function getUserRegistrations() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    const regs = await db.query.binary26Registrations.findMany({
      where: eq(binary26Registrations.userId, session.user.id),
      orderBy: [desc(binary26Registrations.createdAt)],
    })
    return regs
  } catch (err) {
    console.error("Failed to fetch user registrations:", err)
    return []
  }
}

export async function getAllRegistrations() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return { error: "Forbidden" }
  }

  try {
    const regs = await db.query.binary26Registrations.findMany({
      with: {
        user: true,
        marker: true,
      },
      orderBy: [desc(binary26Registrations.createdAt)],
    })
    return { success: true, data: regs }
  } catch (err) {
    console.error("Failed to fetch all registrations:", err)
    return { error: "Failed to fetch registrations" }
  }
}

export async function markBinary26Paid(ticketNumber: string): Promise<Binary26ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return fail("Unauthorized")
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return fail("Only moderators and admins can mark payments as paid.")
  }

  const cleanedTicket = ticketNumber?.trim().toUpperCase()
  if (!cleanedTicket) return fail("Invalid ticket number.")

  try {
    const existing = await db.query.binary26Registrations.findFirst({
      where: eq(binary26Registrations.ticketNumber, cleanedTicket),
    })

    if (!existing) return fail("Ticket not found.")

    await db.update(binary26Registrations)
      .set({
        paymentStatus: "paid",
        markedPaidBy: session.user.id,
        markedPaidAt: new Date().toISOString(),
      })
      .where(eq(binary26Registrations.ticketNumber, cleanedTicket))

    revalidatePath("/moderator/binary-26")
    revalidatePath("/binary-26")
    return { success: true }
  } catch (err) {
    console.error("Failed to mark paid:", err)
    return fail("Failed to update payment status.")
  }
}

export async function searchBinary26Ticket(query: string) {
  const session = await auth()
  if (!session?.user?.id) return []
  if (session.user.role !== "admin" && session.user.role !== "moderator") return []

  const q = `%${query.trim()}%`
  try {
    const results = await db.query.binary26Registrations.findMany({
      where: or(
        ilike(binary26Registrations.ticketNumber, q),
        ilike(binary26Registrations.phone, q),
        ilike(binary26Registrations.email, q),
        ilike(binary26Registrations.fullName, q)
      ),
      with: {
        user: true,
        marker: true,
      },
      orderBy: [desc(binary26Registrations.createdAt)],
    })
    return results
  } catch (err) {
    console.error("Search failed:", err)
    return []
  }
}

export async function getBinary26Gallery() {
  try {
    const items = await db.query.binary26Gallery.findMany({
      orderBy: [binary26Gallery.displayOrder, desc(binary26Gallery.createdAt)],
    })
    return items
  } catch (err) {
    console.error("Failed to fetch gallery:", err)
    return []
  }
}

export async function upsertBinary26GalleryItem(input: {
  id?: string
  title: string
  imageUrl: string
  year: string
  description?: string
  displayOrder?: number
}): Promise<Binary26ActionResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return fail("Only admins can manage gallery items.")
  }

  const title = input.title?.trim()
  const imageUrl = input.imageUrl?.trim()
  const year = input.year?.trim()
  const description = input.description?.trim()
  const displayOrder = input.displayOrder ?? 0

  if (!title || !imageUrl || !year) {
    return fail("Title, image URL, and year are required.")
  }

  try {
    if (input.id) {
      await db.update(binary26Gallery)
        .set({ title, imageUrl, year, description, displayOrder })
        .where(eq(binary26Gallery.id, input.id))
    } else {
      await db.insert(binary26Gallery).values({
        title,
        imageUrl,
        year,
        description,
        displayOrder,
      })
    }

    revalidatePath("/binary-26")
    revalidatePath("/manage/binary-26")
    return { success: true }
  } catch (err) {
    console.error("Failed to save gallery item:", err)
    return fail("Failed to save gallery item.")
  }
}

export async function deleteBinary26GalleryItem(id: string): Promise<Binary26ActionResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return fail("Only admins can delete gallery items.")
  }

  try {
    await db.delete(binary26Gallery).where(eq(binary26Gallery.id, id))
    revalidatePath("/binary-26")
    revalidatePath("/manage/binary-26")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete gallery item:", err)
    return fail("Failed to delete gallery item.")
  }
}

export async function getBinary26EventSettings() {
  try {
    const config = await db.query.siteConfig.findFirst({
      where: eq(siteConfig.key, "binary26_event_settings"),
    })
    if (!config) {
      return {
        eventTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        title: "Binary 26 Grand Reunion",
        location: "Campus Main Auditorium",
      }
    }
    return config.value as { eventTime: string; title: string; location: string }
  } catch (err) {
    console.error("Failed to fetch event settings:", err)
    return {
      eventTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      title: "Binary 26 Grand Reunion",
      location: "Campus Main Auditorium",
    }
  }
}

export async function updateBinary26EventSettings(input: {
  eventTime: string
  title: string
  location: string
}): Promise<Binary26ActionResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return fail("Only admins can update event settings.")
  }

  try {
    const existing = await db.query.siteConfig.findFirst({
      where: eq(siteConfig.key, "binary26_event_settings"),
    })

    if (existing) {
      await db.update(siteConfig)
        .set({
          value: input,
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(siteConfig.key, "binary26_event_settings"))
    } else {
      await db.insert(siteConfig).values({
        key: "binary26_event_settings",
        value: input,
        updatedBy: session.user.id,
      })
    }

    revalidatePath("/")
    revalidatePath("/binary-26")
    revalidatePath("/manage/binary-26")
    return { success: true }
  } catch (err) {
    console.error("Failed to update event settings:", err)
    return fail("Failed to update event settings.")
  }
}
