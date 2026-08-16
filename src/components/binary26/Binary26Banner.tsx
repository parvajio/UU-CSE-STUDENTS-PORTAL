"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, Sparkles, ArrowRight, Ticket } from "lucide-react"

interface Binary26BannerProps {
  eventTime: string
  title: string
  location: string
}

export function Binary26Banner({ eventTime, title, location }: Binary26BannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const target = new Date(eventTime).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [eventTime])

  return (
    <section className="py-8 bg-gradient-to-r from-primary/10 via-secondary/15 to-primary/5 border-y border-primary/20 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left Info */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide border border-primary/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Binary 26 Event</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{location}</span>
              <span className="mx-1">•</span>
              <Clock className="w-4 h-4 text-primary" />
              <span>{new Date(eventTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>

          {/* Center Timer */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm border border-border px-3 py-2 rounded-xl min-w-[60px] shadow-sm">
              <span className="text-xl font-bold font-heading text-primary">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Days</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">:</span>
            <div className="flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm border border-border px-3 py-2 rounded-xl min-w-[60px] shadow-sm">
              <span className="text-xl font-bold font-heading text-primary">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">:</span>
            <div className="flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm border border-border px-3 py-2 rounded-xl min-w-[60px] shadow-sm">
              <span className="text-xl font-bold font-heading text-primary">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Mins</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">:</span>
            <div className="flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm border border-border px-3 py-2 rounded-xl min-w-[60px] shadow-sm">
              <span className="text-xl font-bold font-heading text-primary">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Secs</span>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/binary-26"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-[0_2px_10px_rgba(91,95,239,0.3)] hover:bg-primary-hover transition-all text-sm"
            >
              <Ticket className="w-4 h-4" />
              <span>Get Ticket & Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
