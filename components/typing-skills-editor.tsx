"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Save, ArrowLeft, RotateCcw, Play, Trophy, BookOpen, Book } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditProjectData {
  _id: string
  title: string
  description?: string
  codeContent?: string
  projectUrl: string
}

interface TypingSkillsEditorProps {
  courseId: string
  courseTitle: string
  courseDescription: string
  difficulty: string
  category: string
  editProject?: EditProjectData
}

// Progressive learning levels
const typingLevels = {
  letters: {
    title: "Single Letters",
    description: "Master individual keys",
    exercises: ["a s d f g h j k l", "q w e r t y u i o p", "z x c v b n m", "A S D F G H J K L", "Q W E R T Y U I O P"],
  },
  words: {
    title: "Simple Words",
    description: "Type common words",
    exercises: ["cat dog run jump play", "the and for you are", "code learn fun game play", "hello world python java", "school student teacher class"],
  },
  sentences: {
    title: "Full Sentences",
    description: "Complete sentences with punctuation",
    exercises: [
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "How vexingly quick daft zebras jump!",
      "Coding is fun and creative for students.",
      "Learning to type fast helps with programming.",
    ],
  },
  games: {
    title: "Typing Games",
    description: "Fun challenges to improve speed",
    exercises: [
      "🎮 Type the falling words: apple banana cherry date elderberry",
      "🏆 Speed challenge: The faster you type, the higher you score!",
      "🎯 Accuracy test: Every mistake costs points, be careful!",
      "⚡ Lightning round: Quick short words in 30 seconds!",
      "🌟 Final boss: Long sentences with perfect accuracy!",
    ],
  },
} as const

type Student = {
  _id?: string
  id?: string
  name?: string
  username?: string
  grade?: string
  studentGrade?: string
  role?: string
  email?: string
  studentEmail?: string
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
  if (!s) return "Grade 1"
  const m = s.match(/(\d+)/)
  if (m) return `Grade ${m[1]}`
  if (s.toLowerCase().startsWith("grade ")) return s.replace(/\s+/g, " ").trim()
  return s
}

function getCurrentStudentFromStorage(): Student | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("currentUser")
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed) return null
  return {
    _id: parsed._id,
    id: parsed.id,
    name: parsed.name || parsed.uName || parsed.fullName,
    username: parsed.username,
    grade: parsed.grade,
    studentGrade: parsed.studentGrade,
    role: parsed.role,
    email: parsed.email,
    studentEmail: parsed.studentEmail,
  }
}

export default function TypingSkillsEditor({
  courseId,
  courseTitle,
  courseDescription,
  difficulty,
  category,
  editProject,
}: TypingSkillsEditorProps) {
  const router = useRouter()

  const [projectTitle, setProjectTitle] = useState("")
  const [currentLevel, setCurrentLevel] = useState<keyof typeof typingLevels>("letters")
  const [currentExercise, setCurrentExercise] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [isComplete, setIsComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [score, setScore] = useState(0)

  const [viewingQuiz, setViewingQuiz] = useState(false)
  const [viewingNotes, setViewingNotes] = useState(false)

  const [student, setStudent] = useState<Student | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Load student (localStorage first, then fetch real profile from MySQL)
  useEffect(() => {
    ;(async () => {
      const s = getCurrentStudentFromStorage()
      if (!s?.username) {
        setStudent(null)
        return
      }
      // Set quickly from storage
      setStudent({
        ...s,
        grade: normalizeGrade(s.grade ?? s.studentGrade),
      })

      // Fetch real profile (MySQL)
      try {
        const res = await fetch(`/api/student/profile?username=${encodeURIComponent(s.username)}`, { cache: "no-store" })
        const data = await safeJson(res)
        if (res.ok && data?.ok && data?.student) {
          setStudent((prev) => ({
            ...(prev || {}),
            _id: data.student._id ?? data.student.id ?? prev?._id,
            name: data.student.name ?? prev?.name,
            username: data.student.username ?? prev?.username,
            grade: normalizeGrade(data.student.grade ?? data.student.studentGrade ?? prev?.grade),
            email: data.student.email ?? prev?.email,
          }))
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  // If not logged in, go to auth
  useEffect(() => {
    if (student === null) {
      const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
      if (!raw) router.replace("/auth")
    }
  }, [student, router])

  // Load existing project data if editing
  useEffect(() => {
    if (editProject) {
      setProjectTitle(editProject.title || "")
      setIsEditMode(true)
      toast.success("Project loaded for editing")
    }
  }, [editProject])

  // Initialize current text
  useEffect(() => {
    const exercises = typingLevels[currentLevel].exercises
    setCurrentText(exercises[currentExercise] || exercises[0])
  }, [currentLevel, currentExercise])

  useEffect(() => {
    if (userInput.length === 1 && startTime === null) {
      setStartTime(Date.now())
    }

    if (userInput.length > 0) {
      // accuracy
      let correct = 0
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === currentText[i]) correct++
      }
      const newAccuracy = Math.round((correct / userInput.length) * 100)
      setAccuracy(newAccuracy)

      // wpm
      if (startTime) {
        const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
        const wordsTyped = userInput.length / 5
        const newWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0
        setWpm(newWpm)
      }

      // score
      const newScore = Math.round((wpm * newAccuracy) / 100)
      setScore(newScore)

      if (userInput === currentText) {
        setIsComplete(true)
        toast.success(`🎉 Exercise completed! WPM: ${wpm}, Accuracy: ${newAccuracy}%`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput, currentText, startTime])

  const resetTest = () => {
    setUserInput("")
    setStartTime(null)
    setWpm(0)
    setAccuracy(100)
    setIsComplete(false)
    setScore(0)
  }

  const nextExercise = () => {
    const exercises = typingLevels[currentLevel].exercises
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
    } else {
      const levels = Object.keys(typingLevels) as (keyof typeof typingLevels)[]
      const currentIndex = levels.indexOf(currentLevel)
      if (currentIndex < levels.length - 1) {
        const next = levels[currentIndex + 1]
        setCurrentLevel(next)
        setCurrentExercise(0)
        toast.success(`🎊 Level up! Welcome to ${typingLevels[next].title}!`)
      } else {
        toast.success("🏆 Congratulations! You've completed all typing levels!")
      }
    }
    resetTest()
  }

  const handleSaveProject = async () => {
    const s = student || getCurrentStudentFromStorage()
    if (!s?.username) {
      toast.error("Student session not found. Please login again.")
      router.replace("/auth")
      return
    }

    if (!projectTitle.trim()) {
      toast.error("Please enter a project title")
      return
    }

    if (!isComplete) {
      toast.error("Finish the exercise before saving results.")
      return
    }

    setIsSaving(true)

    const results = `Typing Test Results - Level: ${typingLevels[currentLevel].title}, Exercise: ${currentExercise + 1}, WPM: ${wpm}, Accuracy: ${accuracy}%, Score: ${score}`
    const projectUrl = `data:text/plain,${encodeURIComponent(results)}`

    // Match your MySQL projects shape (same approach we used elsewhere)
    const payload: any = {
      _id: isEditMode && editProject?._id ? String(editProject._id) : (globalThis.crypto?.randomUUID?.() ?? `p_${Date.now()}`),
      _creationTime: String(Date.now()),
      title: projectTitle.trim(),
      courseId: String(courseId),
      pLanguage: "typing",
      projectUrl,
      codeContent: results,
      cStatus: "saved",
      submissionDate: new Date().toISOString(),

      studentId: String(s._id || s.id || ""),
      studentName: String(s.name || ""),
      studentEmail: String(s.email || s.studentEmail || ""),
      studentGrade: String(normalizeGrade(s.grade || s.studentGrade || "")),
      username: String(s.username || ""),
    }

    try {
      const res = await fetch("/api/projects", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)

      if (!res.ok || !data?.ok) {
        toast.error(data?.message || "Failed to save results")
        return
      }

      toast.success(isEditMode ? "Typing results updated ✅" : "Typing results saved ✅")
      if (!isEditMode) setProjectTitle("")
    } catch (e) {
      console.error(e)
      toast.error("Network/server error while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const progress = currentText ? (userInput.length / currentText.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
                  <span className="px-2 py-1 bg-indigo-600 text-indigo-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={resetTest} variant="outline" className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              <Button
                onClick={() => setViewingNotes(!viewingNotes)}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-300 hover:text-white hover:bg-purple-700"
              >
                <Book className="w-4 h-4 mr-2" />
                Notes
              </Button>

              <Button
                onClick={() => setViewingQuiz(!viewingQuiz)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-300 hover:text-white hover:bg-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quiz
              </Button>

              <Button
                onClick={handleSaveProject}
                disabled={isSaving || !isComplete}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : isEditMode ? "Update Results" : "Save Results"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Project Title Input */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <Input
            placeholder="Enter a title for your typing session..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {/* Level Selection */}
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 flex-wrap gap-y-2">
                  {Object.entries(typingLevels).map(([key, level]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={currentLevel === key ? "default" : "outline"}
                      onClick={() => {
                        setCurrentLevel(key as keyof typeof typingLevels)
                        setCurrentExercise(0)
                        resetTest()
                      }}
                      className={
                        currentLevel === key ? "bg-indigo-600 text-white" : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                      }
                    >
                      {level.title}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  Exercise {currentExercise + 1} of {typingLevels[currentLevel].exercises.length}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{wpm}</div>
                  <div className="text-xs text-gray-400">WPM</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{Math.round(progress)}%</div>
                  <div className="text-xs text-gray-400">Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{score}</div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </div>
            </div>

            {/* Typing Area */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">{typingLevels[currentLevel].title}</h2>
                  <p className="text-gray-400">{typingLevels[currentLevel].description}</p>
                </div>

                <div className="mb-6">
                  <Progress value={progress} className="w-full h-2" />
                </div>

                <div className="bg-gray-800 p-6 rounded-lg mb-4 font-mono text-lg leading-relaxed">
                  {currentText.split("").map((char, index) => {
                    let className = "relative "
                    if (index < userInput.length) {
                      className += userInput[index] === char ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100"
                    } else if (index === userInput.length) {
                      className += "bg-blue-600 animate-pulse text-blue-100"
                    } else {
                      className += "text-gray-300"
                    }
                    return (
                      <span key={index} className={className}>
                        {char}
                      </span>
                    )
                  })}
                </div>

                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Start typing here..."
                  className="font-mono text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isComplete}
                />

                {isComplete && (
                  <div className="mt-4 p-4 bg-green-900/50 border border-green-600 rounded-lg">
                    <h3 className="font-bold text-green-400 mb-2 flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      🎉 Exercise Complete!
                    </h3>
                    <p className="text-green-300 mb-3">
                      Great job! You completed this exercise with {wpm} WPM and {accuracy}% accuracy!
                    </p>
                    <div className="flex space-x-2">
                      <Button onClick={nextExercise} className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        Next Exercise
                      </Button>
                      <Button onClick={resetTest} variant="outline" className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes + Quiz overlays (placeholder for now, keeps flow without Convex crashes) */}
            {viewingQuiz && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Course Quiz</h2>
                    <Button onClick={() => setViewingQuiz(false)} variant="outline" size="sm">
                      Close
                    </Button>
                  </div>
                  <div className="text-gray-700">
                    Quiz content will be plugged in from MySQL next (Convex removed to avoid crashes).
                  </div>
                </div>
              </div>
            )}

            {viewingNotes && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Course Notes</h2>
                    <Button onClick={() => setViewingNotes(false)} variant="outline" size="sm">
                      Close
                    </Button>
                  </div>
                  <div className="text-gray-700">
                    Notes viewer will be plugged in from MySQL next (Convex removed to avoid crashes).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}