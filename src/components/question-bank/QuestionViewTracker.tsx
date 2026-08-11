"use client"

import { useEffect } from "react"

export function QuestionViewTracker({ questionId }: { questionId: string }) {
  useEffect(() => {
    void fetch(`/api/questions/${questionId}/view`, { method: "POST" }).catch(
      () => {}
    )
  }, [questionId])

  return null
}
