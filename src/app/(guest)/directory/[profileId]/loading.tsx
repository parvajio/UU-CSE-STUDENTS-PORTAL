export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16 animate-pulse">
      <div className="h-48 sm:h-60 w-full bg-muted" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
        <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-6">
            <div className="size-24 sm:size-28 rounded-full bg-muted" />
            <div className="space-y-3 flex-1">
              <div className="h-8 w-1/3 bg-muted rounded-md" />
              <div className="h-4 w-1/4 bg-muted rounded-md" />
              <div className="h-6 w-1/2 bg-muted rounded-md" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 rounded-2xl bg-muted/60" />
          <div className="h-96 rounded-2xl bg-muted/60" />
        </div>
      </div>
    </div>
  )
}
