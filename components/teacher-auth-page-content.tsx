"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "login" | "register"

export default function TeacherAuthPageContent() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")

  // shared
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // register-only
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const u = username.trim()
    if (!u || !password) {
      setError("Please enter username and password.")
      return
    }

    if (mode === "register") {
      if (!fullName.trim() || !email.trim()) {
        setError("Please enter full name and email.")
        return
      }
    }

    try {
      setLoading(true)
      const endpoint = mode === "login" ? "/api/auth/teacher/login" : "/api/auth/teacher/register"
      const body =
        mode === "login"
          ? { username: u, password }
          : { fullName: fullName.trim(), email: email.trim(), username: u, password }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Request failed.")
        return
      }

      if (mode === "register") {
        setSuccess("Teacher account created. You can now login (or wait for approval if required).")
        setMode("login")
        setPassword("")
        return
      }

      // login success
      router.replace("/teacher") // change later if your teacher dashboard route is different
    } catch (err) {
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Top header (centered like screenshot) */}
      <div className="pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <img
            src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
            alt="JSPS Logo"
            className="w-9 h-9 object-contain"
          />
          <div>
            <div className="text-2xl font-bold text-gray-900">Juja St. Peters School</div>
            <div className="text-sm text-gray-600 -mt-0.5">Teacher Portal</div>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-xl shadow-lg p-10">
            {/* small logo in green circle */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center">
                <img
                  src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                  alt="JSPS"
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>

            <h1 className="text-center text-3xl font-extrabold text-gray-900 mt-6">Teacher Access</h1>
            <p className="text-center text-sm text-gray-600 mt-2">
              Login or register to access your teacher dashboard
            </p>

            {/* Tabs like screenshot */}
            <div className="mt-6 bg-gray-100 rounded-lg p-1 grid grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setError(null)
                  setSuccess(null)
                }}
                className={`py-2 rounded-md text-sm transition ${
                  mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register")
                  setError(null)
                  setSuccess(null)
                }}
                className={`py-2 rounded-md text-sm transition ${
                  mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose username"
                        autoComplete="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "login" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {mode === "login" ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {loading ? "Signing In..." : "Sign In"}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {loading ? "Creating..." : "Create Teacher Account"}
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link href="/" className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}