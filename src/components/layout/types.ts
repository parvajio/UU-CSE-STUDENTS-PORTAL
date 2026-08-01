import type { Role } from "@/lib/auth/types"

export type NavbarUser = {
  id: string
  role: Role
  name?: string | null
  email?: string | null
  image?: string | null
}
