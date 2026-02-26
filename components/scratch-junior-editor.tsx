"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, ExternalLink, Play, RefreshCw, Heart, BookOpen, Book } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ScratchJuniorEditorProps {
  courseId: string
  courseTitle: string
  courseDescription: string
  difficulty: string
  category: string
  editProject?: {
    _id: string
    title: string
    description?: string
    codeContent?: string
    projectUrl: string
  }
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

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function ScratchJuniorEditor({
  courseId,
  courseTitle,
  courseDescription,
  difficulty,
  category,
  editProject,
}: ScratchJuniorEditorProps) {
  const [projectTitle, setProjectTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [projectDescription, setProjectDescription] = useState("")
  const [iframeKey, setIframeKey] = useState(0)

  const [student, setStudent] = useState<Student | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // These exist only to keep your UI flow consistent (no Convex pages)
  const [viewingQuiz, setViewingQuiz] = useState(false)
  const [viewingNotes, setViewingNotes] = useState(false)

  useEffect(() => {
    const s = getCurrentStudent()
    setStudent(s)
  }, [])

  // Load existing project data if editing
  useEffect(() => {
    if (!editProject) return

    setProjectTitle(editProject.title || "")
    if (editProject.codeContent) {
      const match = editProject.codeContent.match(/- (.*)$/)
      if (match) setProjectDescription(match[1])
    }
    setIsEditMode(true)
    toast.success("Project loaded for editing")
  }, [editProject])

  const openScratchJunior = () => {
    window.open("https://codejr.org/scratchjr/index.html", "_blank", "noopener,noreferrer")
  }

  const refreshIframe = () => {
    setIframeKey((prev) => prev + 1)
    toast.success("Scratch Junior refreshed!")
  }

  const handleSaveProject = async () => {
    const s = student || getCurrentStudent()

    if (!projectTitle.trim()) {
      toast.error("Please enter a project title")
      return
    }
    if (!s?.username) {
      toast.error("Student session not found. Please log in again.")
      window.location.href = "/auth"
      return
    }

    const projectUrl = "https://codejr.org/scratchjr/index.html"
    const title = projectTitle.trim()
    const codeContent = `Scratch Junior visual programming project - ${projectDescription || "No description provided"}`

    // Build payload based on your MySQL Projects table columns
    const payload = {
      _id: editProject?._id || (globalThis.crypto?.randomUUID?.() ?? `p_${Date.now()}`),
      _creationTime: String(Date.now()),
      codeContent,
      courseId: String(courseId),
      pLanguage: "scratch-junior",
      projectUrl,
      cStatus: "saved",
      studentEmail: String(s.email || ""),
      studentGrade: String(s.grade || ""),
      studentId: String(s._id || ""),
      studentName: String(s.name || ""),
      submissionDate: new Date().toISOString(),
      title,
      // extra field (safe): if your API ignores unknown fields, fine; if not, remove it
      username: String(s.username),
    }

    try {
      setIsSaving(true)

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

      toast.success(isEditMode ? "Scratch Junior project updated ✅" : "Scratch Junior project saved ✅")

      if (!isEditMode) {
        setProjectTitle("")
        setProjectDescription("")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network/server error while saving")
    } finally {
      setIsSaving(false)
    }
  }

  // Notes/Quiz: keep UI but avoid Convex-based components crashing
  const toggleNotes = () => {
    setViewingQuiz(false)
    setViewingNotes((v) => !v)
    toast.info("Notes will be enabled after notes API is connected.")
  }
  const toggleQuiz = () => {
    setViewingNotes(false)
    setViewingQuiz((v) => !v)
    toast.info("Quiz will be enabled after quiz API is connected.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white overflow-hidden">
      {/* Auth warning */}
      {!student?.username && (
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
      <header className="bg-purple-800/80 backdrop-blur-sm border-b border-purple-700 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-purple-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>

              <div>
                <h1 className="text-lg font-bold text-white flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-400" />
                  {courseTitle}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-pink-600 text-pink-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-purple-200">{category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshIframe}
                variant="outline"
                size="sm"
                className="border-purple-400 text-purple-200 hover:text-white hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={toggleNotes}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-300 hover:text-white hover:bg-purple-700"
              >
                <Book className="w-4 h-4 mr-2" />
                Notes
              </Button>

              <Button
                onClick={toggleQuiz}
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
        <div className="bg-purple-800/60 backdrop-blur-sm border-b border-purple-700 p-4">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter your Scratch Junior project title..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="max-w-md bg-purple-700/50 border-purple-600 text-white placeholder-purple-300"
            />
            <Input
              placeholder="Describe what you created (optional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="max-w-md bg-purple-700/50 border-purple-600 text-white placeholder-purple-300"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Keep the layout, but don’t render Convex-only pages */}
          {viewingNotes || viewingQuiz ? (
            <div className="flex-1 p-6 bg-gray-900 overflow-y-auto">
              <div className="max-w-xl mx-auto bg-white/10 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">{viewingNotes ? "Notes" : "Quiz"}</h3>
                <p className="text-sm text-white/70">
                  This section will work once the Notes/Quiz APIs are connected to MySQL.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-purple-800/60 backdrop-blur-sm px-4 py-2 border-b border-purple-700 flex items-center justify-between">
                <span className="text-sm text-purple-200 flex items-center">
                  <Play className="w-4 h-4 mr-2 text-pink-400" />
                  Scratch Junior Programming Environment - Perfect for Young Coders!
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-300">Having fun? Try refreshing or opening in new tab</span>
                  <Button
                    onClick={openScratchJunior}
                    size="sm"
                    variant="outline"
                    className="border-purple-400 text-purple-200 hover:text-white hover:bg-purple-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>

              <div className="flex-1 bg-white relative overflow-hidden">
                <iframe
                  key={iframeKey}
                  src="https://codejr.org/scratchjr/index.html"
                  className="w-full h-full border-0"
                  title="Scratch Junior Programming Environment"
                  allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    transform: "scale(1)",
                    transformOrigin: "top left",
                    width: "100%",
                    height: "100%",
                    minHeight: "600px",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About / Instructions Panel */}
      <div className="bg-purple-800/80 backdrop-blur-sm border-t border-purple-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-pink-400" />
            🎨 About This Course
          </h3>
          <div className="text-sm text-purple-200">
            <p>{courseDescription}</p>
          </div>
        </div>
      </div>
    </div>
  )
}