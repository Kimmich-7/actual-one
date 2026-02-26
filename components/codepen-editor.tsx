"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, Eye, Code, FileText, Palette, Zap, BookOpen, Book } from "lucide-react"
import { toast } from "sonner"

type EditProjectData = {
  _id: string
  title: string
  codeContent?: string
  projectUrl?: string
}

type CodePenEditorProps = {
  courseId: string
  courseTitle?: string
  courseDescription?: string
  difficulty?: string
  category?: string
  course?: any
  editProject?: EditProjectData
}

type CurrentUser = {
  _id?: string
  id?: string
  name?: string
  username?: string
  role?: string
  grade?: string
  studentGrade?: string
  studentEmail?: string
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

export default function CodePenEditor(props: CodePenEditorProps) {
  const courseTitle = props.courseTitle ?? props.course?.title ?? "Course"
  const difficulty = props.difficulty ?? props.course?.difficulty ?? ""
  const category = props.category ?? props.course?.category ?? ""
  const courseDescription = props.courseDescription ?? props.course?.description ?? ""
  const courseId = props.courseId
  const editProject = props.editProject

  const [projectTitle, setProjectTitle] = useState("")
  const [htmlCode, setHtmlCode] = useState("")
  const [cssCode, setCssCode] = useState("")
  const [jsCode, setJsCode] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [viewingQuiz, setViewingQuiz] = useState(false)
  const [viewingNotes, setViewingNotes] = useState(false)
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html")
  const [isEditMode, setIsEditMode] = useState(false)

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [studentGrade, setStudentGrade] = useState<string>("")

  // Load current user from localStorage + fetch real grade (MySQL)
  useEffect(() => {
    ;(async () => {
      const stored = localStorage.getItem("currentUser")
      const parsed: CurrentUser | null = stored ? JSON.parse(stored) : null
      setCurrentUser(parsed)

      const username = String(parsed?.username ?? "").trim()
      if (!username) return

      // fetch real grade from DB
      const res = await fetch(`/api/student/profile?username=${encodeURIComponent(username)}`, { cache: "no-store" })
      const data = await safeJson(res)

      if (res.ok && data?.ok && data?.student) {
        const g = normalizeGrade(data.student.grade ?? data.student.studentGrade)
        setStudentGrade(g)
        return
      }

      const fallback = normalizeGrade(parsed?.grade ?? parsed?.studentGrade)
      setStudentGrade(fallback)
    })().catch(() => {
      // silent
    })
  }, [])

  // Load existing project data if editing
  useEffect(() => {
    if (!editProject) return
    setProjectTitle(editProject.title || "")
    if (editProject.codeContent) {
      try {
        const codeData = JSON.parse(editProject.codeContent)
        if (codeData?.html) setHtmlCode(codeData.html)
        if (codeData?.css) setCssCode(codeData.css)
        if (codeData?.js) setJsCode(codeData.js)
      } catch {
        // ignore
      }
    }
    setIsEditMode(true)
    toast.success("Project loaded for editing")
  }, [editProject])

  const renderPreview = () => {
    const combinedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <style>
${cssCode}
  </style>
</head>
<body>
${htmlCode.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*?<\/html>/i, "")}
  <script>
${jsCode}
  </script>
</body>
</html>`

    return (
      <iframe
        srcDoc={combinedCode}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    )
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "html":
        return <FileText className="w-4 h-4" />
      case "css":
        return <Palette className="w-4 h-4" />
      case "js":
        return <Zap className="w-4 h-4" />
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const handleSaveProject = async () => {
    const title = projectTitle.trim()
    if (!title) {
      toast.error("Please enter a project title")
      return
    }
    if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
      toast.error("Please write some code before saving")
      return
    }

    const user = currentUser
    const username = String(user?.username ?? "").trim()
    const studentId = String(user?._id ?? user?.id ?? "").trim()

    if (!username || !studentId) {
      toast.error("Please log in again to save your project.")
      return
    }

    setIsSaving(true)
    try {
      const codeContent = JSON.stringify({ html: htmlCode, css: cssCode, js: jsCode })

      // IMPORTANT: projectUrl column is varchar(100) in MySQL, so we keep it short
      const shortProjectUrl = ""

      const payload = {
        title,
        courseId,
        codeContent,
        projectUrl: shortProjectUrl,
        pLanguage: "html",
        cStatus: "saved",
        submissionDate: new Date().toISOString(),

        // match your Projects table fields
        studentId,
        studentName: user?.name ?? "",
        studentGrade: studentGrade || normalizeGrade(user?.grade ?? user?.studentGrade) || "",
        studentEmail: user?.studentEmail ?? "",
        username,
      }

      // Try update-first if editing (best effort), otherwise create
      if (isEditMode && editProject?._id) {
        const res = await fetch(`/api/projects/${encodeURIComponent(editProject._id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await safeJson(res)
        if (res.ok && (data?.ok ?? true)) {
          toast.success("Project updated successfully! 🎉")
          return
        }
        // fallback to create
      }

      const res2 = await fetch(`/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data2 = await safeJson(res2)

      if (!res2.ok || data2?.ok === false) {
        throw new Error(data2?.message || "Failed to save project")
      }

      toast.success("Project saved successfully! 🎉")
      if (!isEditMode) setProjectTitle("")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to save project. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const notLoggedIn = !currentUser || !String(currentUser.username ?? "").trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white overflow-hidden">
      {/* Authentication Warning Banner */}
      {notLoggedIn && (
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
                  {difficulty ? (
                    <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full">{difficulty}</span>
                  ) : null}
                  {category ? <span className="text-sm text-gray-400">{category}</span> : null}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setViewingNotes(!viewingNotes)
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
                  setViewingQuiz(!viewingQuiz)
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
          <Input
            placeholder="Enter your project title..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {viewingNotes ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="text-gray-200">
                <h2 className="text-lg font-semibold mb-2">Notes</h2>
                <p className="text-sm text-gray-400">
                  Notes are temporarily disabled while we migrate fully from Convex to MySQL.
                </p>
              </div>
            </div>
          ) : viewingQuiz ? (
            <div className="flex-1 p-6">
              <div className="text-gray-200">
                <h2 className="text-lg font-semibold mb-2">Quiz</h2>
                <p className="text-sm text-gray-400">
                  Quizzes are temporarily disabled while we migrate fully from Convex to MySQL.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Code Editors */}
              <div className="w-1/2 flex flex-col">
                {/* Tab Navigation */}
                <div className="bg-gray-800 border-b border-gray-700 flex">
                  {(["html", "css", "js"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 border-r border-gray-700 transition-colors ${
                        activeTab === tab ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-750"
                      }`}
                    >
                      {getTabIcon(tab)}
                      <span>{tab.toUpperCase()}</span>
                    </button>
                  ))}
                </div>

                {/* Code Editor */}
                <div className="flex-1">
                  <textarea
                    value={activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode}
                    onChange={(e) => {
                      if (activeTab === "html") setHtmlCode(e.target.value)
                      else if (activeTab === "css") setCssCode(e.target.value)
                      else setJsCode(e.target.value)
                    }}
                    className="w-full h-full bg-gray-900 text-gray-100 font-mono text-sm p-4 border-0 resize-none focus:outline-none"
                    placeholder={`Enter your ${activeTab.toUpperCase()} code here...`}
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="w-1/2 flex flex-col border-l border-gray-700">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm text-gray-300">Live Preview</span>
                </div>
                <div className="flex-1 bg-white">{renderPreview()}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}