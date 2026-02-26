"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

import ScratchEditor from "@/components/scratch-editor"
import ScratchJuniorEditor from "@/components/scratch-junior-editor"
import AppLabEditor from "@/components/app-lab-editor"
import TypingSkillsEditor from "@/components/typing-skills-editor"
import MinecraftEditor from "@/components/minecraft-editor"
import CodePenEditor from "@/components/codepen-editor"
import RoboticsEditor from "@/components/robotics-editor"
import AcodeEditor from "@/components/acode-editor"
import PythonEditor from "@/components/python-editor"
import SpikeLegoEditor from "@/components/spike-lego-editor"

type Course = {
  _id: string
  title: string
  description?: string
  difficulty?: string
  category?: string
  availableForGrades: string[]
  [key: string]: any
}

function safeJsonParse(v: any) {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function normalizeGrade(raw: any): string {
  const s = String(raw ?? "").trim()
  if (!s) return "Grade 1"
  const m = s.match(/(\d+)/)
  if (m) return `Grade ${m[1]}`
  if (s.toLowerCase().startsWith("grade ")) return s.replace(/\s+/g, " ").trim()
  return s
}

function normalizeAvailableForGrades(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === "string") {
    const parsed = safeJsonParse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  }
  return []
}

function pickEditor(titleRaw: string) {
  const title = (titleRaw || "").toLowerCase()

  if (title.includes("scratch junior")) return ScratchJuniorEditor
  if (title.includes("scratch programming")) return ScratchEditor
  if (title === "scratch" || title.includes("scratch")) return ScratchEditor

  if (title.includes("typing")) return TypingSkillsEditor
  if (title.includes("minecraft")) return MinecraftEditor
  if (title.includes("robotics") || title.includes("arduino")) return RoboticsEditor
  if (title.includes("spike lego") || title.includes("lego")) return SpikeLegoEditor
  if (title.includes("python")) return PythonEditor
  if (title.includes("app lab")) return AppLabEditor

  if (
    title.includes("html") ||
    title.includes("css") ||
    title.includes("javascript") ||
    title.includes("advanced javascript") ||
    title.includes("js") ||
    title.includes("web")
  ) {
    return CodePenEditor
  }

  return AcodeEditor
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()

  const courseIdRaw = (params as any)?.courseId
  const courseId = decodeURIComponent(String(courseIdRaw ?? "")).trim()

  const [studentUsername, setStudentUsername] = useState("")
  const [studentGrade, setStudentGrade] = useState("")
  const [checkingStudent, setCheckingStudent] = useState(true)

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 1) Get username from localStorage, then fetch REAL grade from DB
  useEffect(() => {
    ;(async () => {
      try {
        const stored = localStorage.getItem("currentUser")
        const parsed = stored ? JSON.parse(stored) : null
        const username = String(parsed?.username ?? "").trim()

        if (!username) {
          setStudentUsername("")
          setStudentGrade("")
          return
        }

        setStudentUsername(username)

        const res = await fetch(`/api/student/profile?username=${encodeURIComponent(username)}`, { cache: "no-store" })
        const data = await safeJson(res)

        if (res.ok && data?.ok && data?.student) {
          setStudentGrade(normalizeGrade(data.student.grade ?? data.student.studentGrade))
          return
        }

        // fallback
        setStudentGrade(normalizeGrade(parsed?.grade || parsed?.studentGrade || "Grade 1"))
      } catch {
        setStudentUsername("")
        setStudentGrade("")
      } finally {
        setCheckingStudent(false)
      }
    })()
  }, [])

  // 2) Redirect to login if not logged in
  useEffect(() => {
    if (!checkingStudent && !studentUsername) router.replace("/auth")
  }, [checkingStudent, studentUsername, router])

  // 3) Load course by id
  useEffect(() => {
    if (!courseId || courseId === "undefined" || courseId === "null") {
      setError("Invalid course id.")
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" })
      const data = await safeJson(res)

      if (res.ok && data?.ok && data?.course) {
        const c = data.course
        setCourse({
          _id: String(c._id ?? c.id ?? courseId),
          title: String(c.title ?? "Course"),
          description: c.description ?? "",
          difficulty: c.difficulty ?? "",
          category: c.category ?? "",
          availableForGrades: normalizeAvailableForGrades(c.availableForGrades),
          ...c,
        })
        setLoading(false)
        return
      }

      setCourse(null)
      setError(data?.message || "Course not found")
      setLoading(false)
    })().catch((e: any) => {
      console.error(e)
      setCourse(null)
      setError("Network/server error loading course.")
      setLoading(false)
    })
  }, [courseId])

  const isAllowed = useMemo(() => {
    if (!course) return false
    if (!studentGrade) return false
    return course.availableForGrades.includes(studentGrade)
  }, [course, studentGrade])

  const Editor = useMemo(() => (course ? pickEditor(course.title) : null), [course])
  const EditorAny = Editor as any

  if (checkingStudent || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Course not available</h2>
          <p className="text-sm text-gray-600 mb-6">{error || "Course not found"}</p>
          <Link href="/dashboard" className="text-emerald-700 hover:underline text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Course not available</h2>
          <p className="text-sm text-gray-600 mb-2">This course is not available for your grade yet.</p>

          <div className="mt-4 text-sm text-gray-700">
            <div className="font-semibold">{course.title}</div>
            <div className="text-gray-500">{studentGrade || "Grade ?"}</div>
            <div className="text-gray-500">
              Available for: {course.availableForGrades?.length ? course.availableForGrades.join(", ") : "—"}
            </div>
          </div>

          <div className="mt-6">
            <Link href="/dashboard" className="text-emerald-700 hover:underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!EditorAny) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">No editor mapped for this course.</p>
          <button className="mt-4 underline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Render editor (no Convex)
  return (
    <EditorAny
      courseId={course._id}
      courseTitle={course.title}
      courseDescription={course.description}
      difficulty={course.difficulty}
      category={course.category}
      course={course}
    />
  )
}