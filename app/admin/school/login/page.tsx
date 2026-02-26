import type { Metadata } from "next"
import SchoolDashboardLoginContent from "@/components/school-dashboard-login-content"

export const metadata: Metadata = {
  title: "School Dashboard Login - Juja St. Peters School",
  description: "School dashboard access login.",
}

export default function SchoolDashboardLoginPage() {
  return <SchoolDashboardLoginContent />
}