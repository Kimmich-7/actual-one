"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AuthRegisterContent() {
  const grades = useMemo(() => Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`), [])
  const classes = useMemo(() => ["A", "B", "C", "D"].map((c) => `Grade Class ${c}`), [])

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [grade, setGrade] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [school, setSchool] = useState("Juja St. Peters School")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const name = fullName.trim()
    const u = username.trim()

    if (!name || !u || !password || !grade) {
      setError("Please fill in Full Name, Username, Password, and Grade Level.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          username: u,
          password,
          grade,
          class: studentClass || grade, // fallback to grade if class not selected
          school,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Registration failed.")
        return
      }

      setSuccess("Account created successfully. Please sign in (or wait for approval if required).")
      setFullName("")
      setUsername("")
      setPassword("")
      setGrade("")
      setStudentClass("")
      setSchool("Juja St. Peters School")
    } catch (err) {
      setError("Network/server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
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

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Register Card */}
          <div className="bg-white rounded-lg shadow-lg px-10 py-8">
            <div className="flex flex-col items-center text-center">
              <img
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png"
                alt="JSPS Logo"
                className="w-10 h-10 object-contain mb-3"
              />
              <h2 className="text-lg font-bold text-emerald-700">Juja St. Peters School</h2>
              <p className="text-xs text-gray-500 mt-1">Create your account to start your coding journey</p>
            </div>

            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-700" htmlFor="fullName">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-700" htmlFor="username">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="h-9"
                  autoComplete="username"
                />
                <p className="text-[10px] text-gray-400">This will be used to log in to your account</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-700" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="h-9"
                  autoComplete="new-password"
                />
                <p className="text-[10px] text-gray-400">Choose a strong password to secure your account</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-700">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select your grade" />
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
                <Label className="text-xs text-gray-700">Class (Optional)</Label>
                <Select value={studentClass} onValueChange={setStudentClass}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select your class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* If you prefer actual class names, tell me what your school uses and I’ll match it */}
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400">
                  If your class is not listed, leave this blank or contact your administrator
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-700" htmlFor="school">
                  School
                </Label>
                <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} className="h-9" />
              </div>

              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
              {success && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  {success}{" "}
                  <Link href="/auth" className="underline">
                    Sign In
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-emerald-300 hover:bg-emerald-400 text-white font-medium"
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-600">Already have an account?</p>
                <Link href="/auth" className="text-xs text-blue-600 hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </div>

          {/* Bottom info card (same style as your login page) */}
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