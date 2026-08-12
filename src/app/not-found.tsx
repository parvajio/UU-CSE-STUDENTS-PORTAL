import Link from "next/link"
import { Home, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
        <FileQuestion className="size-8" strokeWidth={1.5} />
      </div>
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Button asChild variant="default">
          <Link href="/">
            <Home className="mr-2 size-4" strokeWidth={1.5} />
            Back to Home
          </Link>
        </Button>
      </div>
    </main>
  )
}
