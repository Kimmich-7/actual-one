import type { Metadata } from "next"
import SchoolLoginContent from "@/components/school-login-content"

export const metadata: Metadata = {
  title: "School Admin Login - Juja St. Peters School",
  description: "School admin access for the school dashboard.",
}

export default function SchoolLoginPage() {
  return <SchoolLoginContent />
}