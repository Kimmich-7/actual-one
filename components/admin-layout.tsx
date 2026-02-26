"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, LogOut, School, UserPlus, Users } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const verify = async () => {
      try {
        // 1) client check (fast)
        const storedAdmin = localStorage.getItem("adminUser")
        if (!storedAdmin) {
          setIsAdmin(false)
          return
        }

        const admin = JSON.parse(storedAdmin)
        if (admin?.role !== "admin") {
          setIsAdmin(false)
          return
        }

        // 2) server check (cookie-based; prevents fake localStorage)
        const res = await fetch("/api/auth/admin/me", { cache: "no-store" })
        const data = await res.json().catch(() => null)

        if (res.ok && data?.authenticated === true) {
          setIsAdmin(true)
          return
        }

        setIsAdmin(false)
      } catch (error) {
        console.error("Admin verify failed:", error)
        setIsAdmin(false)
      } finally {
        setChecking(false)
      }
    }

    verify()
  }, [])

  // Redirect after check completes
  useEffect(() => {
    if (!checking && !isAdmin) {
      localStorage.removeItem("adminUser")
      router.replace("/admin/login")
    }
  }, [checking, isAdmin, router])

  const handleLogout = async () => {
    // best-effort: clear cookie if you later add /api/auth/admin/logout
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" })
    } catch {}

    localStorage.removeItem("adminUser")
    setIsAdmin(false)
    router.replace("/admin/login")
  }

  // Loader while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Redirecting
  if (!isAdmin) return null

  const navigationItems = [
    { href: "/admin/overview", label: "School Overview", icon: School },
    { href: "/admin/pending", label: "Pending Students", icon: Users },
    { href: "/admin/students", label: "Manage Students", icon: UserPlus },
    { href: "/admin/classes", label: "Class Management", icon: GraduationCap },
    { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/admin/parents", label: "Parents", icon: Users },
    { href: "/admin/quizzes", label: "Quizzes", icon: BookOpen },
    { href: "/admin/projects", label: "Projects", icon: BookOpen },
    { href: "/admin/notes", label: "Course Notes", icon: BookOpen },
    { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                alt="Juja St. Peters School Logo"
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Juja St. Peters School</h1>
                <p className="text-sm text-gray-600">Admin Portal</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-lg p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                      isActive ? "bg-green-100 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}