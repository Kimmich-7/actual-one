import type { Metadata } from "next"
import SchoolDashboardContent from "@/components/school-dashboard-content"

export const metadata: Metadata = {
  title: "School Dashboard - Juja St. Peters School",
}

export default function SchoolDashboardPage() {
  return <SchoolDashboardContent />
}