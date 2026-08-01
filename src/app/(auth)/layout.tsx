import { GraduationCap } from "lucide-react"
import { SITE_NAME } from "../../../config/site"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" strokeWidth={1.5} />
          </span>
          <p className="font-heading text-xl font-semibold text-foreground">
            {SITE_NAME}
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
