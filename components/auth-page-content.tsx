"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type StudentSession = {
  _id?: string
  name?: string
  username: string
  grade?: string
  role?: string
}

export default function AuthPageContent() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already logged in (local session), go straight to dashboard
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser")
      if (!raw) return
      const u = JSON.parse(raw)
      if (u?.username) router.replace("/dashboard")
    } catch {
      // ignore
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const u = username.trim()
    if (!u || !password) {
      setError("Please enter your username and password.")
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Login failed.")
        return
      }

      // Persist a local session so /dashboard doesn't bounce back to /auth
      const session: StudentSession =
        data?.user && typeof data.user === "object"
          ? {
              _id: data.user._id,
              name: data.user.name ?? data.user.uName ?? data.user.studentName,
              username: data.user.username ?? data.user.uUsername ?? u,
              grade: data.user.grade ?? data.user.studentGrade,
              role: data.user.role,
            }
          : { username: u }

      localStorage.setItem("currentUser", JSON.stringify(session))

      router.replace("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header (matches your previous look) */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <img
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                alt="Juja St. Peters School Logo"
                className="w-6 h-6 rounded object-contain"
              />
              <span className="text-lg font-semibold text-emerald-700">Juja St. Peters School</span>
            </div>

            <Link href="/" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-lg px-10 py-8">
            <div className="flex flex-col items-center text-center">
              <img
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                alt="JSPS Logo"
                className="w-14 h-14 object-contain mb-3"
              />
              <h2 className="text-xl font-bold text-emerald-700">Juja St. Peters School</h2>
              <p className="text-xs text-gray-500 mt-1">
                Welcome back! Enter your username to continue learning.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-10"
                />
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-300 hover:bg-emerald-400 text-white font-medium"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-600">Don't have an account?</p>
                <Link href="/auth/register" className="text-xs text-blue-600 hover:underline">
                  Create Account
                </Link>
              </div>
            </form>
          </div>

          {/* Bottom info card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Welcome to Juja St. Peters School</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your account or sign in to access your personalized coding courses.
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Secure Login
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Password Protected
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Grade-Based Courses
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}