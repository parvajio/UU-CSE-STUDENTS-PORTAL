"use client"

import { CheckCircle2, Ticket, Copy, Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface Binary26SuccessModalProps {
  ticketNumber: string
  onClose: () => void
}

export function Binary26SuccessModal({ ticketNumber, onClose }: Binary26SuccessModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 space-y-6">
        
        {/* Header icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-foreground">
            Registration Successful!
          </h3>
          <p className="text-sm text-muted-foreground">
            Your Binary 26 ticket has been generated. Status is currently flagged as <span className="font-semibold text-amber-500 uppercase">Unpaid</span>.
          </p>
        </div>

        {/* Ticket Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Ticket ID</span>
              <span className="text-lg font-mono font-bold text-foreground tracking-wider">{ticketNumber}</span>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-lg bg-surface border border-border hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground"
            title="Copy Ticket ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 space-y-2">
          <div>
            <p className="font-semibold">Offline Payment Instructions:</p>
            <p>Please pay offline at the <strong>5th floor</strong> using your ticket ID (<strong>{ticketNumber}</strong>) to confirm your registration. Once verified by a moderator, your status will update to Paid.</p>
          </div>
          <div className="border-t border-amber-500/20 pt-2">
            <p className="font-semibold">অফলাইন পেমেন্ট নির্দেশনা:</p>
            <p>আপনার টিকেট আইডি (<strong>{ticketNumber}</strong>) ব্যবহার করে ৫ তলায় অফলাইন পেমেন্ট সম্পন্ন করুন। মডারেটর কর্তৃক যাচাই করার পর আপনার স্ট্যাটাস পেইড (Paid) হিসেবে আপডেট হবে।</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-accent transition-all text-sm text-center"
          >
            Close
          </button>
          <Link
            href="/profile"
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-all text-sm text-center inline-flex items-center justify-center gap-1.5"
          >
            <span>View in Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
