import type { Metadata } from "next"
import AuthRegisterContent from "@/components/auth-register-content"

export const metadata: Metadata = {
  title: "Create Account - Juja St. Peters School",
  description: "Create your Juja St. Peters School coding platform account.",
}

export default function RegisterPage() {
  return <AuthRegisterContent />
}