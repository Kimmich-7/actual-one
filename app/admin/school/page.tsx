"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SchoolDashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/school-dashboard/me", { cache: "no-store" })
        const data = await res.json().catch(() => null)

        if (!res.ok || !data?.authenticated) {
          router.replace("/admin/school/login")
          return
        }
      } catch (e) {
        router.replace("/admin/school/login")
        return
      } finally {
        setChecking(false)
      }
    }

    run()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying school dashboard access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
        <p className="text-gray-600 mt-2">
          You’re logged in to the School Dashboard (separate from Admin Login).
        </p>
      </div>
    </div>
  )
}