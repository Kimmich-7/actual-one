"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, ExternalLink, RefreshCw, BookOpen, Book } from "lucide-react"
import { toast } from "sonner"

type Student = {
  _id?: string
  id?: string
  name?: string
  username?: string
  grade?: string
  studentGrade?: string
  email?: string
  studentEmail?: string
  role?: string
}

type EditProjectData = {
  _id: string
  title: string
  description?: string
  codeContent?: string
  projectUrl: string
  courseId?: string
  submissionDate?: string
  cStatus?: string
}

type ScratchEditorProps = {
  courseId: string
  courseTitle: string
  courseDescription: string
  difficulty: string
  category: string
  editProject?: EditProjectData
}

function safeJsonParse(v: any) {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function normalizeGrade(raw: any): string {
  const s = String(raw ?? "").trim()
  if (!s) return ""
  const m = s.match(/(\d+)/)
  if (m) return `Grade ${m[1]}`
  if (s.toLowerCase().startsWith("grade ")) return s.replace(/\s+/g, " ").trim()
  return s
}

function getStoredStudent(): Student | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("currentUser")
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed) return null
  return parsed as Student
}

function makeScratchUrl(scratchProjectId: string) {
  const id = String(scratchProjectId || "").trim()
  if (id) return `https://scratch.mit.edu/projects/${id}/`
  return "https://scratch.mit.edu/projects/editor/?tutorial=getStarted"
}

export default function ScratchEditor({
  courseId,
  courseTitle,
  courseDescription,
  difficulty,
  category,
  editProject,
}: ScratchEditorProps) {
  const router = useRouter()

  const [projectTitle, setProjectTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [scratchProjectId, setScratchProjectId] = useState("")
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeError, setIframeError] = useState(false)

  const [student, setStudent] = useState<Student | null>(null)
  const [checkingStudent, setCheckingStudent] = useState(true)

  const [viewingQuiz, setViewingQuiz] = useState(false)
  const [viewingNotes, setViewingNotes] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Load existing project data if editing
  useEffect(() => {
    if (!editProject) return

    setProjectTitle(editProject.title || "")
    if (editProject.projectUrl && editProject.projectUrl.includes("scratch.mit.edu")) {
      const match = editProject.projectUrl.match(/projects\/(\d+)/)
      if (match) setScratchProjectId(match[1])
    }
    setIsEditMode(true)
    toast.success("Project loaded for editing")
  }, [editProject])

  // Load student (localStorage -> profile API for full/real values)
  useEffect(() => {
    ;(async () => {
      try {
        const stored = getStoredStudent()
        const username = String(stored?.username ?? "").trim()

        if (!username) {
          setStudent(null)
          return
        }

        // start with storage
        setStudent(stored)

        // then upgrade from DB
        const res = await fetch(`/api/student/profile?username=${encodeURIComponent(username)}`, { cache: "no-store" })
        const data = await safeJson(res)

        if (res.ok && data?.ok && data?.student) {
          const s = data.student as Student
          setStudent((prev) => ({
            ...(prev || {}),
            ...s,
            username: String(s.username ?? prev?.username ?? username).trim(),
            grade: normalizeGrade((s as any).grade ?? s.studentGrade ?? prev?.grade ?? prev?.studentGrade),
          }))
        }
      } catch {
        setStudent(getStoredStudent())
      } finally {
        setCheckingStudent(false)
      }
    })()
  }, [])

  const openScratchEditor = () => {
    window.open("https://scratch.mit.edu/projects/editor/?tutorial=getStarted", "_blank", "noopener,noreferrer")
  }

  const refreshIframe = () => {
    setIframeKey((prev) => prev + 1)
    toast.success("Scratch editor refreshed!")
  }

  const canSave = useMemo(() => {
    if (checkingStudent) return false
    return Boolean(student?.username)
  }, [checkingStudent, student?.username])

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a project title")
      return
    }

    if (!canSave) {
      toast.error("Please log in to save your project.")
      router.replace("/auth")
      return
    }

    const username = String(student?.username ?? "").trim()
    const title = projectTitle.trim()

    const projectUrl = makeScratchUrl(scratchProjectId)
    const nowIso = new Date().toISOString()

    const payload = {
      _id: isEditMode && editProject?._id ? String(editProject._id) : String(globalThis.crypto?.randomUUID?.() ?? `p_${Date.now()}`),
      _creationTime: String(Date.now()),
      title,
      courseId: String(courseId),
      pLanguage: "scratch",
      projectUrl,
      codeContent: `Scratch visual programming project${scratchProjectId ? ` - Project ID: ${scratchProjectId}` : ""}`,
      cStatus: isEditMode ? (editProject?.cStatus || "saved") : "saved",
      submissionDate: nowIso,

      studentId: String(student?._id || (student as any)?.id || ""),
      studentName: String(student?.name || ""),
      studentEmail: String(student?.email || student?.studentEmail || ""),
      studentGrade: String(normalizeGrade(student?.grade || student?.studentGrade || "")),
      username,
    }

    try {
      setIsSaving(true)

      // Try PUT /api/projects/:id for edit, fallback to POST /api/projects
      if (isEditMode && editProject?._id) {
        const putRes = await fetch(`/api/projects/${encodeURIComponent(String(editProject._id))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (putRes.ok) {
          const putData = await safeJson(putRes)
          if (putData?.ok !== false) {
            toast.success("Scratch project updated successfully! 🎉")
            return
          }
        }
        // If PUT route doesn’t exist, just continue to POST
      }

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

      toast.success(isEditMode ? "Scratch project updated successfully! 🎉" : "Scratch project saved successfully! 🎉")
      if (!isEditMode) setProjectTitle("")
    } catch (e) {
      console.error(e)
      toast.error("Network/server error. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 text-white overflow-hidden">
      {/* Auth warning banner (same behavior) */}
      {!checkingStudent && !student?.username && (
        <div className="bg-yellow-600 text-white px-4 py-3 text-center">
          <p className="text-sm">
            ⚠️ You need to log in to save your projects.
            <Link href="/auth" className="underline ml-2 font-semibold hover:text-yellow-200">
              Click here to log in
            </Link>
          </p>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">{courseTitle}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-orange-600 text-orange-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshIframe}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={() => {
                  setViewingNotes((v) => !v)
                  setViewingQuiz(false)
                }}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-300 hover:text-white hover:bg-purple-700"
              >
                <Book className="w-4 h-4 mr-2" />
                Notes
              </Button>

              <Button
                onClick={() => {
                  setViewingQuiz((v) => !v)
                  setViewingNotes(false)
                }}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-300 hover:text-white hover:bg-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quiz
              </Button>

              <Button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : isEditMode ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Project Title Input */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter your Scratch project title..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Input
              placeholder="Scratch Project ID (optional)"
              value={scratchProjectId}
              onChange={(e) => setScratchProjectId(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {viewingNotes ? (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Keep UI flow, but remove Convex dependency */}
              <div className="text-white/90">
                <div className="text-lg font-semibold mb-2">Notes</div>
                <div className="text-sm text-white/70">
                  Notes are temporarily unavailable while we finish the MySQL migration for notes.
                </div>
              </div>
            </div>
          ) : viewingQuiz ? (
            <div className="flex-1 p-6">
              <div className="text-white/90">
                <div className="text-lg font-semibold mb-2">Quiz</div>
                <div className="text-sm text-white/70">
                  Quiz is temporarily unavailable while we finish the MySQL migration for quizzes.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scratch Interface Embedded */}
              <div className="flex-1 flex flex-col">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Having issues? Try refreshing or opening in new tab</span>
                    <Button
                      onClick={openScratchEditor}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>

                <div className="flex-1 bg-white relative" style={{ minHeight: "600px" }}>
                  {!iframeError ? (
                    <iframe
                      key={iframeKey}
                      src="https://pictoblox.ai/"
                      className="w-full h-full border-0"
                      title="Scratch Programming Environment"
                      allow="camera; microphone; fullscreen; clipboard-read; clipboard-write; storage-access"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-storage-access-by-user-activation"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{
                        transform: "scale(1)",
                        transformOrigin: "top left",
                        width: "100%",
                        height: "100%",
                      }}
                      onLoad={() => {
                        setIframeError(false)
                      }}
                      onError={() => {
                        setIframeError(true)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center p-8 max-w-md">
                        <div className="text-6xl mb-4">🎮</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Scratch Editor</h3>
                        <p className="text-gray-600 mb-6">
                          Scratch.mit.edu blocks embedding for security. Click below to open the Scratch editor in a new tab where it works perfectly!
                        </p>
                        <Button
                          onClick={openScratchEditor}
                          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 mb-4"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Scratch Editor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}