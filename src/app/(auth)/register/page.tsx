import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Create an account",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const redirectTo = safeCallbackUrl(callbackUrl)

  const session = await auth()
  if (session?.user) redirect(redirectTo)

  return <RegisterForm callbackUrl={redirectTo} />
}
