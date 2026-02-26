





















"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Code, BookOpen, Trophy, Clock, FileCheck, AlertCircle, Timer, CheckCircle } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import StudentNotesViewer from "@/components/student-notes-viewer"
import { toast } from "sonner"

interface StudentDashboardProps {
  user: {
    _id: string
    name: string
    username: string
    grade: string
    class?: string
    role?: string
  }
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const [showProjectsDialog, setShowProjectsDialog] = useState(false)
  const courses = useQuery(api.courses.getCoursesByGrade, { grade: user.grade })
  const quizProgress = useQuery(api.quiz.getStudentQuizProgress, { studentUsername: user.username })
  const myProjects = useQuery(api.projects.getStudentProjects, { username: user.username }) || []
  
  // Assessment states
  const [showAssessmentRoom, setShowAssessmentRoom] = useState(false)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [sessionId, setSessionId] = useState<Id<"assessmentSessions"> | null>(null)

  // Assessment queries
  const assessmentStatus = useQuery(
    api.assessments.getStudentAssessmentStatus,
    { 
      studentId: user._id as Id<"users">, 
      grade: user.grade,
      className: user.class 
    }
  )
  
  const assessmentQuestions = useQuery(
    api.assessments.getStudentAssessmentQuestions,
    assessmentStatus?.assessment ? { assessmentId: assessmentStatus.assessment._id } : "skip"
  )

  // Assessment mutations
  const startAssessmentSession = useMutation(api.assessments.startAssessmentSession)
  const submitAssessment = useMutation(api.assessments.submitAssessment)
  
  // Debug logging
  console.log("Student Dashboard - user:", user)
  console.log("Student Dashboard - myProjects:", myProjects)
  console.log("Student Dashboard - showProjectsDialog:", showProjectsDialog)
  console.log("Student Dashboard - assessmentStatus:", assessmentStatus)

  // Get list of courses that have notes
  const coursesWithNotes = useQuery(api.courseNotes.getCoursesWithNotes) || []

  // Timer effect
  useEffect(() => {
    if (!assessmentStarted || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitAssessment()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [assessmentStarted, timeRemaining])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle assessment button click
  const handleAssessmentClick = () => {
    if (!assessmentStatus?.hasActiveAssessment) {
      toast.info("No assessment available at this time")
      return
    }
    if (assessmentStatus?.hasCompleted) {
      toast.info("You have already completed this assessment")
      return
    }
    setShowAssessmentRoom(true)
    setShowWelcomeScreen(true)
  }

  // Start the assessment
  const handleStartAssessment = async () => {
    if (!assessmentStatus?.assessment) return
    
    try {
      const newSessionId = await startAssessmentSession({
        studentId: user._id as Id<"users">,
        assessmentId: assessmentStatus.assessment._id,
      })
      setSessionId(newSessionId)
      setShowWelcomeScreen(false)
      setAssessmentStarted(true)
      setTimeRemaining(assessmentStatus.assessment.timeLimit * 60) // Convert minutes to seconds
      setCurrentQuestionIndex(0)
      setSelectedAnswers({})
    } catch (error: any) {
      toast.error(error.message || "Failed to start assessment")
    }
  }

  // Handle answer selection
  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  // Submit assessment
  const handleSubmitAssessment = async () => {
    if (!sessionId || !assessmentQuestions) return

    try {
      const answers = assessmentQuestions.map(q => ({
        questionId: q._id,
        selectedAnswer: selectedAnswers[q._id] ?? -1,
      }))

      const result = await submitAssessment({ sessionId, answers })
      toast.success(`Assessment submitted! Score: ${result.score}%`)
      setShowAssessmentRoom(false)
      setAssessmentStarted(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to submit assessment")
    }
  }

  // Exit assessment (only if not started)
  const handleExitAssessment = () => {
    if (assessmentStarted) {
      if (!confirm("Are you sure you want to exit? Your progress will be lost.")) return
    }
    setShowAssessmentRoom(false)
    setShowWelcomeScreen(false)
    setAssessmentStarted(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/auth")
  }

  // Generate gender-sensitive avatar based on name
  const getGenderSensitiveAvatar = (name: string) => {
    const firstName = name.split(' ')[0].toLowerCase()
    // Simple heuristic for gender detection based on common names
    const femaleNames = ['mary', 'jane', 'sarah', 'emily', 'anna', 'grace', 'faith', 'joy', 'mercy', 'esther', 'ruth', 'rebecca', 'rachel', 'elizabeth', 'margaret', 'catherine', 'susan', 'patricia', 'linda', 'barbara', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty']
    
    const isFemale = femaleNames.some(femaleName => firstName.includes(femaleName))
    
    if (isFemale) {
      // Female avatar - use the provided link
      return "https://img.freepik.com/free-vector/cute-girl-hacker-operating-laptop-cartoon-vector-icon-illustration-people-technology-isolated-flat_138676-9487.jpg"
    } else {
      // Male avatar - use the provided link
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJQU1gFj0yny7pOi9hrbs_-oqs15x9oSaZLkziOxze3KgfhdpadSzrTAY_XkDNYzF_xoA&usqp=CAU"
    }
  }

  // Get quiz completion status for a course
  const getCourseQuizStatus = (courseId: string) => {
    if (!quizProgress) return { easy: false, medium: false, hard: false }
    
    const courseQuizzes = quizProgress.filter(q => q.courseId === courseId)
    const status = { easy: false, medium: false, hard: false }
    
    courseQuizzes.forEach(quiz => {
      if (quiz.difficulty === 'easy' && quiz.score >= 60) status.easy = true
      if (quiz.difficulty === 'medium' && quiz.score >= 60) status.medium = true  
      if (quiz.difficulty === 'hard' && quiz.score >= 60) status.hard = true
    })
    
    return status
  }

  if (courses === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-600"></div>
      </div>
    )
  }

  const availableCourses = courses?.filter(course => course.isActive && course.isAvailableForUser) || []
  const completedProjects = myProjects?.length || 0
  const completedQuizzes = quizProgress?.filter(q => q.score >= 60).length || 0
  const totalTrophies = completedQuizzes + completedProjects

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
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
                <h1 className="text-xl font-bold text-gray-800">
                  Juja St. Peters School
                </h1>
                <p className="text-sm text-gray-600">Coding Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src={getGenderSensitiveAvatar(user.name)}
                alt="Student Avatar" 
                className="w-8 h-8 rounded-full border-2 border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">{user.name}</span>
              <Button 
                variant="outline" 
                onClick={() => void handleLogout()} 
                className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span>End Class</span>
              </Button>
              {/* Take Assessment Button */}
              <Button 
                onClick={handleAssessmentClick}
                className={`flex items-center space-x-2 ${
                  assessmentStatus?.hasCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Take Assessment</span>
                {assessmentStatus?.hasCompleted && <CheckCircle className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Centered Profile Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src={getGenderSensitiveAvatar(user.name)}
                alt="Student Profile Picture" 
                className="w-24 h-24 rounded-full border-4 border-gradient-to-r from-purple-400 to-pink-400 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {user.name}
          </h2>
          <p className="text-gray-600 text-lg font-medium">
            {user.grade} Student
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Available Courses</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{availableCourses.length}</div>
              <p className="text-xs text-blue-600">Ready to learn</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Trophies Earned</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Trophy className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{totalTrophies}</div>
              <p className="text-xs text-green-600">Quizzes + Projects</p>
            </CardContent>
          </Card>
          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            onClick={() => {
              console.log("Projects card clicked! Opening dialog...");
              setShowProjectsDialog(true);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Projects Completed</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <Code className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{completedProjects}</div>
              <p className="text-xs text-orange-600">Click to view all</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Quiz Score</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <Trophy className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {quizProgress && quizProgress.length > 0 
                  ? Math.round(quizProgress.reduce((sum, q) => sum + q.score, 0) / quizProgress.length)
                  : 0}%
              </div>
              <p className="text-xs text-purple-600">Average score</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Courses */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Your Courses</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => {
              const quizStatus = getCourseQuizStatus(course._id)
              return (
                <Card key={course._id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {course.icon || <Code className="w-6 h-6" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                            {course.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {course.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={course.isActive ? "default" : "secondary"} className="text-xs">
                          {course.isActive ? "Available" : "Coming Soon"}
                        </Badge>
                        {/* Quiz completion status */}
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${quizStatus.easy ? 'bg-green-500' : 'bg-gray-300'}`} title="Easy Quiz"></div>
                          <div className={`w-2 h-2 rounded-full ${quizStatus.medium ? 'bg-yellow-500' : 'bg-gray-300'}`} title="Medium Quiz"></div>
                          <div className={`w-2 h-2 rounded-full ${quizStatus.hard ? 'bg-red-500' : 'bg-gray-300'}`} title="Hard Quiz"></div>
                        </div>
                        {/* Course difficulty actions */}
                        <div className="flex items-center space-x-1 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-6"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Easy level for ${course.title} - Coming soon!`);
                            }}
                          >
                            Easy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-6"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Medium level for ${course.title} - Coming soon!`);
                            }}
                          >
                            Med
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-6"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Hard level for ${course.title} - Coming soon!`);
                            }}
                          >
                            Hard
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </CardDescription>

                    {/* Action Buttons Row - Notes and Quiz */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {coursesWithNotes.includes(course._id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            // Navigate to notes view for this course
                            router.push(`/courses/${course._id}?view=notes`)
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Notes
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className={coursesWithNotes.includes(course._id) ? "w-full" : "col-span-2 w-full"}
                        onClick={() => {
                          // Navigate to quiz view for this course
                          router.push(`/courses/${course._id}?view=quiz`)
                        }}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Take Quiz
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.estimatedHours || 2}h</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span>{Object.values(quizStatus).filter(Boolean).length}/3</span>
                        </div>
                      </div>
                      <Link href={`/courses/${course._id}`}>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={!course.isActive}
                        >
                          {course.isActive ? "Start Learning" : "Coming Soon"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Projects */}
        {myProjects && myProjects.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Your Recent Projects</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myProjects.slice(0, 6).map((project) => (
                <Card key={project._id} className="border-0 shadow-md bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">{project.title}</CardTitle>
                    <div className="flex justify-between items-center">
                      <Badge variant={project.status === "approved" ? "default" : project.status === "submitted" ? "secondary" : "outline"}>
                        {project.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(project.submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (project.projectUrl) {
                            window.open(project.projectUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            alert('No project content available to view');
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        variant="default" 
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/courses/${project.courseId}?editProject=${project._id}`);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projects Dialog */}
        <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Projects ({myProjects?.length || 0})
              </DialogTitle>
              <DialogDescription>
                View and edit all your saved projects
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {myProjects && myProjects.length > 0 ? (
                myProjects.map((project) => (
                  <Card key={project._id} className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-800">{project.title}</CardTitle>
                          <div className="flex gap-2 items-center mt-2">
                            <Badge variant={project.status === "approved" ? "default" : project.status === "submitted" ? "secondary" : "outline"}>
                              {project.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(project.submissionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("View button clicked, project:", project);
                            if (project.projectUrl && project.projectUrl.startsWith('http')) {
                              window.open(project.projectUrl, '_blank', 'noopener,noreferrer');
                            } else if (project.codeContent) {
                              // Navigate to course editor to view the code
                              setShowProjectsDialog(false);
                              router.push(`/courses/${project.courseId}?editProject=${project._id}`);
                            } else {
                              toast.info('Opening project in editor...');
                              setShowProjectsDialog(false);
                              router.push(`/courses/${project.courseId}?editProject=${project._id}`);
                            }
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          variant="default" 
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Edit button clicked, navigating to:", `/courses/${project.courseId}?editProject=${project._id}`);
                            setShowProjectsDialog(false);
                            router.push(`/courses/${project.courseId}?editProject=${project._id}`);
                          }}
                        >
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

      {/* ==================== ASSESSMENT ROOM ==================== */}
      {showAssessmentRoom && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Welcome Screen */}
          {showWelcomeScreen && (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
              <div className="max-w-2xl text-center">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                  <FileCheck className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  Welcome to the Assessment Room
                </h1>
                <p className="text-xl text-purple-200 mb-8">
                  Kindly Let&apos;s Focus on Our Devices
                </p>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-white mb-4">Assessment Details:</h2>
                  <div className="space-y-2 text-purple-200">
                    <p><strong className="text-white">Title:</strong> {assessmentStatus?.assessment?.title}</p>
                    <p><strong className="text-white">Time Limit:</strong> {assessmentStatus?.assessment?.timeLimit} minutes</p>
                    <p><strong className="text-white">Questions:</strong> {assessmentStatus?.assessment?.totalQuestions}</p>
                    <p><strong className="text-white">Total Points:</strong> {assessmentStatus?.assessment?.totalPoints}</p>
                  </div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-8">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Important:</span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-2">
                    This is a one-time assessment. Once started, you cannot pause or retake it.
                    Make sure you have a stable connection and are ready to begin.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleExitAssessment}
                    className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  >
                    Exit
                  </Button>
                  <Button
                    onClick={handleStartAssessment}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8"
                  >
                    Start Assessment
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Assessment In Progress */}
          {assessmentStarted && assessmentQuestions && (
            <div className="flex flex-col min-h-screen">
              {/* Timer Header */}
              <div className="bg-slate-800/80 backdrop-blur-lg border-b border-white/10 p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img 
                      src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
                      alt="School Logo" 
                      className="w-10 h-10 rounded-lg bg-white p-1"
                    />
                    <div>
                      <h1 className="text-lg font-semibold text-white">{assessmentStatus?.assessment?.title}</h1>
                      <p className="text-sm text-purple-300">Question {currentQuestionIndex + 1} of {assessmentQuestions.length}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    timeRemaining < 300 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white'
                  }`}>
                    <Timer className="w-5 h-5" />
                    <span className="text-xl font-mono font-bold">{formatTime(timeRemaining)}</span>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                  {assessmentQuestions.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                      <div className="flex justify-between items-start mb-6">
                        <Badge className="bg-purple-500 text-white">
                          Question {currentQuestionIndex + 1}
                        </Badge>
                        <Badge variant="outline" className="border-white/30 text-white">
                          {assessmentQuestions[currentQuestionIndex]?.points} points
                        </Badge>
                      </div>
                      
                      <h2 className="text-2xl font-semibold text-white mb-8">
                        {assessmentQuestions[currentQuestionIndex]?.question}
                      </h2>

                      <div className="space-y-4">
                        {assessmentQuestions[currentQuestionIndex]?.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectAnswer(assessmentQuestions[currentQuestionIndex]._id, idx)}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                              selectedAnswers[assessmentQuestions[currentQuestionIndex]._id] === idx
                                ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                                : 'bg-white/5 text-white hover:bg-white/10 border border-white/20'
                            }`}
                          >
                            <span className="font-semibold mr-3">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-8">
                    <div className="flex justify-between text-sm text-purple-300 mb-2">
                      <span>Progress</span>
                      <span>{Object.keys(selectedAnswers).length} of {assessmentQuestions.length} answered</span>
                    </div>
                    <Progress 
                      value={(Object.keys(selectedAnswers).length / assessmentQuestions.length) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="bg-slate-800/80 backdrop-blur-lg border-t border-white/10 p-4">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  
                  {/* Question Navigation Pills */}
                  <div className="flex gap-1 flex-wrap justify-center max-w-md">
                    {assessmentQuestions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                          idx === currentQuestionIndex
                            ? 'bg-purple-500 text-white'
                            : selectedAnswers[assessmentQuestions[idx]._id] !== undefined
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {currentQuestionIndex < assessmentQuestions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitAssessment}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      Submit Assessment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}






































