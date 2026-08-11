"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function BatchCombobox({
  max,
  value,
  onValueChange,
  id,
  placeholder = "Search batch…",
  clearable = false,
}: {
  max: number
  value: number | undefined
  onValueChange: (value: number | undefined) => void
  id?: string
  placeholder?: string
  clearable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const options = useMemo(
    () => Array.from({ length: max }, (_, i) => i + 1),
    [max]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((batch) => String(batch).includes(q))
  }, [options, query])

  const [activeIndex, setActiveIndex] = useState(0)
  const safeActive = Math.min(activeIndex, Math.max(filtered.length - 1, 0))

  function commit(batch: number | undefined) {
    onValueChange(batch)
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(filtered.length - 1, index + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const match = filtered[safeActive]
      if (match) commit(match)
    } else if (event.key === "Escape" && open) {
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          aria-label="Batch"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            value == null && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {value != null ? `Batch ${value}` : "Select a batch…"}
          </span>
          {clearable && value != null ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selected batch"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                commit(undefined)
              }}
              className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" strokeWidth={1.5} />
            </span>
          ) : (
            <ChevronDown className="size-4 shrink-0 opacity-60" strokeWidth={1.5} />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content
        align="start"
        sideOffset={6}
        className="z-50 w-[var(--radix-popover-trigger-width)] max-w-full rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-md"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-label="Search batches"
            aria-controls="batch-combobox-list"
            aria-expanded
            aria-activedescendant={
              filtered[safeActive] != null
                ? `batch-option-${filtered[safeActive]}`
                : undefined
            }
            placeholder={placeholder}
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            inputMode="numeric"
          />
        </div>

        <div
          id="batch-combobox-list"
          role="listbox"
          aria-label="Search results"
          className="max-h-72 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No batches match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filtered.map((batch, index) => (
              <button
                key={batch}
                type="button"
                role="option"
                id={`batch-option-${batch}`}
                aria-selected={batch === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(batch)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                  index === safeActive && "bg-accent text-accent-foreground"
                )}
              >
                <span>{batch}</span>
                {batch === value ? (
                  <Check className="size-4 shrink-0" strokeWidth={1.5} />
                ) : null}
              </button>
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}