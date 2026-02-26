


























"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Users, BookOpen, TrendingUp, Award, LogOut, GraduationCap, Download, Search, X, Trophy, AlertCircle, Target, CheckCircle, Star, FileCheck, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

// Helper function to calculate performance level based on average score
// STANDARDIZED THRESHOLDS: Below <50, Approaching 50-70, Meeting 70-85, Exceeding >=85
function getPerformanceLevel(avgScore: number): { level: string; color: string; bgColor: string; borderColor: string; icon: any } {
  if (avgScore >= 85) {
    return { level: "Exceeding Expectations", color: "text-green-700", bgColor: "bg-green-100", borderColor: "border-green-500", icon: Star }
  } else if (avgScore >= 70) {
    return { level: "Meeting Expectations", color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-500", icon: CheckCircle }
  } else if (avgScore >= 50) {
    return { level: "Approaching Expectations", color: "text-orange-700", bgColor: "bg-orange-100", borderColor: "border-orange-500", icon: Target }
  } else {
    return { level: "Below Expectations", color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-500", icon: AlertCircle }
  }
}

// Helper to calculate student's average score (capped at 100%)
function getStudentAverageScore(studentPerf: any): number | null {
  if (!studentPerf || !studentPerf.sessions || studentPerf.sessions.length === 0) return null
  const rawAvg = studentPerf.sessions.reduce((sum: number, s: any) => sum + Math.min(s.score, 100), 0) / studentPerf.sessions.length
  return Math.min(Math.round(rawAvg), 100)
}

// Calculate class performance from student quiz sessions
function calculateClassPerformance(classStudentIds: string[], performance: any[]): { avgScore: number; hasData: boolean; studentCount: number; quizCount: number } {
  const classPerformance = performance.filter(p => classStudentIds.includes(p.studentId))
  const allSessions = classPerformance.flatMap(p => p.sessions || [])
  
  if (allSessions.length === 0) {
    return { avgScore: 0, hasData: false, studentCount: classStudentIds.length, quizCount: 0 }
  }
  
  const avgScore = Math.round(allSessions.reduce((sum, s) => sum + (s.score || 0), 0) / allSessions.length)
  return { avgScore, hasData: true, studentCount: classStudentIds.length, quizCount: allSessions.length }
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [teacherUsername, setTeacherUsername] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [studentSearchQuery, setStudentSearchQuery] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("teacherUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.role === "teacher") {
          setTeacherUsername(user.username)
          setIsAuthenticated(true)
        } else {
          router.push("/teacher/login")
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/teacher/login")
      }
    } else {
      router.push("/teacher/login")
    }
  }, [router])

  // Queries using the Gate & Return Union pattern
  const teacherDataResult = useQuery(
    api.teachers.getTeacherData,
    isAuthenticated ? { teacherUsername } : "skip"
  )
  
  // Query curriculum for teachers
  const curriculum = useQuery(api.curriculum.getAllCurriculum) || []

  const handleLogout = () => {
    localStorage.removeItem("teacherUser")
    setIsAuthenticated(false)
    router.push("/teacher/login")
  }

  // Handle loading states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (teacherDataResult === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading teacher data...</div>
      </div>
    )
  }

  if (!teacherDataResult || !teacherDataResult.ok) {
    // For demo accounts, provide fallback data
    const storedUser = localStorage.getItem("teacherUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.username === "teacher1" || user.username === "teacher2") {
          // Demo data for teacher accounts
          const demoData = {
            classes: user.username === "teacher1" ? [
              { _id: "class1", name: "Grade 5A", grade: "Grade 5", students: ["student1", "student2", "student3"] },
              { _id: "class2", name: "Grade 6B", grade: "Grade 6", students: ["student4", "student5"] }
            ] : [
              { _id: "class3", name: "Grade 4A", grade: "Grade 4", students: ["student6", "student7"] },
              { _id: "class4", name: "Grade 5B", grade: "Grade 5", students: ["student8", "student9", "student10"] }
            ],
            students: user.username === "teacher1" ? [
              { _id: "student1", name: "John Wanjiku", grade: "Grade 5", class: "Grade 5A", username: "john.w" },
              { _id: "student2", name: "Mary Njeri", grade: "Grade 5", class: "Grade 5A", username: "mary.n" },
              { _id: "student3", name: "Peter Kamau", grade: "Grade 5", class: "Grade 5A", username: "peter.k" },
              { _id: "student4", name: "Grace Wanjiru", grade: "Grade 6", class: "Grade 6B", username: "grace.w" },
              { _id: "student5", name: "David Mwangi", grade: "Grade 6", class: "Grade 6B", username: "david.m" }
            ] : [
              { _id: "student6", name: "Sarah Akinyi", grade: "Grade 4", class: "Grade 4A", username: "sarah.a" },
              { _id: "student7", name: "James Ochieng", grade: "Grade 4", class: "Grade 4A", username: "james.o" },
              { _id: "student8", name: "Faith Wambui", grade: "Grade 5", class: "Grade 5B", username: "faith.w" },
              { _id: "student9", name: "Kevin Mutua", grade: "Grade 5", class: "Grade 5B", username: "kevin.m" },
              { _id: "student10", name: "Linda Atieno", grade: "Grade 5", class: "Grade 5B", username: "linda.a" }
            ],
            performance: user.username === "teacher1" ? [
              { 
                studentId: "student1", 
                studentName: "John Wanjiku", 
                lastLoginTime: Date.now() - 86400000, // 1 day ago
                sessions: [
                  { score: 85, correctAnswers: 17, totalQuestions: 20 },
                  { score: 92, correctAnswers: 18, totalQuestions: 20 }
                ]
              },
              { 
                studentId: "student2", 
                studentName: "Mary Njeri", 
                lastLoginTime: Date.now() - 172800000, // 2 days ago
                sessions: [
                  { score: 78, correctAnswers: 15, totalQuestions: 20 }
                ]
              },
              { 
                studentId: "student3", 
                studentName: "Peter Kamau", 
                lastLoginTime: Date.now() - 604800000, // 1 week ago
                sessions: [
                  { score: 95, correctAnswers: 19, totalQuestions: 20 },
                  { score: 88, correctAnswers: 17, totalQuestions: 20 },
                  { score: 91, correctAnswers: 18, totalQuestions: 20 }
                ]
              }
            ] : [
              { 
                studentId: "student6", 
                studentName: "Sarah Akinyi", 
                lastLoginTime: Date.now() - 43200000, // 12 hours ago
                sessions: [
                  { score: 82, correctAnswers: 16, totalQuestions: 20 }
                ]
              },
              { 
                studentId: "student7", 
                studentName: "James Ochieng", 
                lastLoginTime: Date.now() - 259200000, // 3 days ago
                sessions: [
                  { score: 76, correctAnswers: 15, totalQuestions: 20 },
                  { score: 84, correctAnswers: 16, totalQuestions: 20 }
                ]
              }
            ]
          }
          
          // Use demo data instead of database result
          const { classes, students, performance } = demoData
          
          // Calculate statistics with demo data
          const totalStudents = students.length
          const totalClasses = classes.length
          const totalQuizzes = performance.reduce((sum, p) => sum + p.sessions.length, 0)
          
          // Calculate average score across ALL quiz sessions, not per student
          const allSessions = performance.flatMap(p => p.sessions)
          const averageScore = allSessions.length > 0
            ? Math.round(allSessions.reduce((sum, session) => sum + session.score, 0) / allSessions.length)
            : 0

          return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-gray-800">
              {/* Header */}
              <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
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
                        <p className="text-sm text-gray-600">Teacher Dashboard - {user.name}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </header>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4 mb-8">
                  <Button className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300 h-auto p-6 flex flex-col items-center justify-center text-left">
                    <div className="flex flex-row items-center justify-between w-full space-y-0 pb-2">
                      <span className="text-sm font-medium text-blue-700">My Classes</span>
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-800 w-full">{totalClasses}</div>
                  </Button>
                  
                  <Button className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 h-auto p-6 flex flex-col items-center justify-center text-left">
                    <div className="flex flex-row items-center justify-between w-full space-y-0 pb-2">
                      <span className="text-sm font-medium text-green-700">My Students</span>
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-800 w-full">{totalStudents}</div>
                  </Button>
                  
                  <Button className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300 h-auto p-6 flex flex-col items-center justify-center text-left">
                    <div className="flex flex-row items-center justify-between w-full space-y-0 pb-2">
                      <span className="text-sm font-medium text-yellow-700">Quiz Attempts</span>
                      <BookOpen className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-800 w-full">{totalQuizzes}</div>
                  </Button>

                  <Button className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 h-auto p-6 flex flex-col items-center justify-center text-left">
                    <div className="flex flex-row items-center justify-between w-full space-y-0 pb-2">
                      <span className="text-sm font-medium text-purple-700">Average Score</span>
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-800 w-full">{averageScore}%</div>
                  </Button>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="classes">My Classes</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Overview</CardTitle>
                        <CardDescription className="text-gray-600">Welcome to your dashboard</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-800">{classes?.length || 0}</div>
                            <div className="text-sm text-gray-600">Classes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-800">{students?.length || 0}</div>
                            <div className="text-sm text-gray-600">Students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-orange-800">{performance?.length || 0}</div>
                            <div className="text-sm text-gray-600">Quiz Attempts</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Classes Tab */}
                  <TabsContent value="classes">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800">My Classes</CardTitle>
                        <CardDescription className="text-gray-600">Classes assigned to you</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {classes.map((classItem) => {
                            // Calculate class performance for demo
                            const classPerf = calculateClassPerformance(
                              classItem.students.map((s: any) => typeof s === 'string' ? s : s._id || s),
                              performance
                            )
                            const perfLevel = classPerf.hasData ? getPerformanceLevel(classPerf.avgScore) : null
                            const PerfIcon = perfLevel?.icon
                            
                            return (
                              <Card 
                                key={classItem._id} 
                                className={`border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer hover:shadow-lg transition-shadow ${perfLevel ? `border-l-4 ${perfLevel.borderColor}` : ''}`}
                                onClick={() => setSelectedClass(classItem)}
                              >
                                <CardHeader>
                                  <CardTitle className="text-lg text-green-800">{classItem.name}</CardTitle>
                                  <CardDescription className="text-green-600">
                                    Grade: {classItem.grade}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-green-700">
                                      {classItem.students.length} students
                                    </span>
                                    <Badge variant="secondary" className="bg-green-600 text-white">
                                      View Details
                                    </Badge>
                                  </div>
                                  {/* Performance Badge */}
                                  {perfLevel ? (
                                    <div className={`flex items-center gap-2 p-2 rounded-lg ${perfLevel.bgColor}`}>
                                      <PerfIcon className={`w-4 h-4 ${perfLevel.color}`} />
                                      <div className="flex-1">
                                        <p className={`text-xs font-medium ${perfLevel.color}`}>{perfLevel.level}</p>
                                        <p className={`text-xs ${perfLevel.color} opacity-80`}>Avg: {classPerf.avgScore}% • {classPerf.quizCount} quizzes</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100">
                                      <AlertCircle className="w-4 h-4 text-gray-400" />
                                      <p className="text-xs text-gray-500">No quiz data yet</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Class Details Modal */}
                    {selectedClass && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedClass(null)}>
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                          <CardHeader className="border-b sticky top-0 bg-white z-10">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-2xl text-gray-800">{selectedClass.name}</CardTitle>
                                <CardDescription className="text-gray-600">Grade: {selectedClass.grade} • {selectedClass.students.length} students</CardDescription>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)}>
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <Tabs defaultValue="students">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="students">Students</TabsTrigger>
                                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                              </TabsList>

                              <TabsContent value="students" className="space-y-4 mt-4">
                                {students
                                  .filter(s => selectedClass.students.includes(s._id))
                                  .map((student) => {
                                    const studentPerf = performance.find(p => p.studentId === student._id)
                                    return (
                                      <div key={student._id} className="p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h3 className="font-semibold text-gray-800">{student.name}</h3>
                                            <p className="text-sm text-gray-600">Username: {student.username || 'N/A'}</p>
                                            <p className="text-sm text-gray-600">Class: {student.class || 'N/A'}</p>
                                          </div>
                                          {studentPerf && studentPerf.sessions.length > 0 && (
                                            <Badge variant="outline" className="text-sm">
                                              {studentPerf.sessions.length} quiz{studentPerf.sessions.length !== 1 ? 'es' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                              </TabsContent>

                              <TabsContent value="leaderboard" className="mt-4">
                                <div className="space-y-3">
                                  {students
                                    .filter(s => selectedClass.students.includes(s._id))
                                    .map(student => {
                                      const studentPerf = performance.find(p => p.studentId === student._id)
                                      const avgScore = studentPerf && studentPerf.sessions.length > 0
                                        ? Math.round(studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length)
                                        : 0
                                      return { student, avgScore, quizCount: studentPerf?.sessions.length || 0 }
                                    })
                                    .sort((a, b) => b.avgScore - a.avgScore)
                                    .map((item, index) => (
                                      <div key={item.student._id} className={`p-4 rounded-lg border flex items-center gap-4 ${
                                        index === 0 ? 'bg-yellow-50 border-yellow-300' :
                                        index === 1 ? 'bg-gray-50 border-gray-300' :
                                        index === 2 ? 'bg-orange-50 border-orange-300' :
                                        'bg-white'
                                      }`}>
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                          {index === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                                          {index !== 0 && <span>{index + 1}</span>}
                                        </div>
                                        <div className="flex-1">
                                          <h3 className="font-semibold text-gray-800">{item.student.name}</h3>
                                          <p className="text-sm text-gray-600">{item.quizCount} quiz{item.quizCount !== 1 ? 'es' : ''} completed</p>
                                        </div>
                                        <div className="text-right">
                                          <div className={`text-2xl font-bold ${
                                            item.avgScore >= 80 ? 'text-green-600' :
                                            item.avgScore >= 60 ? 'text-yellow-600' :
                                            item.avgScore > 0 ? 'text-red-600' : 'text-gray-400'
                                          }`}>
                                            {item.avgScore}%
                                          </div>
                                          <div className="text-xs text-gray-500">Average</div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  {/* Students Tab */}
                  <TabsContent value="students">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">My Students</CardTitle>
                        <CardDescription className="text-gray-400">Students in your assigned classes with last login times</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Search Filter */}
                        <div className="mb-6">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              type="text"
                              placeholder="Search students by name, username, grade, or class..."
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              className="pl-10 pr-10 bg-gray-700 text-white border-gray-600"
                            />
                            {studentSearchQuery && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                                onClick={() => setStudentSearchQuery("")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {students
                            .filter(student => {
                              if (!studentSearchQuery) return true
                              const query = studentSearchQuery.toLowerCase()
                              return (
                                student.name.toLowerCase().includes(query) ||
                                (student.username || '').toLowerCase().includes(query) ||
                                student.grade.toLowerCase().includes(query) ||
                                (student.class || '').toLowerCase().includes(query)
                              )
                            })
                            .map((student) => {
                              // Find performance data for this student
                              const studentPerf = performance.find(p => p.studentId === student._id);
                              const lastLogin = studentPerf?.lastLoginTime ? new Date(studentPerf.lastLoginTime) : null;
                              const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null;
                              
                              return (
                                <div key={student._id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-white">{student.name}</h3>
                                    <p className="text-sm text-gray-300">{student.grade} • {student.class || 'N/A'}</p>
                                    <p className="text-xs text-gray-400">Username: {student.username || 'N/A'}</p>
                                    {lastLogin ? (
                                      <p className="text-xs text-gray-300 mt-1">
                                        Last login: {lastLogin.toLocaleDateString()} 
                                        {(() => {
                                          const daysSince = daysSinceLogin || 0;
                                          return (
                                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                              daysSince === 0 ? 'bg-green-600 text-green-100' :
                                              daysSince <= 3 ? 'bg-yellow-600 text-yellow-100' :
                                              'bg-red-600 text-red-100'
                                            }`}>
                                              {daysSince === 0 ? 'Today' : 
                                               daysSince === 1 ? '1 day ago' : 
                                               `${daysSince} days ago`}
                                            </span>
                                          );
                                        })()}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="px-2 py-1 rounded text-xs bg-gray-400 text-gray-100">
                                          Never logged in
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className={
                                      !lastLogin ? "border-gray-500 text-gray-400" :
                                      (daysSinceLogin || 0) <= 1 ? "border-green-500 text-green-400" :
                                      (daysSinceLogin || 0) <= 7 ? "border-yellow-500 text-yellow-400" :
                                      "border-red-500 text-red-400"
                                    }>
                                      {!lastLogin ? "Never logged in" :
                                       (daysSinceLogin || 0) <= 1 ? "Active" :
                                       (daysSinceLogin || 0) <= 7 ? "Recent" :
                                       "Inactive"}
                                    </Badge>
                                    {studentPerf && studentPerf.sessions.length > 0 && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {studentPerf.sessions.length} quiz{studentPerf.sessions.length !== 1 ? 'es' : ''} completed
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Performance Tab */}
                  <TabsContent value="performance">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Student Performance</CardTitle>
                        <CardDescription className="text-gray-600">Quiz performance of your students</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {performance.map((studentPerf) => (
                            <div key={studentPerf.studentId} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">{studentPerf.studentName}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    studentPerf.sessions.length > 0
                                      ? studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 80
                                        ? "border-green-500 text-green-600"
                                        : studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 60
                                        ? "border-yellow-500 text-yellow-600"
                                        : "border-red-500 text-red-600"
                                      : "border-gray-500 text-gray-600"
                                  }
                                >
                                  {studentPerf.sessions.length > 0
                                    ? studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 80
                                      ? "Exceeding"
                                      : studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 60
                                      ? "Meeting"
                                      : "Below"
                                    : "No Data"
                                  }
                                </Badge>
                              </div>
                              
                              {studentPerf.sessions.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">
                                    Total Quizzes: {studentPerf.sessions.length} | 
                                    Average Score: {Math.round(studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length)}%
                                  </p>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {studentPerf.sessions.slice(0, 4).map((session, index) => (
                                      <div key={index} className="text-xs text-gray-700 bg-white p-2 rounded border">
                                        <span className="font-medium">Score: {session.score}%</span>
                                        <span className="ml-2 text-gray-500">
                                          ({session.correctAnswers}/{session.totalQuestions})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">No quiz attempts yet</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Assessments Tab */}
                  <TabsContent value="assessments">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-purple-600" />
                          Assessment Results
                        </CardTitle>
                        <CardDescription className="text-gray-600">View assessment results for your classes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Assessment Results - Demo Data */}
                        <div className="text-center py-12">
                          <FileCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 text-lg">No assessment results yet</p>
                          <p className="text-gray-500 text-sm mt-2">When students complete assessments, their results will appear here organized by class</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Curriculum Tab */}
                  <TabsContent value="curriculum">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          Curriculum Documents
                        </CardTitle>
                        <CardDescription className="text-gray-600">Access curriculum materials and resources</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {curriculum && curriculum.length > 0 ? (
                          <div className="space-y-4">
                            {curriculum.map((item: any) => (
                              <div key={item._id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                      <BookOpen className="w-5 h-5 text-indigo-600" />
                                      {item.title}
                                    </h3>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                      <span>📎 {item.fileName}</span>
                                      <span>📅 {new Date(item.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {item.fileUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (item.fileUrl) {
                                            window.open(item.fileUrl, '_blank')
                                          }
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <Download className="w-4 h-4" />
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 text-lg">No curriculum available yet</p>
                            <p className="text-gray-500 text-sm mt-2">Curriculum documents will appear here when uploaded by administrators</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
      }
    }
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {teacherDataResult?.message || "Failed to load data"}</div>
      </div>
    )
  }

  const { classes, students, performance } = teacherDataResult

  // Calculate statistics
  const totalStudents = students.length
  const totalClasses = classes.length
  const totalQuizzes = performance.reduce((sum, p) => sum + p.sessions.length, 0)
  
  // Calculate average score across ALL quiz sessions, not per student
  const allSessions = performance.flatMap(p => p.sessions)
  const averageScore = allSessions.length > 0
    ? Math.round(allSessions.reduce((sum, session) => sum + session.score, 0) / allSessions.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-gray-800">
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
                <p className="text-sm text-gray-600">Teacher Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://img.freepik.com/free-vector/teacher-concept-illustration_114360-1708.jpg" 
                  alt="Teacher Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{teacherUsername}</p>
                  <p className="text-xs text-gray-500">Teacher</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Redesigned to match the provided image */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">My Classes</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{classes?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">My Students</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{students?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Quiz Attempts</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <BookOpen className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Average Score</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {(() => {
                  // Calculate average across ALL quiz sessions (not per-student average)
                  const allSessions = performance ? performance.flatMap(p => p.sessions || []) : []
                  if (allSessions.length === 0) return 0
                  const total = allSessions.reduce((sum, s) => sum + Math.min(s.score, 100), 0)
                  return Math.min(Math.round(total / allSessions.length), 100)
                })()}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview Cards - Based on actual student count */}
        {(() => {
          // Use actual student count as the base
          const totalStudentCount = students?.length || 0
          
          // Get students who have quiz data
          const studentsWithQuizzes = performance ? performance.filter(p => p.sessions && p.sessions.length > 0) : []
          const totalWithQuizzes = studentsWithQuizzes.length
          
          // Students without quizzes = total students - students with quiz data
          const studentsWithoutQuizzesCount = Math.max(0, totalStudentCount - totalWithQuizzes)
          
          // Helper to get capped average score
          const getAvg = (p: any) => {
            if (!p.sessions || p.sessions.length === 0) return 0
            const raw = p.sessions.reduce((sum: number, s: any) => sum + Math.min(s.score, 100), 0) / p.sessions.length
            return Math.min(raw, 100)
          }
          
          const belowCount = studentsWithQuizzes.filter(p => getAvg(p) < 50).length
          const approachingCount = studentsWithQuizzes.filter(p => getAvg(p) >= 50 && getAvg(p) < 70).length
          const meetingCount = studentsWithQuizzes.filter(p => getAvg(p) >= 70 && getAvg(p) < 85).length
          const exceedingCount = studentsWithQuizzes.filter(p => getAvg(p) >= 85).length
          
          // Percentages based on TOTAL students (all categories should add up to 100%)
          const noQuizPct = totalStudentCount > 0 ? Math.round((studentsWithoutQuizzesCount / totalStudentCount) * 100) : 0
          const belowPct = totalStudentCount > 0 ? Math.round((belowCount / totalStudentCount) * 100) : 0
          const approachingPct = totalStudentCount > 0 ? Math.round((approachingCount / totalStudentCount) * 100) : 0
          const meetingPct = totalStudentCount > 0 ? Math.round((meetingCount / totalStudentCount) * 100) : 0
          const exceedingPct = totalStudentCount > 0 ? Math.round((exceedingCount / totalStudentCount) * 100) : 0
          
          return (
            <div className="grid gap-6 md:grid-cols-5 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-600">{noQuizPct}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{studentsWithoutQuizzesCount}</div>
                  <div className="text-sm text-gray-600">No Quiz Attempt Yet</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                <CardContent className="p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-red-300 flex items-center justify-center">
                      <span className="text-xs text-red-600">{belowPct}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-800 mb-1">{belowCount}</div>
                  <div className="text-sm text-red-600">Below Expectation</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-yellow-300 flex items-center justify-center">
                      <span className="text-xs text-yellow-600">{approachingPct}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800 mb-1">{approachingCount}</div>
                  <div className="text-sm text-yellow-600">Approaching Expectation</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-300 flex items-center justify-center">
                      <span className="text-xs text-blue-600">{meetingPct}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-800 mb-1">{meetingCount}</div>
                  <div className="text-sm text-blue-600">Meets Expectation</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white">
                      <span className="text-xs font-bold">{exceedingPct}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-800 mb-1">{exceedingCount}</div>
                  <div className="text-sm text-green-600">Exceeds Expectation</div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Welcome Back!</CardTitle>
                  <CardDescription className="text-gray-600">Here's an overview of your classes and students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Total Classes</span>
                      <span className="text-2xl font-bold text-blue-600">{classes?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Total Students</span>
                      <span className="text-2xl font-bold text-green-600">{students?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">My Classes</CardTitle>
                <CardDescription className="text-gray-400">Classes assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((classItem) => {
                      // Calculate class performance
                      const classPerf = calculateClassPerformance(
                        classItem.students.map((s: any) => typeof s === 'string' ? s : s._id || s),
                        performance
                      )
                      const perfLevel = classPerf.hasData ? getPerformanceLevel(classPerf.avgScore) : null
                      const PerfIcon = perfLevel?.icon
                      
                      return (
                        <Card 
                          key={classItem._id} 
                          className={`bg-gray-700 border-gray-600 cursor-pointer hover:shadow-lg transition-shadow ${perfLevel ? `border-l-4 ${perfLevel.borderColor}` : ''}`}
                          onClick={() => setSelectedClass(classItem)}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg text-white">{classItem.name}</CardTitle>
                            <CardDescription className="text-gray-400">
                              Grade: {classItem.grade}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">
                                {classItem.students.length} students
                              </span>
                              <Badge variant="secondary" className="bg-blue-600 text-white">
                                Active
                              </Badge>
                            </div>
                            {/* Performance Badge */}
                            {perfLevel ? (
                              <div className={`flex items-center gap-2 p-2 rounded-lg ${perfLevel.bgColor}`}>
                                <PerfIcon className={`w-4 h-4 ${perfLevel.color}`} />
                                <div className="flex-1">
                                  <p className={`text-xs font-medium ${perfLevel.color}`}>{perfLevel.level}</p>
                                  <p className={`text-xs ${perfLevel.color} opacity-80`}>Avg: {classPerf.avgScore}% • {classPerf.quizCount} quizzes</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-600">
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-400">No quiz data yet</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No classes assigned yet</p>
                )}
              </CardContent>
            </Card>

            {/* Class Details Modal */}
            {selectedClass && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedClass(null)}>
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <CardHeader className="border-b sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-gray-800">{selectedClass.name}</CardTitle>
                        <CardDescription className="text-gray-600">Grade: {selectedClass.grade} • {selectedClass.students.length} students</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="students">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                      </TabsList>

                      <TabsContent value="students" className="space-y-4 mt-4">
                        {students
                          .filter(s => selectedClass.students.includes(s._id))
                          .map((student) => {
                            const studentPerf = performance.find(p => p.studentId === student._id)
                            const avgScore = studentPerf && studentPerf.sessions.length > 0
                              ? Math.round(studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length)
                              : null
                            const perfLevel = avgScore !== null ? getPerformanceLevel(avgScore) : null
                            const PerfIcon = perfLevel?.icon
                            
                            return (
                              <div key={student._id} className={`p-4 bg-gray-50 rounded-lg border ${perfLevel ? `border-l-4 ${perfLevel.borderColor}` : ''}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-semibold text-gray-800">{student.name}</h3>
                                      {/* Performance Badge */}
                                      {perfLevel && PerfIcon ? (
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${perfLevel.bgColor}`}>
                                          <PerfIcon className={`w-3 h-3 ${perfLevel.color}`} />
                                          <span className={`text-xs font-medium ${perfLevel.color}`}>{perfLevel.level}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100">
                                          <AlertCircle className="w-3 h-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">No quiz data</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">Username: {student.username || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Class: {student.class || 'N/A'}</p>
                                    {avgScore !== null && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Avg Score: {avgScore}% • {studentPerf?.sessions.length || 0} quizzes
                                      </p>
                                    )}
                                  </div>
                                  {studentPerf && studentPerf.sessions.length > 0 && (
                                    <Badge variant="outline" className="text-sm">
                                      {studentPerf.sessions.length} quiz{studentPerf.sessions.length !== 1 ? 'es' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </TabsContent>

                      <TabsContent value="leaderboard" className="mt-4">
                        <div className="space-y-3">
                          {students
                            .filter(s => selectedClass.students.includes(s._id))
                            .map(student => {
                              const studentPerf = performance.find(p => p.studentId === student._id)
                              const avgScore = studentPerf && studentPerf.sessions.length > 0
                                ? Math.round(studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length)
                                : 0
                              return { student, avgScore, quizCount: studentPerf?.sessions.length || 0 }
                            })
                            .sort((a, b) => b.avgScore - a.avgScore)
                            .map((item, index) => (
                              <div key={item.student._id} className={`p-4 rounded-lg border flex items-center gap-4 ${
                                index === 0 ? 'bg-yellow-50 border-yellow-300' :
                                index === 1 ? 'bg-gray-50 border-gray-300' :
                                index === 2 ? 'bg-orange-50 border-orange-300' :
                                'bg-white'
                              }`}>
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                                  {index !== 0 && <span>{index + 1}</span>}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">{item.student.name}</h3>
                                  <p className="text-sm text-gray-600">{item.quizCount} quiz{item.quizCount !== 1 ? 'es' : ''} completed</p>
                                </div>
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${
                                    item.avgScore >= 80 ? 'text-green-600' :
                                    item.avgScore >= 60 ? 'text-yellow-600' :
                                    item.avgScore > 0 ? 'text-red-600' : 'text-gray-400'
                                  }`}>
                                    {item.avgScore}%
                                  </div>
                                  <div className="text-xs text-gray-500">Average</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">My Students</CardTitle>
                <CardDescription className="text-gray-400">Students in your assigned classes with last login times</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Filter */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search students by name, username, grade, or class..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="pl-10 pr-10 bg-gray-700 text-white border-gray-600"
                    />
                    {studentSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => setStudentSearchQuery("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {students
                    .filter(student => {
                      if (!studentSearchQuery) return true
                      const query = studentSearchQuery.toLowerCase()
                      return (
                        student.name.toLowerCase().includes(query) ||
                        (student.username || '').toLowerCase().includes(query) ||
                        student.grade.toLowerCase().includes(query) ||
                        (student.class || '').toLowerCase().includes(query)
                      )
                    })
                    .map((student) => {
                      // Find performance data for this student
                      const studentPerf = performance.find(p => p.studentId === student._id);
                      const lastLogin = studentPerf?.lastLoginTime ? new Date(studentPerf.lastLoginTime) : null;
                      const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      
                      return (
                        <div key={student._id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{student.name}</h3>
                            <p className="text-sm text-gray-300">{student.grade} • {student.class || 'N/A'}</p>
                            <p className="text-xs text-gray-400">Username: {student.username || 'N/A'}</p>
                            {lastLogin ? (
                              <p className="text-xs text-gray-300 mt-1">
                                Last login: {lastLogin.toLocaleDateString()} 
                                {(() => {
                                  const daysSince = daysSinceLogin || 0;
                                  return (
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                      daysSince === 0 ? 'bg-green-600 text-green-100' :
                                      daysSince <= 3 ? 'bg-yellow-600 text-yellow-100' :
                                      'bg-red-600 text-red-100'
                                    }`}>
                                      {daysSince === 0 ? 'Today' : 
                                       daysSince === 1 ? '1 day ago' : 
                                       `${daysSince} days ago`}
                                    </span>
                                  );
                                })()}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="px-2 py-1 rounded text-xs bg-gray-400 text-gray-100">
                                  Never logged in
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={
                              !lastLogin ? "border-gray-500 text-gray-400" :
                              (daysSinceLogin || 0) <= 1 ? "border-green-500 text-green-400" :
                              (daysSinceLogin || 0) <= 7 ? "border-yellow-500 text-yellow-400" :
                              "border-red-500 text-red-400"
                            }>
                              {!lastLogin ? "Never logged in" :
                               (daysSinceLogin || 0) <= 1 ? "Active" :
                               (daysSinceLogin || 0) <= 7 ? "Recent" :
                               "Inactive"}
                            </Badge>
                            {studentPerf && studentPerf.sessions.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {studentPerf.sessions.length} quiz{studentPerf.sessions.length !== 1 ? 'es' : ''} completed
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Student Performance</CardTitle>
                <CardDescription className="text-gray-400">Quiz performance of your students</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.map((studentPerf) => (
                      <div key={studentPerf.studentId} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-white">{studentPerf.studentName}</h3>
                          <Badge 
                            variant="outline" 
                            className={
                              studentPerf.sessions.length > 0
                                ? studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 80
                                  ? "border-green-500 text-green-400"
                                  : studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 60
                                  ? "border-yellow-500 text-yellow-400"
                                  : "border-red-500 text-red-400"
                                : "border-gray-500 text-gray-400"
                            }
                          >
                            {studentPerf.sessions.length > 0
                              ? studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 80
                                ? "Exceeding"
                                : studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length >= 60
                                ? "Meeting"
                                : "Below"
                              : "No Data"
                            }
                          </Badge>
                        </div>
                        
                        {studentPerf.sessions.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">
                              Total Quizzes: {studentPerf.sessions.length} | 
                              Average Score: {Math.round(studentPerf.sessions.reduce((sum, s) => sum + s.score, 0) / studentPerf.sessions.length)}%
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                              {studentPerf.sessions.slice(0, 4).map((session, index) => (
                                <div key={index} className="text-xs text-gray-300 bg-gray-600 p-2 rounded">
                                  <span className="font-medium">Score: {session.score}%</span>
                                  <span className="ml-2 text-gray-400">
                                    ({session.correctAnswers}/{session.totalQuestions})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No quiz attempts yet</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No performance data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Curriculum Documents
                </CardTitle>
                <CardDescription className="text-gray-600">Access curriculum materials and resources</CardDescription>
              </CardHeader>
              <CardContent>
                {curriculum && curriculum.length > 0 ? (
                  <div className="space-y-4">
                    {curriculum.map((item: any) => (
                      <div key={item._id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-indigo-600" />
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>📎 {item.fileName}</span>
                              <span>📅 {new Date(item.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {item.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (item.fileUrl) {
                                    window.open(item.fileUrl, '_blank')
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">No curriculum available yet</p>
                    <p className="text-gray-500 text-sm mt-2">Curriculum documents will appear here when uploaded by administrators</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}






























