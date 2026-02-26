"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Code, BookOpen, Trophy, Edit, Eye, AlertCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type Student = {
  _id?: string
  name: string
  username: string
  grade: string
}

type Course = {
  _id: string
  title: string
  description?: string
  difficulty?: string
  category?: string
  isActive: boolean
  availableForGrades: string[]
}

type Project = {
  _id: string
  title: string
  courseId: string
  status?: string
  submissionDate?: string
  projectUrl?: string
  courseName?: string
  codeContent?: string
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
  const match = s.match(/(\d+)/)
  if (match) return `Grade ${match[1]}`
  if (s.toLowerCase().startsWith("grade ")) return s.replace(/\s+/g, " ").trim()
  return s
}

function getGenderSensitiveAvatar(name: string) {
  if (!name) return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`

  const firstName = name.split(" ")[0].toLowerCase()
  const femaleNames = [
    "mary","jane","sarah","emily","anna","grace","faith","joy","mercy","esther","ruth","rebecca","rachel",
    "elizabeth","margaret","catherine","susan","patricia","linda","barbara","helen","sandra","donna","carol",
    "sharon","michelle","laura","kimberly","deborah","dorothy","lisa","nancy","karen","betty"
  ]
  const isFemale = femaleNames.some((n) => firstName.includes(n))

  return isFemale
    ? "https://img.freepik.com/free-vector/cute-girl-hacker-operating-laptop-cartoon-vector-icon-illustration-people-technology-isolated-flat_138676-9487.jpg"
    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJQU1gFj0yny7pOi9hrbs_-oqs15x9oSaZLkziOxze3KgfhdpadSzrTAY_XkDNYzF_xoA&usqp=CAU"
}

export default function DashboardPageContent() {
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)

  const [coursesLoading, setCoursesLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  const [showProjectsDialog, setShowProjectsDialog] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser")
      if (!stored) {
        setStudent(null)
        return
      }
      const parsed = JSON.parse(stored)
      const username = String(parsed.username ?? "").trim()
      if (!username) {
        setStudent(null)
        return
      }

      setStudent({
        _id: parsed._id || parsed.id,
        name: parsed.name || parsed.uName || parsed.fullName || "Student",
        username,
        grade: normalizeGrade(parsed.grade || parsed.studentGrade || "Grade 1"),
      })
    } catch {
      localStorage.removeItem("currentUser")
      setStudent(null)
    } finally {
      setCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    if (!checkingAuth && !student) router.replace("/auth")
  }, [checkingAuth, student, router])

  // pull real profile (fix grade)
  useEffect(() => {
    if (!student?.username) return
    ;(async () => {
      const res = await getJson<any>(`/api/student/profile?username=${encodeURIComponent(student.username)}`)
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

  useEffect(() => {
    if (!student) return
    ;(async () => {
      setCoursesLoading(true)
      const data = await getJson<any>("/api/courses")
      const list = Array.isArray(data?.courses) ? data.courses : Array.isArray(data) ? data : []

      const normalized: Course[] = list.map((c: any) => ({
        _id: String(c._id ?? c.id),
        title: String(c.title ?? ""),
        description: c.description ?? "",
        difficulty: c.difficulty ?? "",
        category: c.category ?? "",
        isActive: Boolean(c.isActive ?? true),
        availableForGrades: Array.isArray(c.availableForGrades) ? c.availableForGrades.map(String) : [],
      }))

      setCourses(normalized)
      setCoursesLoading(false)
    })().catch((err) => {
      console.error(err)
      setCourses([])
      setCoursesLoading(false)
    })
  }, [student])

  // Projects: studentId FIRST
  useEffect(() => {
    if (!student) return

    ;(async () => {
      setProjectsLoading(true)

      const candidates: string[] = []

      if (student._id) {
        candidates.push(`/api/student/projects?studentId=${encodeURIComponent(student._id)}`)
        candidates.push(`/api/projects?studentId=${encodeURIComponent(student._id)}`)
      }

      // fallback to username
      if (student.username) {
        candidates.push(`/api/student/projects?username=${encodeURIComponent(student.username)}`)
        candidates.push(`/api/projects?username=${encodeURIComponent(student.username)}`)
      }

      let data: any = null
      for (const url of candidates) {
        const res = await getJson<any>(url)
        if (res) {
          data = res
          break
        }
      }

      const list = Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : []
      const normalized: Project[] = list.map((p: any) => ({
        _id: String(p._id ?? p.id),
        title: String(p.title ?? "Untitled"),
        courseId: String(p.courseId ?? ""),
        status: p.status ?? p.cStatus ?? "",
        submissionDate: p.submissionDate ?? p._creationTime ?? "",
        projectUrl: p.projectUrl ?? "",
        courseName: p.courseName ?? "",
        codeContent: p.codeContent ?? "",
      }))

      setProjects(normalized)
      setProjectsLoading(false)
    })().catch((err) => {
      console.error(err)
      setProjects([])
      setProjectsLoading(false)
    })
  }, [student?._id, student?.username])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setStudent(null)
    router.replace("/")
  }


  // ORDER COURSES
const orderedCourses = useMemo(() => {
  const order = [
    "scratch junior",
    "scratch programming",
    "typing skills",

    "html basics",
    "css styling",
    "javascript fundamentals",

    "python programming",
    "robotics & arduino",
    "minecraft programming",

    "app lab",
    "spike lego",
    "advanced html & css",

    "advanced javascript",
  ]

  const getRank = (title: string) => {
    const t = (title || "").toLowerCase().trim()
    const index = order.indexOf(t)
    return index === -1 ? 999 : index
  }

  return [...courses].sort((a, b) => {
    const diff = getRank(a.title) - getRank(b.title)
    if (diff !== 0) return diff
    return a.title.localeCompare(b.title)
  })
}, [courses])

  const availableCoursesCount = useMemo(() => {
    if (!student?.grade) return 0
    return courses.filter((c) => c.isActive && c.availableForGrades?.includes(student.grade)).length
  }, [courses, student?.grade])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!student) return null

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
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
                <p className="text-sm text-gray-600">Coding Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <img
                src={getGenderSensitiveAvatar(student.name)}
                alt="Student Avatar"
                className="w-8 h-8 rounded-full border-2 border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">{student.name}</span>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                <LogOut className="w-4 h-4" />
                <span>End Class</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src={getGenderSensitiveAvatar(student.name)} alt="Student Profile" className="w-24 h-24 rounded-full shadow-xl border-4 border-white" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{student.name}</h2>
          <p className="text-gray-600 text-lg font-medium">{student.grade} Student</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Available Courses</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{availableCoursesCount}</div>
              <p className="text-xs text-blue-600">Ready to learn</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer" onClick={() => setShowProjectsDialog(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Projects Completed</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Trophy className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{projects.length}</div>
              <p className="text-xs text-green-600">Click to view all</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Current Grade</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <Code className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{student.grade}</div>
              <p className="text-xs text-purple-600">Your level</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Your Courses</h3>

          {courses.length === 0 ? (
            <div className="bg-white/70 border border-gray-200 rounded-xl p-6 text-center shadow-sm">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium">No courses loaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Your /api/courses returned an empty list.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orderedCourses.map((course, index) => {
                const gradientColors = [
                  "from-red-400 to-pink-500",
                  "from-blue-400 to-indigo-500",
                  "from-green-400 to-emerald-500",
                  "from-yellow-400 to-orange-500",
                  "from-purple-400 to-violet-500",
                  "from-cyan-400 to-teal-500",
                ]
                const gradient = gradientColors[index % gradientColors.length]

                const isAvailable =
                  course.isActive && Array.isArray(course.availableForGrades) && course.availableForGrades.includes(student.grade)

                return (
                  <Card key={course._id} className={`border-0 shadow-lg bg-white overflow-hidden ${!isAvailable ? "opacity-60" : "hover:-translate-y-2 transition-all"}`}>
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg text-gray-800">{course.title}</CardTitle>
                        <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? `bg-gradient-to-r ${gradient} text-white border-0` : ""}>
                          {isAvailable ? "Available" : "Not Available"}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600">{course.description || ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          {course.difficulty || "—"}
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">{course.category || ""}</span>
                      </div>

                      {isAvailable ? (
                        <Link href={`/courses/${course._id}`}>
                          <Button className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-semibold`}>
                            Start Learning
                          </Button>
                        </Link>
                      ) : (
                        <div className="text-xs text-gray-500">Available for: {course.availableForGrades?.join(", ") || "—"}</div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        {projectsLoading ? null : projects.length > 0 ? (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Recent Projects</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <Card key={project._id} className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">{project.title}</CardTitle>
                    <div className="flex justify-between items-center">
                      <Badge variant={project.status === "approved" ? "default" : "secondary"}>{project.status || "saved"}</Badge>
                      <span className="text-sm text-gray-500">
                        {project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (project.projectUrl && project.projectUrl.startsWith("http")) {
                            window.open(project.projectUrl, "_blank", "noopener,noreferrer")
                          } else {
                            router.push(`/courses/${project.courseId}?editProject=${project._id}`)
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>

                      <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600" onClick={() => router.push(`/courses/${project.courseId}?editProject=${project._id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Projects ({projects.length})
              </DialogTitle>
              <DialogDescription>View and edit all your saved projects</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <Card key={project._id} className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800">{project.title}</CardTitle>
                      <div className="flex gap-2 items-center mt-2">
                        <Badge variant={project.status === "approved" ? "default" : project.status === "submitted" ? "secondary" : "outline"}>
                          {project.status || "saved"}
                        </Badge>
                        {project.submissionDate && <span className="text-sm text-gray-500">{new Date(project.submissionDate).toLocaleDateString()}</span>}
                        {project.courseName && <Badge variant="outline">{project.courseName}</Badge>}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            if (project.projectUrl && project.projectUrl.startsWith("http")) {
                              window.open(project.projectUrl, "_blank", "noopener,noreferrer")
                            } else {
                              toast.info("Opening project in editor...")
                              setShowProjectsDialog(false)
                              router.push(`/courses/${project.courseId}?editProject=${project._id}`)
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>

                        <Button
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => {
                            setShowProjectsDialog(false)
                            router.push(`/courses/${project.courseId}?editProject=${project._id}`)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">No projects yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start a course and save your first project!</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}