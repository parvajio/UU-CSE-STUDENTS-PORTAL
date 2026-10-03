import Link from "next/link"
import {
  ArrowUpRight,
  GraduationCap,
  Mail,
  MapPin,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SITE_NAME } from "../../../config/site"
import { db } from "@/lib/db"
import { clubs } from "@/lib/db/schema/clubs"
import { profiles } from "@/lib/db/schema/profiles"
import { eq } from "drizzle-orm"
import { BackToTopButton, CopyEmailButton } from "./FooterActions"

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

// Same order as the navbar so the footer feels predictable.
const EXPLORE_LINKS = [
  { href: "/experts", label: "Experts" },
  { href: "/faculty", label: "Faculty" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/routine", label: "Routine" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/binary-26", label: "Binary 26" },
]

const GET_STARTED_LINKS = [
  { href: "/upload-question", label: "Contribute questions" },
  { href: "/my-submissions", label: "My submissions" },
  { href: "/register", label: "Create account" },
  { href: "/login", label: "Log in" },
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

const sectionHeadingClass =
  "font-heading text-xs font-semibold uppercase tracking-wider text-foreground"

const footerLinkClass =
  "inline-flex items-center rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline hover:decoration-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const socialButtonClass =
  "flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"

export async function Footer() {
  const { club, developer } = await getFooterIdentities()
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border bg-surface text-foreground">
      {/* Signature gradient hairline — the footer's one distinguishing treatment. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-primary"
      />

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:pt-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1.4fr] lg:gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" strokeWidth={1.5} />
              </span>
              <span className="font-heading text-lg font-semibold">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The official academic and community portal for the Department
              of Computer Science and Engineering, Uttara University.
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
              <span>Dept. of CSE, Uttara University, Dhaka</span>
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={`mailto:${CLUB_CONTACT_EMAIL}`}
                aria-label="Email the CSE Student Association"
                title="Email us"
                className={socialButtonClass}
              >
                <Mail className="size-4" strokeWidth={1.5} />
              </a>
              <a
                href={CLUB_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CSE Student Association on Facebook (opens in a new tab)"
                title="Follow us on Facebook"
                className={socialButtonClass}
              >
                <FacebookIcon className="size-4" />
              </a>
            </div>
          </div>

          {/* Explore — mirrors the navbar order */}
          <nav aria-label="Explore">
            <h2 className={sectionHeadingClass}>Explore</h2>
            <ul className="mt-4 space-y-1">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`${footerLinkClass} px-0 py-1`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Get started */}
          <nav aria-label="Get started">
            <h2 className={sectionHeadingClass}>Get started</h2>
            <ul className="mt-4 space-y-1">
              {GET_STARTED_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`${footerLinkClass} px-0 py-1`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-[22ch] text-xs leading-relaxed text-muted-foreground">
              New here? Create an account to unlock downloads and
              contributions.
            </p>
          </nav>

          {/* Contact + credits — one consolidated card */}
          <div>
            <h2 className={sectionHeadingClass}>Contact & credits</h2>
            <address
              className="mt-4 space-y-3 rounded-2xl border border-border bg-background p-4 not-italic [box-shadow:var(--card-shadow)]"
            >
              <Link
                href={`/experts/${DEVELOPER_PROFILE_ID}`}
                aria-label={`${developer.fullName} — view developer profile`}
                className="group flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-10 shrink-0 border border-border">
                  {developer.avatarUrl ? (
                    <AvatarImage src={developer.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(developer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Developed by
                  </span>
                  <span className="block truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {developer.fullName}
                  </span>
                </span>
                <ArrowUpRight
                  className="ml-auto size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={1.5}
                />
              </Link>

              <div aria-hidden="true" className="border-t border-border" />

              <Link
                href={`/clubs/${FEATURED_CLUB_ID}`}
                aria-label={`${club.name} — view club page`}
                className="group flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-10 shrink-0 border border-border">
                  {club.logoUrl ? (
                    <AvatarImage src={club.logoUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(club.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Featured by
                  </span>
                  <span className="block truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {club.name}
                  </span>
                </span>
                <ArrowUpRight
                  className="ml-auto size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={1.5}
                />
              </Link>

              <div aria-hidden="true" className="border-t border-border" />

              <div className="flex items-center gap-1 rounded-xl px-1 py-0.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <a
                  href={`mailto:${CLUB_CONTACT_EMAIL}`}
                  className="min-w-0 flex-1 truncate text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CLUB_CONTACT_EMAIL}
                </a>
                <CopyEmailButton email={CLUB_CONTACT_EMAIL} />
              </div>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left">
            © {year} {SITE_NAME} · Dept. of CSE, Uttara University
          </p>
          <div className="order-1 sm:order-2">
            <BackToTopButton />
          </div>
        </div>
      </div>
    </footer>
  )
}
