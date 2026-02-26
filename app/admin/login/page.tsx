import type { Metadata } from "next"
import AdminLoginContent from "@/components/admin-login-content"

export const metadata: Metadata = {
  title: "Admin Login - Juja St. Peters School",
  description: "Admin portal login.",
}

export default function AdminLoginPage() {
  return <AdminLoginContent />
}