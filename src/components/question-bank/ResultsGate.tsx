"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import { ResultsSkeleton } from "@/components/question-bank/ResultsSkeleton"
import {
  getSearchPending,
  setSearchPending,
  subscribeSearchPending,
} from "@/lib/question-bank/search-pending"

export function ResultsGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const pending = useSyncExternalStore(
    subscribeSearchPending,
    getSearchPending,
    getSearchPending
  )

  // `router.replace` returns void in Next 15, so a landing URL change is the
  // signal that the search finished (covers filter commits, back/forward,
  // the Clear-all link and pagination).
  useEffect(() => {
    setSearchPending(false)
  }, [searchParams])

  if (pending) {
    return <ResultsSkeleton ariaBusy />
  }

  return children
}
