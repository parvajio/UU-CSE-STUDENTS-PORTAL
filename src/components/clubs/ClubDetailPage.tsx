"use client"

import React from "react"

import { ClubMembers } from "./ClubMembers"
import { ClubGallery } from "./ClubGallery"
import { ClubAchievements } from "./ClubAchievements"
import { EventTimer } from "./EventTimer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { linkifyText } from "@/lib/linkify"

interface ClubMember {
  profileId: string
  avatarUrl: string | null
  fullName: string
  roleInClub: string
  position: string | null
  designation: string | null
}

interface ClubDetailData {
  club: {
    id: string
    name: string
    description?: string | null
    logoUrl?: string | null
    coverImgUrl?: string | null
    msgGroupUrl?: string | null
    pageUrl?: string | null
    fbGroupUrl?: string | null
    contacts?: string | null
    mail?: string | null
    department: { name: string }
  }
  members: ClubMember[]
  albums: Array<{
    id: string
    title: string
    description?: string | null
    images: Array<{
      id: string
      imageUrl: string
      caption?: string | null
      displayOrder: number
    }>
  }>
  achievements: Array<{
    id: string
    title: string
    description?: string | null
    date?: string | null
    imageUrl?: string | null
    linkUrl?: string | null
  }>
  events: Array<{
    id: string
    name: string
    place?: string | null
    description?: string | null
    date: string
    startTime?: string | null
    endTime?: string | null
    status: string
  }>
}

function renderDescription(text: string | null | undefined) {
  if (!text) return null
  // URL auto-detection (FR-013, SC-006) via the shared linkify util.
  return (
    <div className="text-sm text-muted-foreground space-y-2">
      {linkifyText(text).map((node, i) => (
        <React.Fragment key={i}>{node}</React.Fragment>
      ))}
    </div>
  )
}

export function ClubDetailPage({ data }: { data: ClubDetailData }) {
  const { club, members, albums, achievements, events } = data

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface mb-8">
        {club.coverImgUrl && (
          <img
            src={club.coverImgUrl}
            alt={club.name}
            className="w-full h-48 object-cover rounded-t-2xl"
          />
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="w-20 h-20 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-heading font-bold">
                {club.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-heading text-3xl font-bold text-foreground">
                {club.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {club.department.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Links */}
      <section className="mb-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          About
        </h2>
        {club.description && renderDescription(club.description)}
        <div className="flex flex-wrap gap-2">
          {club.msgGroupUrl && (
            <a
              href={club.msgGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-foreground hover:bg-accent transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Message Group <ExternalLink className="size-3" />
            </a>
          )}
          {club.pageUrl && (
            <a
              href={club.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-foreground hover:bg-accent transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Page <ExternalLink className="size-3" />
            </a>
          )}
          {club.fbGroupUrl && (
            <a
              href={club.fbGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-foreground hover:bg-accent transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Facebook <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Members ({members.length})
        </h2>
        <ClubMembers members={members} />
      </section>

      {/* Gallery */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Gallery
        </h2>
        <ClubGallery albums={albums} />
      </section>

      {/* Achievements */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Achievements
        </h2>
        <ClubAchievements achievements={achievements} />
      </section>

      {/* Events */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Events ({events.length})
        </h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events yet.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground">
                        {event.name}
                      </h3>
                      {event.place && (
                        <p className="text-sm text-muted-foreground">{event.place}</p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {linkifyText(event.description).map((node, i) => (
                            <React.Fragment key={i}>{node}</React.Fragment>
                          ))}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <EventTimer
                        endTime={event.endTime}
                        startTime={event.startTime}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
