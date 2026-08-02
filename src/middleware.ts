import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Role } from "@/lib/auth/types"

const secret = process.env.AUTH_SECRET

const routePermissions: Record<string, Role[]> = {
  "/directory": [],
  "/faculty": [],
  "/question-bank": [],
  "/clubs": [],
  "/alumni": [],
  "/events": [],
  "/notices": [],
  "/achievements": [],
  "/projects": [],
  "/certificate-verify": [],

  "/profile": ["user", "moderator", "admin"],
  "/profile/edit": ["user", "moderator", "admin"],
  "/upload-question": ["user", "moderator", "admin"],
  "/my-submissions": ["user", "moderator", "admin"],
  "/helpline": ["user", "moderator", "admin"],
  "/career-guidance": ["user", "moderator", "admin"],
  "/cgpa-calculator": ["user", "moderator", "admin"],
  "/blood-donor": ["user", "moderator", "admin"],

  "/approve": ["moderator", "admin"],
  "/manage/roles": ["admin"],
  "/manage/faculty": ["admin"],
  "/manage/clubs": ["admin"],
  "/manage/alumni": ["admin"],
  "/manage/events": ["admin"],
  "/manage/skills": ["admin"],
  "/manage/settings": ["admin"],
}

function matchRoute(pathname: string): string | undefined {
  let match: string | undefined
  for (const key of Object.keys(routePermissions)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      if (!match || key.length > match.length) match = key
    }
  }
  return match
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const route = matchRoute(pathname)

  if (!route) {
    return NextResponse.next()
  }

  const allowedRoles = routePermissions[route]
  if (allowedRoles.length === 0) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret })
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (!allowedRoles.includes(token.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
