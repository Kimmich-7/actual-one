"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SchoolLoginContent() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const u = username.trim()
    if (!u || !password) {
      setError("Enter School Admin username and password.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/school/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Login failed.")
        return
      }

      router.replace("/school")
    } catch (err) {
      console.error(err)
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Header like other portals */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3">
          <img
            src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
            alt="Juja St. Peters School"
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Juja St. Peters School</h1>
            <p className="text-sm text-gray-600">School Dashboard</p>
          </div>
        </div>
      </div>

      {/* Card */}
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
          School Admin Portal
        </h2>
        <p className="text-center text-sm text-gray-600 mt-2">
          Juja St. Peters School - School Dashboard
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter School Admin Username"
              autoComplete="username"
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
                placeholder="Enter School Admin Password"
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
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}