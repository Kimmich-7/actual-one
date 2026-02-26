"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, BookOpen, TrendingUp, LogOut, Download, Eye, Edit2, Star, CheckCircle, Target, AlertCircle, Building2, ArrowLeft, ChevronRight, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateStudentReportCard, downloadReportCard } from "@/lib/pdf-generator"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Helper function to get performance level styling
function getPerformanceLevelStyle(level: string) {
  switch (level) {
    case "exceeding":
      return { color: "text-green-700", bgColor: "bg-green-100", borderColor: "border-green-500", icon: Star, label: "Exceeding Expectations" }
    case "meeting":
      return { color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-500", icon: CheckCircle, label: "Meeting Expectations" }
    case "approaching":
      return { color: "text-orange-700", bgColor: "bg-orange-100", borderColor: "border-orange-500", icon: Target, label: "Approaching Expectations" }
    case "below":
      return { color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-500", icon: AlertCircle, label: "Below Expectations" }
    default:
      return { color: "text-gray-700", bgColor: "bg-gray-100", borderColor: "border-gray-500", icon: AlertCircle, label: "No Data" }
  }
}

// Drill-down component for Students tab
function StudentsDrilldown({ 
  allStudents, 
  leaderboardData, 
  allProjects,
  selectedStudent,
  setSelectedStudent,
  handleGenerateReport
}: {
  allStudents: any[]
  leaderboardData: any[]
  allProjects: any[]
  selectedStudent: string | null
  setSelectedStudent: (id: string | null) => void
  handleGenerateReport: (id: any, name: string) => void
}) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Group students by grade, then by class
  const studentsByGrade: Record<string, Record<string, any[]>> = {}
  
  allStudents.forEach((student: any) => {
    const grade = student.grade || "Unassigned"
    const studentClass = student.class || grade
    
    if (!studentsByGrade[grade]) {
      studentsByGrade[grade] = {}
    }
    if (!studentsByGrade[grade][studentClass]) {
      studentsByGrade[grade][studentClass] = []
    }
    studentsByGrade[grade][studentClass].push(student)
  })

  // Sort grades
  const sortedGrades = Object.keys(studentsByGrade).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0
    const numB = parseInt(b.replace(/\D/g, '')) || 0
    return numA - numB
  })

  const classesInGrade = selectedGrade ? Object.keys(studentsByGrade[selectedGrade] || {}).sort() : []
  const studentsInClass = selectedGrade && selectedClass 
    ? studentsByGrade[selectedGrade]?.[selectedClass] || []
    : []

  // Get counts
  const getGradeStudentCount = (grade: string) => {
    const classes = studentsByGrade[grade] || {}
    return Object.values(classes).flat().length
  }

  const getClassStudentCount = (grade: string, className: string) => {
    return studentsByGrade[grade]?.[className]?.length || 0
  }

  // Calculate class average performance
  const getClassPerformance = (grade: string, className: string) => {
    const students = studentsByGrade[grade]?.[className] || []
    const scores = students.map((s: any) => {
      const data = leaderboardData.find((l: any) => l._id === s._id)
      return data?.averageScore
    }).filter((s: any) => s !== undefined && s !== null)
    
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Performance by Grade & Class</CardTitle>
            <CardDescription>
              {!selectedGrade && "Select a grade to view classes"}
              {selectedGrade && !selectedClass && `Classes in ${selectedGrade}`}
              {selectedGrade && selectedClass && `${selectedClass} - ${selectedGrade}`}
            </CardDescription>
          </div>
          {(selectedGrade || selectedClass) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedClass) {
                  setSelectedClass(null)
                } else {
                  setSelectedGrade(null)
                }
              }}
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        {(selectedGrade || selectedClass) && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <button 
              onClick={() => { setSelectedGrade(null); setSelectedClass(null); }}
              className="text-blue-600 hover:underline"
            >
              All Grades
            </button>
            {selectedGrade && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => setSelectedClass(null)}
                  className={selectedClass ? "text-blue-600 hover:underline" : "text-gray-800 font-medium"}
                >
                  {selectedGrade}
                </button>
              </>
            )}
            {selectedClass && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-800 font-medium">{selectedClass}</span>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Level 1: Grade Selection */}
        {!selectedGrade && (
          <div className="space-y-3">
            {sortedGrades.length > 0 ? (
              sortedGrades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{grade}</h3>
                      <p className="text-sm text-gray-600">
                        {getGradeStudentCount(grade)} student{getGradeStudentCount(grade) !== 1 ? 's' : ''} • {Object.keys(studentsByGrade[grade]).length} class{Object.keys(studentsByGrade[grade]).length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No students found</p>
              </div>
            )}
          </div>
        )}

        {/* Level 2: Class Selection */}
        {selectedGrade && !selectedClass && (
          <div className="space-y-3">
            {classesInGrade.length > 0 ? (
              classesInGrade.map((className) => {
                const classAvg = getClassPerformance(selectedGrade, className)
                const perfStyle = classAvg !== null ? getPerformanceLevelStyle(
                  classAvg >= 85 ? "exceeding" :
                  classAvg >= 70 ? "meeting" :
                  classAvg >= 50 ? "approaching" : "below"
                ) : null
                const PerfIcon = perfStyle?.icon

                return (
                  <button
                    key={className}
                    onClick={() => setSelectedClass(className)}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-colors text-left ${perfStyle ? `border-l-4 ${perfStyle.borderColor}` : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{className}</h3>
                        <p className="text-sm text-gray-600">
                          {getClassStudentCount(selectedGrade, className)} student{getClassStudentCount(selectedGrade, className) !== 1 ? 's' : ''}
                        </p>
                        {/* Class Performance Badge */}
                        {perfStyle && PerfIcon ? (
                          <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full w-fit ${perfStyle.bgColor}`}>
                            <PerfIcon className={`w-3 h-3 ${perfStyle.color}`} />
                            <span className={`text-xs font-medium ${perfStyle.color}`}>
                              {perfStyle.label} • Avg: {classAvg}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full w-fit bg-gray-100">
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">No quiz data</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-8">No classes found for {selectedGrade}</p>
            )}
          </div>
        )}

        {/* Level 3: Student List */}
        {selectedGrade && selectedClass && (
          <div className="space-y-3">
            {studentsInClass.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {studentsInClass.map((student: any) => {
                  const studentScore = leaderboardData.find((s: any) => s._id === student._id)
                  const avgScore = studentScore?.averageScore ?? null
                  const perfStyle = avgScore !== null ? getPerformanceLevelStyle(
                    avgScore >= 85 ? "exceeding" :
                    avgScore >= 70 ? "meeting" :
                    avgScore >= 50 ? "approaching" : "below"
                  ) : getPerformanceLevelStyle("none")
                  const PerfIcon = perfStyle.icon
                  const studentProjects = allProjects.filter((p: any) => p.studentId === student._id)

                  return (
                    <div 
                      key={student._id} 
                      className={`p-4 bg-white rounded-lg border ${avgScore !== null ? `border-l-4 ${perfStyle.borderColor}` : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.username}</p>
                        </div>
                        {/* Performance Badge */}
                        {avgScore !== null ? (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${perfStyle.bgColor}`}>
                            <PerfIcon className={`w-3 h-3 ${perfStyle.color}`} />
                            <span className={`text-xs font-medium ${perfStyle.color}`}>
                              {avgScore}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100">
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">N/A</span>
                          </div>
                        )}
                      </div>

                      {/* Performance Level Label */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className={avgScore !== null ? perfStyle.color : "text-gray-500"}>
                          {avgScore !== null ? perfStyle.label : "No quiz data"}
                        </span>
                        <span className="text-gray-500">{studentProjects.length} projects</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setSelectedStudent(student._id === selectedStudent ? null : student._id)}
                        >
                          {selectedStudent === student._id ? "Hide" : "Details"}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleGenerateReport(student._id, student.name)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Report
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      {selectedStudent === student._id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-2">Quiz Stats</p>
                          <div className="text-xs text-gray-600 mb-2">
                            <p>Total Quizzes: {studentScore?.totalQuizzes || 0}</p>
                            <p>Average Score: {avgScore ?? 'N/A'}%</p>
                          </div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Projects</p>
                          {studentProjects.length > 0 ? (
                            <div className="space-y-1">
                              {studentProjects.slice(0, 3).map((project: any) => (
                                <div key={project._id} className="text-xs p-1.5 bg-gray-50 rounded">
                                  <p className="font-medium text-gray-700 truncate">{project.title}</p>
                                  <p className="text-gray-500">{project.status}</p>
                                </div>
                              ))}
                              {studentProjects.length > 3 && (
                                <p className="text-xs text-gray-500">+{studentProjects.length - 3} more</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No projects yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No students in this class</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SchoolDashboardContent() {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [schoolAdminName, setSchoolAdminName] = useState("")

  // Authentication check - supports both school admin and regular admin
  useEffect(() => {
    const schoolAdminUser = localStorage.getItem("schoolAdminUser")
    const adminUser = localStorage.getItem("adminUser")
    
    if (schoolAdminUser) {
      try {
        const user = JSON.parse(schoolAdminUser)
        setSchoolAdminName(user.name || "School Admin")
      } catch (e) {
        console.error("Error parsing school admin data:", e)
      }
    } else if (adminUser) {
      // Allow regular admins to access school dashboard too
      try {
        const user = JSON.parse(adminUser)
        setSchoolAdminName(user.name || "Admin")
      } catch (e) {
        console.error("Error parsing admin data:", e)
      }
    } else {
      router.push("/school/login")
    }
  }, [router])

  // Leaderboard filtering state
  const [leaderboardFilters, setLeaderboardFilters] = useState({
    grade: "",
    class: "",
    course: ""
  })
  const [leaderboardView, setLeaderboardView] = useState<"list" | "graph">("list")

  // Dialog states for viewing details
  const [isViewClassDialogOpen, setIsViewClassDialogOpen] = useState(false)
  const [isViewTeacherDialogOpen, setIsViewTeacherDialogOpen] = useState(false)
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false)
  const [viewingClass, setViewingClass] = useState<any>(null)
  const [viewingTeacher, setViewingTeacher] = useState<any>(null)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [editClassForm, setEditClassForm] = useState({ name: "", grade: "" })

  // Fetch all data
  const allStudents = useQuery(api.users.getAllApprovedStudents) || []
  const allTeachers = useQuery(api.teachers.getAllTeachers) || []
  const allProjects = useQuery(api.projects.getAllProjectsSimple, {}) || []
  const allClasses = useQuery(api.users.getAllClasses) || []
  const leaderboardData = useQuery(api.users.getAllStudentsWithQuizScores) || []
  const teacherPerformanceData = useQuery(api.schoolAuth.getTeacherPerformanceData) || []

  const handleLogout = () => {
    localStorage.removeItem("schoolAdminUser")
    localStorage.removeItem("adminUser")
    router.push("/school/login")
  }

  const handleGenerateReport = async (studentId: Id<"users">, studentName: string) => {
    try {
      // Fetch report data
      const reportData = await fetch(`/api/get-report-data?studentId=${studentId}`).then(r => r.json())
      
      if (!reportData) {
        toast.error("Unable to fetch report data")
        return
      }

      // Generate PDF
      const pdf = generateStudentReportCard(reportData)
      downloadReportCard(pdf, studentName)
      toast.success(`Report card generated for ${studentName}`)
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report card")
    }
  }

  const handleViewClass = (classRecord: any) => {
    // The classRecord already has all the data we need including studentDetails
    // since classPerformance is created from allClasses which includes studentDetails
    console.log('View Class clicked:', classRecord.name)
    console.log('Class record data:', classRecord)
    console.log('Has student details:', classRecord?.studentDetails)
    setViewingClass(classRecord)
    setIsViewClassDialogOpen(true)
  }

  const handleViewTeacher = (teacher: any) => {
    const teacherClasses = allClasses.filter((c: any) => c.teacherId === teacher._id)
    setViewingTeacher({ ...teacher, classes: teacherClasses })
    setIsViewTeacherDialogOpen(true)
  }

  const handleEditClass = (classRecord: any) => {
    console.log('Edit Class clicked:', classRecord.name)
    setEditingClass(classRecord)
    setEditClassForm({
      name: classRecord.name,
      grade: classRecord.grade
    })
    setIsEditClassDialogOpen(true)
  }

  const handleSaveClassEdit = async () => {
    if (!editingClass) return
    
    // For the school dashboard, we'll show a message that editing is not available
    // This is a read-only view
    alert("Class editing is only available in the Admin panel. This is a read-only dashboard.")
    setIsEditClassDialogOpen(false)
  }

  // Use the leaderboard data from query (already sorted by quiz scores)
  const studentLeaderboard = leaderboardData.slice(0, 20)

  // Calculate class performance
  const classPerformance = allClasses.map((cls: any) => {
    const classStudents = allStudents.filter((s: any) => s.class === cls.name)
    console.log(`Class ${cls.name} has studentDetails:`, cls.studentDetails)
    return {
      ...cls,
      studentCount: classStudents.length,
      avgProjects: classStudents.length > 0
        ? Math.round(classStudents.reduce((sum: number, s: any) => {
            const projects = allProjects.filter((p: any) => p.studentId === s._id)
            return sum + projects.length
          }, 0) / classStudents.length)
        : 0,
    }
  })

  // Calculate teacher performance
  const teacherPerformance = allTeachers.map((teacher: any) => {
    const teacherClasses = allClasses.filter((c: any) => c.teacherId === teacher._id)
    const classStudentIds = new Set<string>()
    teacherClasses.forEach((cls: any) => {
      cls.students.forEach((sid: string) => classStudentIds.add(sid))
    })
    
    const studentProjects = allProjects.filter((p: any) => classStudentIds.has(p.studentId))
    return {
      ...teacher,
      classCount: teacherClasses.length,
      studentCount: classStudentIds.size,
      projectsCount: studentProjects.length,
    }
  })

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  // Filter leaderboard data based on selected filters
  const filteredLeaderboard = leaderboardData.filter((student: any) => {
    if (leaderboardFilters.grade && student.grade !== leaderboardFilters.grade) return false;
    if (leaderboardFilters.class && student.class !== leaderboardFilters.class) return false;
    return true;
  }).slice(0, 20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
                <p className="text-sm text-gray-600">School Dashboard {schoolAdminName && `• ${schoolAdminName}`}</p>
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
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Students</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{allStudents.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Teachers</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{allTeachers.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Total Projects</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <BookOpen className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{allProjects.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Classes</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <Trophy className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{allClasses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            {/* Filter Controls */}
            <Card className="border-0 shadow-lg bg-white mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Filter by Grade</div>
                    <Select value={leaderboardFilters.grade} onValueChange={(value) => setLeaderboardFilters({...leaderboardFilters, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Filter by Class</div>
                    <Select value={leaderboardFilters.class} onValueChange={(value) => setLeaderboardFilters({...leaderboardFilters, class: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        {allClasses?.map((cls: any) => (
                          <SelectItem key={cls._id} value={cls.name}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">View Type</div>
                    <div className="flex gap-2">
                      <Button
                        variant={leaderboardView === "list" ? "default" : "outline"}
                        onClick={() => setLeaderboardView("list")}
                        className="flex-1"
                      >
                        List
                      </Button>
                      <Button
                        variant={leaderboardView === "graph" ? "default" : "outline"}
                        onClick={() => setLeaderboardView("graph")}
                        className="flex-1"
                      >
                        Graph
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span>Student Leaderboard - Quiz Rankings</span>
                </CardTitle>
                <CardDescription>Students ranked by average quiz scores</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardView === "list" ? (
                  <div className="space-y-3">
                    {leaderboardData
                      .filter((student: any) => {
                        if (leaderboardFilters.grade && student.grade !== leaderboardFilters.grade) return false;
                        if (leaderboardFilters.class && student.class !== leaderboardFilters.class) return false;
                        return true;
                      })
                      .slice(0, 20).map((student: any, index: number) => (
                        <div key={student._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-blue-400 to-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.grade} • {student.class}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-purple-600">{student.averageScore}%</div>
                              <div className="text-xs text-gray-500">{student.totalQuizzes} quizzes</div>
                            </div>
                            {index === 0 && <span className="text-3xl">🏆</span>}
                            {index === 1 && <span className="text-3xl">🥈</span>}
                            {index === 2 && <span className="text-3xl">🥉</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-700 text-lg font-semibold mb-2">Class Performance by Grade</p>
                      <p className="text-gray-500 text-sm">Average quiz scores per stream {leaderboardFilters.grade ? `- ${leaderboardFilters.grade}` : '- All Grades (filter above to view specific grade)'}</p>
                    </div>
                    
                    {(() => {
                      // Group students by grade and class, calculate averages
                      const classPerformanceData: Record<string, { className: string; avgScore: number; studentCount: number; totalScore: number }[]> = {}
                      
                      leaderboardData.forEach((student: any) => {
                        const grade = student.grade || "Unassigned"
                        const className = student.class || grade
                        
                        if (!classPerformanceData[grade]) {
                          classPerformanceData[grade] = []
                        }
                        
                        let classEntry = classPerformanceData[grade].find(c => c.className === className)
                        if (!classEntry) {
                          classEntry = { className, avgScore: 0, studentCount: 0, totalScore: 0 }
                          classPerformanceData[grade].push(classEntry)
                        }
                        
                        if (student.averageScore !== undefined && student.averageScore !== null) {
                          classEntry.totalScore += student.averageScore
                          classEntry.studentCount += 1
                        }
                      })
                      
                      // Calculate averages
                      Object.values(classPerformanceData).forEach(classes => {
                        classes.forEach(cls => {
                          if (cls.studentCount > 0) {
                            cls.avgScore = Math.round(cls.totalScore / cls.studentCount)
                          }
                        })
                      })
                      
                      // Filter classes based on selected grade or show all
                      const selectedGradeFilter = leaderboardFilters.grade
                      const availableGrades = Object.keys(classPerformanceData).sort((a, b) => {
                        const numA = parseInt(a.replace(/\D/g, '')) || 0
                        const numB = parseInt(b.replace(/\D/g, '')) || 0
                        return numA - numB
                      })
                      
                      const classesToShow = selectedGradeFilter 
                        ? classPerformanceData[selectedGradeFilter] || []
                        : availableGrades.flatMap(g => classPerformanceData[g] || [])
                      
                      // Sort classes alphabetically
                      const sortedClasses = [...classesToShow].sort((a, b) => a.className.localeCompare(b.className))
                      
                      // Get bar color based on score
                      const getBarColor = (score: number) => {
                        if (score >= 85) return 'bg-green-500'
                        if (score >= 70) return 'bg-blue-500'
                        if (score >= 50) return 'bg-yellow-500'
                        return 'bg-red-500'
                      }
                      
                      if (sortedClasses.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No quiz data available yet. Students need to complete quizzes first.</p>
                          </div>
                        )
                      }
                      
                      const maxBarHeight = 200 // pixels
                      
                      return (
                        <div className="bg-gray-900 rounded-xl p-6">
                          {/* Chart container with axes */}
                          <div className="relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-400">
                              <span>100%</span>
                              <span>75%</span>
                              <span>50%</span>
                              <span>25%</span>
                              <span>0%</span>
                            </div>
                            
                            {/* Chart area */}
                            <div className="ml-12 mr-4">
                              {/* Grid lines */}
                              <div className="absolute left-12 right-4 top-0" style={{ height: maxBarHeight }}>
                                {[0, 25, 50, 75, 100].map((val) => (
                                  <div 
                                    key={val} 
                                    className="absolute left-0 right-0 border-t border-gray-700"
                                    style={{ top: `${100 - val}%` }}
                                  />
                                ))}
                              </div>
                              
                              {/* Bars container */}
                              <div 
                                className="flex items-end justify-around gap-3 relative"
                                style={{ height: maxBarHeight }}
                              >
                                {sortedClasses.map((cls, index) => (
                                  <div key={cls.className + index} className="flex flex-col items-center flex-1 max-w-24">
                                    {/* Score label on top */}
                                    <span className="text-white text-sm font-bold mb-1">{cls.avgScore}%</span>
                                    
                                    {/* Bar */}
                                    <div 
                                      className={`w-full rounded-t-md transition-all duration-700 ${getBarColor(cls.avgScore)} min-w-8`}
                                      style={{ 
                                        height: `${Math.max((cls.avgScore / 100) * maxBarHeight, 8)}px`,
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {/* X-axis line */}
                              <div className="border-t-2 border-gray-500 mt-0" />
                              
                              {/* X-axis labels (class names) */}
                              <div className="flex justify-around gap-3 mt-2">
                                {sortedClasses.map((cls, index) => (
                                  <div key={cls.className + index + 'label'} className="flex-1 max-w-24 text-center">
                                    <span className="text-gray-300 text-xs font-medium">{cls.className}</span>
                                    <p className="text-gray-500 text-xs">{cls.studentCount} students</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Y-axis arrow */}
                            <div className="absolute left-10 -top-2 text-gray-400">↑</div>
                            
                            {/* X-axis arrow */}
                            <div className="absolute right-0 bottom-6 text-gray-400">→</div>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded" />
                              <span className="text-xs text-gray-400">≥85% Exceeding</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded" />
                              <span className="text-xs text-gray-400">70-84% Meeting</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded" />
                              <span className="text-xs text-gray-400">50-69% Approaching</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded" />
                              <span className="text-xs text-gray-400">&lt;50% Below</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab - Drill-down by Grade and Stream */}
          <TabsContent value="students">
            <StudentsDrilldown 
              allStudents={allStudents}
              leaderboardData={leaderboardData}
              allProjects={allProjects}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              handleGenerateReport={handleGenerateReport}
            />
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Teacher Performance Overview
                </CardTitle>
                <CardDescription>Individual teacher performance based on class quiz results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherPerformanceData.map((teacher: any) => {
                    const perfStyle = getPerformanceLevelStyle(teacher.overallPerformanceLevel)
                    const PerfIcon = perfStyle.icon
                    
                    return (
                      <div key={teacher.teacherId} className={`p-4 bg-gray-50 rounded-lg border-l-4 ${perfStyle.borderColor} border border-gray-200`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-800 text-lg">{teacher.teacherName}</h3>
                              {/* Performance Badge */}
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${perfStyle.bgColor}`}>
                                <PerfIcon className={`w-4 h-4 ${perfStyle.color}`} />
                                <span className={`text-xs font-medium ${perfStyle.color}`}>{perfStyle.label}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {teacher.subjects?.join(", ") || "No subjects assigned"}
                            </p>
                            
                            {/* Performance Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-white p-2 rounded border">
                                <p className="text-xs text-gray-500">Overall Score</p>
                                <p className={`text-lg font-bold ${perfStyle.color}`}>{teacher.overallAvgScore}%</p>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <p className="text-xs text-gray-500">Classes</p>
                                <p className="text-lg font-bold text-blue-600">{teacher.classCount}</p>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <p className="text-xs text-gray-500">Students</p>
                                <p className="text-lg font-bold text-green-600">{teacher.studentCount}</p>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <p className="text-xs text-gray-500">Total Quizzes</p>
                                <p className="text-lg font-bold text-orange-600">{teacher.totalQuizzes}</p>
                              </div>
                            </div>
                            
                            {/* Class Performance Breakdown */}
                            {teacher.classCount > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500 mr-2">Class Performance:</span>
                                {teacher.performanceBreakdown.exceeding > 0 && (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <Star className="w-3 h-3 mr-1" />
                                    {teacher.performanceBreakdown.exceeding} Exceeding
                                  </Badge>
                                )}
                                {teacher.performanceBreakdown.meeting > 0 && (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {teacher.performanceBreakdown.meeting} Meeting
                                  </Badge>
                                )}
                                {teacher.performanceBreakdown.approaching > 0 && (
                                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                    <Target className="w-3 h-3 mr-1" />
                                    {teacher.performanceBreakdown.approaching} Approaching
                                  </Badge>
                                )}
                                {teacher.performanceBreakdown.below > 0 && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {teacher.performanceBreakdown.below} Below
                                  </Badge>
                                )}
                                {teacher.performanceBreakdown.noData > 0 && (
                                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                                    {teacher.performanceBreakdown.noData} No Data
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTeacher(teacherPerformance.find((t: any) => t._id === teacher.teacherId) || teacher)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {teacherPerformanceData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No teacher data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
                <CardDescription>Overview of each class and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classPerformance.map((cls: any) => (
                    <div key={cls._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                          <p className="text-sm text-gray-600">Grade: {cls.grade}</p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <Badge variant="outline" className="bg-blue-50">{cls.studentCount} Students</Badge>
                          <Badge variant="outline" className="bg-orange-50">{cls.avgProjects} Avg Projects</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClass(cls)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>All Student Projects</CardTitle>
                <CardDescription>View all projects submitted by students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allProjects.slice(0, 50).map((project: any) => (
                    <div key={project._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{project.title}</h3>
                          <p className="text-sm text-gray-600">
                            By: {project.studentName} | {project.studentGrade}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(project.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge variant={project.status === "approved" ? "default" : "secondary"}>
                            {project.status}
                          </Badge>
                          {project.projectUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(project.projectUrl, "_blank")}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Class Dialog */}
      <Dialog open={isViewClassDialogOpen} onOpenChange={setIsViewClassDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Details: {viewingClass?.name}</DialogTitle>
            <DialogDescription>Students enrolled in this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Grade</p>
                <p className="font-semibold text-gray-800">{viewingClass?.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="font-semibold text-gray-800">{viewingClass?.studentCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teacher</p>
                <p className="font-semibold text-gray-800">
                  {allTeachers?.find(t => t._id === viewingClass?.teacherId)?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Projects</p>
                <p className="font-semibold text-gray-800">{viewingClass?.avgProjects || 0}</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              <h4 className="font-semibold text-gray-800 mb-3">Students in this class:</h4>
              {viewingClass?.studentDetails && viewingClass.studentDetails.length > 0 ? (
                viewingClass.studentDetails.map((student: any) => (
                  <div key={student._id} className="p-3 border rounded bg-white">
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.grade} • {student.username}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No students enrolled in this class</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={isViewTeacherDialogOpen} onOpenChange={setIsViewTeacherDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Details: {viewingTeacher?.name}</DialogTitle>
            <DialogDescription>Classes and performance overview</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-800">{viewingTeacher?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-semibold text-gray-800">{viewingTeacher?.username || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="font-semibold text-gray-800">
                  {viewingTeacher?.teacherSubjects?.join(", ") || "No subjects assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="font-semibold text-gray-800">{viewingTeacher?.classCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="font-semibold text-gray-800">{viewingTeacher?.studentCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="font-semibold text-gray-800">{viewingTeacher?.projectsCount || 0}</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              <h4 className="font-semibold text-gray-800 mb-3">Assigned Classes:</h4>
              {viewingTeacher?.classes && viewingTeacher.classes.length > 0 ? (
                viewingTeacher.classes.map((cls: any) => (
                  <div key={cls._id} className="p-3 border rounded bg-white">
                    <p className="font-medium text-gray-800">{cls.name}</p>
                    <p className="text-sm text-gray-600">{cls.grade} • {cls.students?.length || 0} students</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No classes assigned</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}












