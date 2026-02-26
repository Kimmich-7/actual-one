"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft, Play, Save } from "lucide-react"
import { toast } from "sonner"

type Course = {
  _id: string
  title: string
  description?: string
  difficulty?: string
  category?: string
  isActive: boolean
  availableForGrades: string[]
}

type Student = {
  _id?: string
  name?: string
  username?: string
  grade?: string
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function getJson<T = any>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return (await safeJson(res)) as T
}

function normalizeGrade(raw: any): string {
  const s = String(raw ?? "").trim()
  if (!s) return "Grade 1"
  const m = s.match(/(\d+)/)
  if (m) return `Grade ${m[1]}`
  if (s.toLowerCase().startsWith("grade ")) return s.replace(/\s+/g, " ").trim()
  return s
}

/**
 * CourseEditorContent
 * - NO Convex
 * - Reads courseId from URL params (works with /courses/[courseId])
 * - Loads course from /api/courses (your working endpoint)
 * - Checks student from localStorage currentUser + optionally /api/student/profile
 * - Shows a safe page + simple editor placeholder so it never crashes
 */
export default function CourseEditorContent() {
  const router = useRouter()
  const params = useParams<{ courseId: string }>()
  const searchParams = useSearchParams()

  const courseId = params?.courseId
  const editProjectId = searchParams?.get("editProject") || ""

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)

  const [lessonStarted, setLessonStarted] = useState(false)
  const [codeContent, setCodeContent] = useState<string>("")

  // 1) Student from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser")
      if (!raw) {
        setStudent(null)
        return
      }
      const u = JSON.parse(raw)
      setStudent({
        _id: u._id || u.id,
        name: u.name || u.uName || u.fullName || "Student",
        username: (u.username || "").trim(),
        grade: normalizeGrade(u.grade || u.studentGrade || "Grade 1"),
      })
    } catch {
      localStorage.removeItem("currentUser")
      setStudent(null)
    } finally {
      setCheckingAuth(false)
    }
  }, [])

  // 2) Redirect if not logged in
  useEffect(() => {
    if (!checkingAuth && !student) {
      router.replace("/auth")
    }
  }, [checkingAuth, student, router])

  // 3) Refresh grade from DB if you already have /api/student/profile
  useEffect(() => {
    if (!student?.username) return
    ;(async () => {
      const res = await getJson<any>(`/api/student/profile?username=${encodeURIComponent(student.username!)}`)
      if (!res?.ok || !res?.student) return
      setStudent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          _id: res.student._id ?? prev._id,
          name: res.student.name ?? prev.name,
          grade: normalizeGrade(res.student.grade ?? prev.grade),
        }
      })
    })().catch(() => {})
  }, [student?.username])

  // 4) Load course from /api/courses (then pick by _id)
  useEffect(() => {
    if (!courseId) return
    ;(async () => {
      setLoading(true)
      const data = await getJson<any>("/api/courses")
      const list = Array.isArray(data?.courses) ? data.courses : Array.isArray(data) ? data : []
      const found = list.find((c: any) => String(c._id ?? c.id) === String(courseId))

      if (!found) {
        setCourse(null)
        setLoading(false)
        return
      }

      const normalized: Course = {
        _id: String(found._id ?? found.id),
        title: String(found.title ?? ""),
        description: found.description ?? "",
        difficulty: found.difficulty ?? "",
        category: found.category ?? "",
        isActive: Boolean(found.isActive ?? true),
        availableForGrades: Array.isArray(found.availableForGrades) ? found.availableForGrades.map(String) : [],
      }

      setCourse(normalized)
      setLoading(false)
    })().catch((err) => {
      console.error("Course load failed:", err)
      setCourse(null)
      setLoading(false)
    })
  }, [courseId])

  const isAvailableForStudent = useMemo(() => {
    if (!course) return false
    if (!student?.grade) return false
    if (!course.isActive) return false
    return Array.isArray(course.availableForGrades) && course.availableForGrades.includes(student.grade)
  }, [course, student?.grade])

  // 5) If editing an existing project, try load it from MySQL
  useEffect(() => {
    if (!editProjectId) return
    if (!student?._id && !student?.username) return

    ;(async () => {
      // Try common endpoints; we accept any that returns {ok:true, project:{...}} or {project:{...}}
      const candidates = [
        `/api/projects/get?id=${encodeURIComponent(editProjectId)}`,
        `/api/student/projects/get?id=${encodeURIComponent(editProjectId)}`,
        `/api/projects/${encodeURIComponent(editProjectId)}`,
      ]

      for (const url of candidates) {
        const res = await getJson<any>(url)
        const p = res?.project ?? (res?.ok ? res?.project : null)
        if (p?.codeContent) {
          setCodeContent(String(p.codeContent))
          toast.success("Project loaded")
          return
        }
      }
    })().catch(() => {})
  }, [editProjectId, student?._id, student?.username])

  const handleStartLesson = () => {
    if (!course) return
    if (!isAvailableForStudent) {
      toast.error("This course is not available for your grade.")
      return
    }
    setLessonStarted(true)
  }

  const handleSave = async () => {
    if (!course) return
    if (!student?._id) {
      toast.error("Missing student id. Please login again.")
      return
    }

    try {
      const payload = {
        // align with your Projects table columns
        studentId: student._id,
        studentName: student.name || "Student",
        studentGrade: student.grade || "Grade 1",
        courseId: course._id,
        title: `${course.title} Project`,
        codeContent: codeContent || "",
        pLanguage: course.category || "code",
        cStatus: "saved",
        projectUrl: "",
      }

      const res = await fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await safeJson(res)
      if (!res.ok || !data?.ok) {
        toast.error(data?.message || "Failed to save project")
        return
      }

      toast.success("Project saved")
    } catch (e) {
      console.error(e)
      toast.error("Network/server error while saving")
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // redirecting
  if (!student) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl mt-2">Course not available</CardTitle>
            <CardDescription>We couldn’t load this course. Please go back and try again.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ✅ Keep the same “Course Loaded ✅” page you were seeing, but now it’s MySQL-safe and won’t crash
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {lessonStarted ? course.title : "Course Loaded ✅"}
          </CardTitle>
          <CardDescription>
            {lessonStarted
              ? "Lesson/editor is ready."
              : "Your course page is now loading from MySQL correctly. Next, we plug this into your actual editor/lesson UI."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">{student.grade}</Badge>
            {course.difficulty ? <Badge variant="outline">{course.difficulty}</Badge> : null}
            {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
          </div>

          {!isAvailableForStudent ? (
            <div className="bg-white/70 border border-gray-200 rounded-xl p-4 text-center">
              <p className="font-medium text-gray-800">This course is not available for your grade yet.</p>
              <p className="text-sm text-gray-500 mt-1">Available for: {course.availableForGrades.join(", ")}</p>
            </div>
          ) : null}

          {!lessonStarted ? (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStartLesson} disabled={!isAvailableForStudent}>
                <Play className="w-4 h-4 mr-2" />
                Start Lesson
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-sm text-gray-700 font-medium mb-2">Editor (temporary)</p>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full min-h-[220px] rounded-lg border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Type your code here..."
                />
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}