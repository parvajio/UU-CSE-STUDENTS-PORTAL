"use client"

import Link from "next/link"
import { Globe, Code2, Contact, Link2, MessageCircle } from "lucide-react"

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
    { label: "LinkedIn", href: linkedinUrl, icon: Contact },
    { label: "GitHub", href: githubUrl, icon: Code2 },
    { label: "Portfolio", href: portfolioUrl, icon: Globe },
    { label: "Facebook", href: facebookUrl, icon: Link2 },
    {
      label: "WhatsApp",
      href: whatsappNumber
        ? whatsappNumber.startsWith("http")
          ? whatsappNumber
          : `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
        : null,
      icon: MessageCircle,
    },
  ].filter((item): item is { label: string; href: string; icon: typeof Globe } => Boolean(item.href))

  if (links.length === 0) return null

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {links.map((link) => {
        const Icon = link.icon
        return (
          <Link
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="size-4" strokeWidth={1.5} />
          </Link>
        )
      })}
    </div>
  )
}
