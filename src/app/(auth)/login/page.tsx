import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "Log in",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const redirectTo = safeCallbackUrl(callbackUrl)

  const session = await auth()
  if (session?.user) redirect(redirectTo)

  return <LoginForm callbackUrl={redirectTo} />
}
