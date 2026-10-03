import Link from "next/link"
import { GraduationCap, Mail, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SITE_NAME } from "../../../config/site"
import { db } from "@/lib/db"
import { clubs } from "@/lib/db/schema/clubs"
import { profiles } from "@/lib/db/schema/profiles"
import { eq } from "drizzle-orm"

export const FEATURED_CLUB_ID = "067a3f21-a4be-4a99-87f9-630c7785d520"
export const DEVELOPER_PROFILE_ID = "7cfe12fc-7abf-4515-bf95-e2766480d728"
export const CLUB_CONTACT_EMAIL = "uucsestudentassociation@gmail.com"
export const CLUB_FACEBOOK_URL = "https://www.facebook.com/share/1HCxTsNFtz/"

// Verified fallbacks so the footer never renders empty if the DB read fails.
const FALLBACK_CLUB = {
  name: "CSE Student Association",
  logoUrl:
    "https://utfs.io/f/HKXlk1rcUaqoiGl0RNy6BEGzxqjS8VfHN4dtDXgwJsU3ovkR",
}
const FALLBACK_DEVELOPER = {
  fullName: "MD. Parvaj Mosharof",
  avatarUrl:
    "https://ik.imagekit.io/parvajio/my%20photos/wbg2.png?updatedAt=1741167504336",
}

const EXPLORE_LINKS = [
  { href: "/experts", label: "Experts" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/faculty", label: "Faculty" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/routine", label: "Routine" },
]

const PORTAL_LINKS = [
  { href: "/binary-26", label: "Binary 26" },
  { href: "/upload-question", label: "Contribute Questions" },
  { href: "/my-submissions", label: "My Submissions" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create Account" },
]

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

async function getFooterIdentities() {
  try {
    const [club, developer] = await Promise.all([
      db.query.clubs.findFirst({
        where: eq(clubs.id, FEATURED_CLUB_ID),
        columns: { name: true, logoUrl: true },
      }),
      db.query.profiles.findFirst({
        where: eq(profiles.id, DEVELOPER_PROFILE_ID),
        columns: { fullName: true, avatarUrl: true },
      }),
    ])
    return {
      club: {
        name: club?.name ?? FALLBACK_CLUB.name,
        logoUrl: club?.logoUrl ?? FALLBACK_CLUB.logoUrl,
      },
      developer: {
        fullName: developer?.fullName ?? FALLBACK_DEVELOPER.fullName,
        avatarUrl: developer?.avatarUrl ?? FALLBACK_DEVELOPER.avatarUrl,
      },
    }
  } catch {
    return { club: FALLBACK_CLUB, developer: FALLBACK_DEVELOPER }
  }
}

export async function Footer() {
  const { club, developer } = await getFooterIdentities()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + social */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" strokeWidth={1.5} />
              </span>
              <span className="font-heading text-lg font-semibold">{SITE_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The official academic and community portal for the Department of
              Computer Science and Engineering, Uttara University.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${CLUB_CONTACT_EMAIL}`}
                aria-label="Email the CSE Student Association"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail className="size-4" strokeWidth={1.5} />
              </a>
              <a
                href={CLUB_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CSE Student Association on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <FacebookIcon className="size-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore" className="space-y-4">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Portal */}
          <nav aria-label="Portal" className="space-y-4">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Portal
            </h3>
            <ul className="space-y-2.5">
              {PORTAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Credits — right column: developer first, then club + contact */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Developed by
              </h3>
              <Link
                href={`/experts/${DEVELOPER_PROFILE_ID}`}
                aria-label={`${developer.fullName} — view profile`}
                className="group flex items-center gap-3 rounded-2xl border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)]"
              >
                <Avatar className="size-11 shrink-0 border border-border">
                  {developer.avatarUrl ? (
                    <AvatarImage src={developer.avatarUrl} alt={developer.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {initials(developer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {developer.fullName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    View developer profile
                  </span>
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Featured by
              </h3>
              <Link
                href={`/clubs/${FEATURED_CLUB_ID}`}
                className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)]"
              >
                <Avatar className="size-11 shrink-0 border border-border">
                  {club.logoUrl ? (
                    <AvatarImage src={club.logoUrl} alt={`${club.name} logo`} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {initials(club.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{club.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    Uttara University
                  </span>
                </span>
              </Link>
              <ul className="space-y-2.5 pt-1 text-sm text-muted-foreground">
                <li>
                  <a
                    href={`mailto:${CLUB_CONTACT_EMAIL}`}
                    className="inline-flex max-w-full items-center gap-2 transition-colors hover:text-primary"
                  >
                    <Mail className="size-4 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{CLUB_CONTACT_EMAIL}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={CLUB_FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <FacebookIcon className="size-4 shrink-0" />
                    <span>Follow us on Facebook</span>
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>Dept. of CSE, Uttara University, Dhaka</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            © {year} {SITE_NAME} · Dept. of CSE, Uttara University
          </p>
        </div>
      </div>
    </footer>
  )
}
