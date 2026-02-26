"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Mode = "login" | "register"

export default function ParentAuthPageContent() {
  const router = useRouter()
  const grades = useMemo(() => Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`), [])

  const [mode, setMode] = useState<Mode>("login")

  // shared
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // register-only parent fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  // register-only student linking fields (as in your screenshot)
  const [studentGrade, setStudentGrade] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [studentUsername, setStudentUsername] = useState("")

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
      if (!studentGrade || !studentUsername.trim()) {
        setError("Please enter the student's grade and username for linking.")
        return
      }
    }

    try {
      setLoading(true)
      const endpoint = mode === "login" ? "/api/auth/parent/login" : "/api/auth/parent/register"
      const body =
        mode === "login"
          ? { username: u, password }
          : {
              fullName: fullName.trim(),
              email: email.trim(),
              username: u,
              password,
              studentGrade,
              studentClass: studentClass.trim(),
              studentUsername: studentUsername.trim(),
            }

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
        setSuccess("Parent account created. You can now login.")
        setMode("login")
        setPassword("")
        return
      }

      // login success
      router.replace("/parent") // adjust later if your parent dashboard route differs
    } catch {
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Centered header like screenshot */}
      <div className="pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <img
            src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
            alt="JSPS Logo"
            className="w-9 h-9 object-contain"
          />
          <div>
            <div className="text-2xl font-bold text-gray-900">Juja St. Peters School</div>
            <div className="text-sm text-gray-600 -mt-0.5">Parent Portal</div>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-xl shadow-lg p-10">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center">
                <img
                  src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                  alt="JSPS"
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>

            <h1 className="text-center text-3xl font-extrabold text-gray-900 mt-6">Parent Access</h1>
            <p className="text-center text-sm text-gray-600 mt-2">
              Login or register to view your child&apos;s progress
            </p>

            {/* Tabs */}
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
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="pt-2">
                    <div className="text-xs text-gray-600 mb-2">Student Information (for account linking)</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Student&apos;s Grade</Label>
                        <Select value={studentGrade} onValueChange={setStudentGrade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentClass">Student&apos;s Class</Label>
                        <Input
                          id="studentClass"
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                          placeholder="e.g., Grade 5A"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="studentUsername">Student&apos;s Username</Label>
                      <Input
                        id="studentUsername"
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="Student's login username"
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
                    {loading ? "Creating..." : "Create Parent Account"}
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