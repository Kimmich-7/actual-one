import type { Metadata } from "next"
import TeacherAuthPageContent from "@/components/teacher-auth-page-content"

export const metadata: Metadata = {
  title: "Teacher Login - Juja St. Peters School",
  description: "Teacher portal access for Juja St. Peters School coding platform.",
}

export default function TeacherLoginPage() {
  return <TeacherAuthPageContent />
}