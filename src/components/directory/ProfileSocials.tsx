"use client"

import Link from "next/link"
import { Globe, MessageCircle } from "lucide-react"

function GithubSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

type ProfileSocialsProps = {
  facebookUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  portfolioUrl?: string | null
  whatsappNumber?: string | null
}

export function ProfileSocials({
  facebookUrl,
  linkedinUrl,
  githubUrl,
  portfolioUrl,
  whatsappNumber,
}: ProfileSocialsProps) {
  const links = [
    { label: "LinkedIn", href: linkedinUrl, icon: LinkedinSvg, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
    { label: "GitHub", href: githubUrl, icon: GithubSvg, color: "text-zinc-900 dark:text-zinc-100 bg-zinc-500/10 border-zinc-500/30 hover:bg-zinc-500/20" },
    { label: "Portfolio", href: portfolioUrl, icon: Globe, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" },
    { label: "Facebook", href: facebookUrl, icon: FacebookSvg, color: "text-blue-500 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
    {
      label: "WhatsApp",
      href: whatsappNumber
        ? whatsappNumber.startsWith("http")
          ? whatsappNumber
          : `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
        : null,
      icon: MessageCircle,
      color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20",
    },
  ].filter((item): item is { label: string; href: string; icon: typeof Globe; color: string } => Boolean(item.href))

  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {links.map((link) => {
        const Icon = link.icon
        return (
          <Link
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105 shadow-xs ${link.color}`}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
