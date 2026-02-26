"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Save, BookOpen } from "lucide-react"

type EditorProps = {
  courseId?: string
  courseTitle?: string
  course?: any
}

type Student = {
  _id?: string
  name?: string
  username?: string
  grade?: string
  role?: string
  email?: string
}

function safeJsonParse(v: any) {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function getCurrentStudent(): Student | null {
  const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed) return null
  return {
    _id: parsed._id || parsed.id,
    name: parsed.name || parsed.uName || parsed.fullName,
    username: parsed.username,
    grade: parsed.grade || parsed.studentGrade,
    role: parsed.role,
    email: parsed.email || parsed.studentEmail,
  }
}

function normalizeCourseMeta(courseTitle?: string, course?: any) {
  const title = String(courseTitle || course?.title || "App Lab").trim() || "App Lab"
  const difficulty = String(course?.difficulty || "Intermediate")
  const category = String(course?.category || "App Development")
  return { title, difficulty, category }
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function AppLabEditor({ courseId, courseTitle, course }: EditorProps) {
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [projectTitle, setProjectTitle] = useState("")
  const [saving, setSaving] = useState(false)

  // Keep App Lab target (you can change later if needed)
  const appLabUrl = useMemo(() => "https://studio.code.org/projects/applab/new", [])
  const meta = useMemo(() => normalizeCourseMeta(courseTitle, course), [courseTitle, course])

  useEffect(() => {
    setStudent(getCurrentStudent())
  }, [])

  const handleSaveProject = async () => {
    const s = student || getCurrentStudent()
    if (!s?.username) {
      toast.error("Student session not found. Please login again.")
      router.replace("/auth")
      return
    }

    const title = projectTitle.trim() || `${meta.title} Project`

    const payload = {
      _id: (globalThis.crypto?.randomUUID?.() ?? `p_${Date.now()}`) as string,
      _creationTime: String(Date.now()),
      title,
      courseId: String(courseId || course?._id || ""),
      pLanguage: "applab",
      projectUrl: appLabUrl,
      codeContent: "",
      cStatus: "saved",
      submissionDate: new Date().toISOString(),

      studentId: String(s._id || ""),
      studentName: String(s.name || ""),
      studentEmail: String(s.email || ""),
      studentGrade: String(s.grade || ""),
      username: String(s.username || ""),
    }

    try {
      setSaving(true)
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)

      if (!res.ok || !data?.ok) {
        toast.error(data?.message || "Failed to save project")
        return
      }

      toast.success("Project saved ✅")
    } catch (e) {
      console.error(e)
      toast.error("Network/server error while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Header (aligned like CodePen editors) */}
      <header className="bg-[#0b1220]/80 backdrop-blur sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left: Back + Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              <div>
                <h1 className="text-xl font-bold text-white">{meta.title}</h1>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Badge className="bg-blue-600/90 text-white border-0" variant="secondary">
                    {meta.difficulty}
                  </Badge>
                  <span>{meta.category}</span>
                </div>
              </div>
            </div>

            {/* Right: Quiz + Save Project (colors like CodePen header) */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-blue-500/60 text-blue-200 bg-transparent hover:bg-blue-500/10"
                onClick={() => toast.info("Quiz coming next")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quiz
              </Button>

              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveProject} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Body (kept similar to your expected App Lab layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-xl font-semibold">App Lab Project</div>
          </div>

          <input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Enter your app project title..."
            className="w-full max-w-xl rounded-md bg-white/5 border border-white/10 px-4 py-2 text-sm outline-none focus:border-emerald-400"
          />

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="font-medium text-white/90">Thunkable App Builder</div>
              <a
                href={appLabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2 rounded-md"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
            </div>

            <div className="bg-black/30">
              <iframe
                title="App Lab"
                src={appLabUrl}
                className="w-full h-[520px]"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>

          <div className="mt-6">
            <Link href="/dashboard" className="text-emerald-300 hover:text-emerald-200 underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}