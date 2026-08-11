type Listener = () => void

let pending = false
const listeners = new Set<Listener>()

export function setSearchPending(value: boolean): void {
  pending = value
  for (const listener of listeners) listener()
}

export function getSearchPending(): boolean {
  return pending
}

export function subscribeSearchPending(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
