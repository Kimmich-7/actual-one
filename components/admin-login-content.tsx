"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginContent() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already authenticated, go to admin area
  useEffect(() => {
    const stored = localStorage.getItem("adminUser")
    if (stored) router.replace("/admin/overview")
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const e1 = email.trim()
    if (!e1 || !password) {
      setError("Enter email and password.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e1, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Login failed.")
        return
      }

      // Store for client-side admin layout checks
      localStorage.setItem("adminUser", JSON.stringify({ role: "admin", email: e1 }))

      router.replace("/admin/overview")
    } catch (err) {
      console.error(err)
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg px-8 py-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center">
            <img
              src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
              alt="JSPS"
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>

        <h2 className="text-center text-2xl font-extrabold text-gray-900 mt-6">
          Admin Portal
        </h2>
        <p className="text-center text-sm text-gray-600 mt-2">
          Juja St. Peters School - Administrative Dashboard
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Admin Email"
              autoComplete="username"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-emerald-700 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}