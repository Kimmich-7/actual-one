import type { Metadata } from "next"
import ParentAuthPageContent from "@/components/parent-auth-page-content"

export const metadata: Metadata = {
  title: "Parent Login - Juja St. Peters School",
  description: "Parent portal access for Juja St. Peters School coding platform.",
}

export default function ParentLoginPage() {
  return <ParentAuthPageContent />
}