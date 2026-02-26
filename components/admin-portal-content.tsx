"use client"

// Admin Portal Content - Student Management System
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { LogOut, Users, GraduationCap, BookOpen, UserPlus, Trash2, Edit, School, ChevronDown, ExternalLink, Trophy, Download, FolderOpen, ClipboardList, FileText, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateStudentReportCard, downloadReportCard } from "@/lib/pdf-generator"
import { toast } from "sonner"
import AdminNotesContent from "@/components/admin-notes-content"
import AdminCurriculumContent from "@/components/admin-curriculum-content"
import AdminExamContent from "@/components/admin-exam-content"
import AdminPendingContent from "@/components/admin-pending-content"
import AdminStudentsContent from "@/components/admin-students-content"

export default function AdminPortalContent() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("overview")

  // Check admin authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminUser")
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin)
        if (admin.role === "admin") {
          setIsAdmin(true)
          setIsChecking(false)
        } else {
          // Invalid role, redirect to login
          localStorage.removeItem("adminUser")
          window.location.href = "/admin/login"
        }
      } catch (error) {
        console.error("Error parsing admin user:", error)
        localStorage.removeItem("adminUser")
        window.location.href = "/admin/login"
      }
    } else {
      // No admin found, redirect to login
      window.location.href = "/admin/login"
    }
  }, [router])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminUser")
    setIsAdmin(false)
    router.push("/admin/login")
  }

  // Handle edit class
  const handleEditClass = (classItem: any) => {
    console.log('Edit class clicked:', classItem)
    setEditingClass(classItem)
    setEditClassForm({
      name: classItem.name,
      grade: classItem.grade,
      teacherId: classItem.teacherId || "none"
    })
  }

  // Handle update class
  const handleUpdateClass = async () => {
    if (!editingClass) return

    try {
      // Update class name and grade
      await editClass({
        classId: editingClass._id,
        name: editClassForm.name,
        grade: editClassForm.grade,
      })

      // Handle teacher assignment change
      const oldTeacherId = editingClass.teacherId
      const newTeacherId = editClassForm.teacherId === "none" ? "" : editClassForm.teacherId

      if (oldTeacherId && oldTeacherId !== newTeacherId) {
        // Remove old teacher assignment
        await removeTeacherFromClass({
          teacherId: oldTeacherId,
          classId: editingClass._id
        })
      }

      if (newTeacherId && newTeacherId !== oldTeacherId) {
        // Assign new teacher
        await assignTeacherToClass({
          teacherId: newTeacherId as Id<"users">,
          classId: editingClass._id
        })
      }

      setEditingClass(null)
      setEditClassForm({ name: "", grade: "", teacherId: "none" })
      toast.success("Class updated successfully!")
    } catch (error) {
      console.error("Error updating class:", error)
      toast.error("Error updating class")
    }
  }

  // Toggle grade expansion
  const toggleGradeExpansion = (grade: string) => {
    setExpandedGrades(prev => ({
      ...prev,
      [grade]: !prev[grade]
    }))
  }

  // Form states
  const [singleStudentForm, setSingleStudentForm] = useState({
    name: "",
    grade: "",
    school: "Juja St. Peters School",
    username: "",
    password: "",
    class: ""
  })

  const [bulkStudentsText, setBulkStudentsText] = useState("")
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    grade: "",
    username: "",
    password: "",
    class: ""
  })

  // Class form state
  const [classForm, setClassForm] = useState({
    name: "",
    grade: "",
    teacherId: ""
  })

  // View students dialog state
  const [viewingClass, setViewingClass] = useState<any>(null)
  const [addingStudentsToClass, setAddingStudentsToClass] = useState<any>(null)
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<string[]>([])
  const [editingClass, setEditingClass] = useState<any>(null)
  const [editClassForm, setEditClassForm] = useState({ name: "", grade: "", teacherId: "none" })

  // Teacher and Parent editing state
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [editTeacherForm, setEditTeacherForm] = useState({ name: "", email: "", subject: "", username: "", password: "" })
  const [editingParent, setEditingParent] = useState<any>(null)
  const [editParentForm, setEditParentForm] = useState({ name: "", email: "", childUsername: "", username: "", password: "" })

  // Performance tracking state
  const [performanceFilters, setPerformanceFilters] = useState({
    grade: "",
    class: "",
    course: "" as string
  })

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [editQuestionForm, setEditQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    difficulty: "Easy"
  })

  // Quiz creation state
  const [quizForm, setQuizForm] = useState({
    courseId: "",
    title: "",
    description: "",
    timeLimit: 30
  })

  // Question upload state
  const [questionForm, setQuestionForm] = useState({
    quizId: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    difficulty: "Easy"
  })

  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState<any>(null)

  // Project filtering state
  const [projectFilters, setProjectFilters] = useState({
    grade: "",
    class: "",
    course: "",
    student: ""
  })

  // Leaderboard filtering state
  const [leaderboardFilters, setLeaderboardFilters] = useState({
    grade: "",
    class: "",
    course: ""
  })
  const [leaderboardView, setLeaderboardView] = useState<"list" | "graph">("list")

  // Student filtering state
  const [studentFilters, setStudentFilters] = useState({
    name: "",
    grade: "all",
    class: "all"
  })

  // Teacher and Parent filtering state
  const [teacherFilters, setTeacherFilters] = useState({
    name: ""
  })
  
  const [parentFilters, setParentFilters] = useState({
    name: "",
    grade: ""
  })

  // Convex queries and mutations
  const pendingStudents = useQuery(api.users.getPendingStudents)
  const allStudents = useQuery(api.users.getAllApprovedStudents)
  const allClasses = useQuery(api.users.getAllClasses)
  const studentStats = useQuery(api.users.getStudentStatistics)
  const availableStudents = useQuery(api.users.getAvailableStudentsForClass, 
    addingStudentsToClass ? { classId: addingStudentsToClass._id } : "skip"
  )
  const allCourses = useQuery(api.courses.getAllCourses)
  const performanceData = useQuery(api.quiz.getStudentPerformance, 
    (performanceFilters.grade || performanceFilters.class || performanceFilters.course)
      ? {
          gradeFilter: performanceFilters.grade || undefined,
          classFilter: performanceFilters.class || undefined,
          courseFilter: (performanceFilters.course || undefined) as Id<"courses"> | undefined
        }
      : "skip"
  )
  const quizStats = useQuery(api.quizManagement.getQuizStatistics, {})
  const allTeachers = useQuery(api.teachers.getAllTeachers, {})
  const allParents = useQuery(api.parents.getAllParents, {})
  const allQuizzes = useQuery(api.quizManagement.getAllQuizzesWithDetailsSimple, {})
  const allProjects = useQuery(api.projects.getAllProjectsSimple, 
    {
      gradeFilter: projectFilters.grade || undefined,
      courseFilter: (projectFilters.course || undefined) as Id<"courses"> | undefined,
      classFilter: projectFilters.class || undefined,
      studentFilter: (projectFilters.student || undefined) as Id<"users"> | undefined,
    }
  )
  const leaderboardData = useQuery(api.users.getAllStudentsWithQuizScores) || []

  // Handle loading and error states for projects
  const projectsData = allProjects || []

  const approveStudent = useMutation(api.users.approveStudent)
  const rejectStudent = useMutation(api.users.rejectStudent)
  const createStudent = useMutation(api.users.createStudentByAdmin)
  const bulkCreateStudents = useMutation(api.users.bulkCreateStudents)
  const deleteStudent = useMutation(api.users.deleteStudent)
  const updateStudent = useMutation(api.users.updateStudent)
  const createClass = useMutation(api.users.createClass)
  const deleteClass = useMutation(api.users.deleteClass)
  const editClass = useMutation(api.users.editClass)
  const assignStudentToClass = useMutation(api.users.assignStudentToClass)
  const removeStudentFromClass = useMutation(api.users.removeStudentFromClass)
  const createQuiz = useMutation(api.quizManagement.createQuizSimple)
  const addQuestionToQuiz = useMutation(api.quizManagement.addQuestionToQuizSimple)
  const deleteQuiz = useMutation(api.quizManagement.deleteQuizSimple)
  const deleteProject = useMutation(api.projects.deleteProjectSimple)
  const deleteQuestionFromQuiz = useMutation(api.quizManagement.deleteQuestionFromQuiz)
  const updateQuestion = useMutation(api.quizManagement.updateQuestion)
  const getQuestionDetails = useQuery(api.quizManagement.getQuestionDetails, 
    editingQuestion ? { questionId: editingQuestion._id } : "skip"
  )
  // Remove the problematic getQuestionDetails query that's called without arguments
  const updateTeacher = useMutation(api.teachers.updateTeacher)
  const deleteTeacher = useMutation(api.teachers.deleteTeacher)
  const updateParent = useMutation(api.parents.updateParent)
  const deleteParent = useMutation(api.parents.deleteParent)
  const createDummyAccounts = useMutation(api.createDummyAccounts.createDummyAccounts)
  const assignTeacherToClass = useMutation(api.teachers.assignTeacherToClass)
  const removeTeacherFromClass = useMutation(api.teachers.removeTeacherFromClass)

  const handleGenerateReport = async (studentId: Id<"users">, studentName: string) => {
    try {
      toast.info("Generating report card...")
      
      // Fetch report data
      const reportData = await fetch(`/api/get-report-data?studentId=${studentId}`).then(r => r.json())
      
      if (!reportData || reportData.error) {
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

  // Teacher management handlers
  const handleEditTeacher = (teacher: any) => {
    console.log('Edit teacher clicked:', teacher)
    setEditingTeacher(teacher)
    setEditTeacherForm({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? teacher.teacherSubjects[0] : "",
      username: teacher.username || "",
      password: teacher.password || ""
    })
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return

    try {
      await updateTeacher({
        teacherId: editingTeacher._id,
        name: editTeacherForm.name,
        email: editTeacherForm.email,
        username: editTeacherForm.username,
        password: editTeacherForm.password,
        subjects: editTeacherForm.subject ? [editTeacherForm.subject] : undefined
      })
      setEditingTeacher(null)
      setEditTeacherForm({ name: "", email: "", subject: "", username: "", password: "" })
      alert("Teacher updated successfully!")
    } catch (error) {
      console.error("Error updating teacher:", error)
      alert("Error updating teacher")
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await deleteTeacher({ teacherId: teacherId as any })
        alert("Teacher deleted successfully!")
      } catch (error) {
        console.error("Error deleting teacher:", error)
        alert("Error deleting teacher")
      }
    }
  }

  // Parent management handlers
  const handleEditParent = (parent: any) => {
    console.log('Edit parent clicked:', parent)
    setEditingParent(parent)
    setEditParentForm({
      name: parent.name,
      email: parent.email,
      childUsername: parent.childUsername || "",
      username: parent.username || "",
      password: parent.password || ""
    })
  }

  const handleUpdateParent = async () => {
    if (!editingParent) return

    try {
      await updateParent({
        parentId: editingParent._id,
        name: editParentForm.name,
        email: editParentForm.email,
        username: editParentForm.username,
        password: editParentForm.password
      })
      setEditingParent(null)
      setEditParentForm({ name: "", email: "", childUsername: "", username: "", password: "" })
      alert("Parent updated successfully!")
    } catch (error) {
      console.error("Error updating parent:", error)
      alert("Error updating parent")
    }
  }

  const handleDeleteParent = async (parentId: string) => {
    if (confirm("Are you sure you want to delete this parent?")) {
      try {
        await deleteParent({ parentId: parentId as any })
        alert("Parent deleted successfully!")
      } catch (error) {
        console.error("Error deleting parent:", error)
        alert("Error deleting parent")
      }
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      try {
        await deleteQuiz({ quizId: quizId as any })
        alert("Quiz deleted successfully!")
      } catch (error) {
        console.error("Error deleting quiz:", error)
        alert("Error deleting quiz")
      }
    }
  }

  const handleCreateSingleStudent = async () => {
    if (!singleStudentForm.name || !singleStudentForm.grade || !singleStudentForm.username || !singleStudentForm.password) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await createStudent(singleStudentForm)
      setSingleStudentForm({
        name: "",
        grade: "",
        school: "Juja St. Peters School",
        username: "",
        password: "",
        class: ""
      })
      alert("Student created successfully!")
    } catch (error) {
      console.error("Error creating student:", error)
      alert("Error creating student: " + (error as Error).message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setBulkStudentsText(text)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleBulkCreate = async () => {
    if (!bulkStudentsText.trim()) {
      alert("Please enter student data")
      return
    }

    try {
      const lines = bulkStudentsText.trim().split('\n')
      const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines
      
      const students = dataLines.map(line => {
        const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        let fields = line.split(csvRegex).map(field => 
          field.replace(/^["']|["']$/g, '').trim()
        )
        
        if (fields.length === 1) {
          fields = line.split('\t').map(field => field.trim())
        }
        
        if (fields.length === 1) {
          fields = line.split(';').map(field => field.trim())
        }
        
        const [name, grade, username, password, classField] = fields
        
        if (!name || !username || !password) {
          console.warn('Skipping invalid row:', line)
          return null
        }
        
        const cleanName = name.replace(/[^\w\s.-]/g, '').trim()
        
        if (!cleanName) {
          console.warn('Skipping row with invalid name:', line)
          return null
        }
        
        return {
          name: cleanName,
          grade: grade || "Grade 1",
          school: "Juja St. Peters School",
          username: username.trim(),
          password: password.trim(),
          class: classField?.trim() || grade || "Grade 1"
        }
      }).filter((student): student is NonNullable<typeof student> => student !== null)

      if (students.length === 0) {
        alert("No valid student data found. Please check the CSV format:\nName,Grade,Username,Password,Class\n\nMake sure names contain only letters, numbers, spaces, dots, and hyphens.")
        return
      }

      await bulkCreateStudents({ students })
      setBulkStudentsText("")
      alert(`Successfully created ${students.length} students!`)
    } catch (error) {
      console.error("Error bulk creating students:", error)
      alert("Error creating students: " + (error as Error).message)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent({ studentId: studentId as any })
        alert("Student deleted successfully!")
      } catch (error) {
        console.error("Error deleting student:", error)
        alert("Error deleting student")
      }
    }
  }

  const handleEditStudent = (student: any) => {
    console.log('Edit student clicked:', student)
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      grade: student.grade,
      username: student.username,
      password: student.password || "",
      class: student.class || student.grade
    })
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return

    try {
      await updateStudent({
        studentId: editingStudent._id as any,
        ...editForm
      })
      setEditingStudent(null)
      setEditForm({ name: "", grade: "", username: "", password: "", class: "" })
      alert("Student updated successfully!")
    } catch (error) {
      console.error("Error updating student:", error)
      alert("Error updating student")
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent = "Name,Grade,Username,Password,Class\nJohn Doe,Grade 1,johndoe,password123,Grade 1\nJane Smith,Grade 2,janesmith,password456,Grade 2"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Handle class creation
  const handleCreateClass = async () => {
    if (!classForm.name || !classForm.grade) {
      alert("Please fill in all required fields")
      return
    }

    if (!classForm.teacherId) {
      alert("Please assign a teacher to this class")
      return
    }

    try {
      await createClass({
        name: classForm.name,
        grade: classForm.grade,
        teacherId: classForm.teacherId as any
      })
      setClassForm({ name: "", grade: "", teacherId: "" })
      alert("Class created successfully!")
    } catch (error) {
      console.error("Error creating class:", error)
      alert("Error creating class: " + (error as Error).message)
    }
  }

  // Handle class deletion
  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class? Students will be moved back to their grade-based classes.")) {
      try {
        await deleteClass({ classId: classId as any })
        alert("Class deleted successfully!")
      } catch (error) {
        console.error("Error deleting class:", error)
        alert("Error deleting class: " + (error as Error).message)
      }
    }
  }

  // Handle adding students to class
  const handleAddStudentsToClass = async () => {
    if (!addingStudentsToClass || selectedStudentsToAdd.length === 0) {
      alert("Please select students to add")
      return
    }

    try {
      for (const studentId of selectedStudentsToAdd) {
        await assignStudentToClass({
          studentId: studentId as any,
          classId: addingStudentsToClass._id
        })
      }
      setAddingStudentsToClass(null)
      setSelectedStudentsToAdd([])
      alert(`Successfully added ${selectedStudentsToAdd.length} students to ${addingStudentsToClass.name}!`)
    } catch (error) {
      console.error("Error adding students to class:", error)
      alert("Error adding students to class: " + (error as Error).message)
    }
  }

  // Handle removing student from class
  const handleRemoveStudentFromClass = async (studentId: string, classId: string) => {
    if (confirm("Are you sure you want to remove this student from the class?")) {
      try {
        await removeStudentFromClass({
          studentId: studentId as any,
          classId: classId as any
        })
        alert("Student removed from class successfully!")
      } catch (error) {
        console.error("Error removing student from class:", error)
        alert("Error removing student from class: " + (error as Error).message)
      }
    }
  }

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  if (isChecking || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
                <p className="text-sm text-gray-600">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogout}
                variant="outline"
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
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{studentStats?.totalStudents || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{studentStats?.approvedStudents || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
              <BookOpen className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">{studentStats?.pendingStudents || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{allClasses?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-12 mb-8 bg-gray-100/80 p-1.5 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <School className="w-4 h-4 mr-2" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="parents" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Parents
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <FolderOpen className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filter Controls */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label>Filter by Grade</Label>
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
                    <Label>Filter by Class</Label>
                    <Select value={leaderboardFilters.class} onValueChange={(value) => setLeaderboardFilters({...leaderboardFilters, class: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        {allClasses?.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Course</Label>
                    <Select value={leaderboardFilters.course} onValueChange={(value) => setLeaderboardFilters({...leaderboardFilters, course: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCourses?.map((course) => (
                          <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>View Type</Label>
                    <div className="flex gap-2 mt-2">
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
                <CardDescription>Top performing students ranked by quiz scores</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardView === "list" ? (
                  <div className="space-y-4">
                    {leaderboardData && leaderboardData.length > 0 ? (
                      leaderboardData
                        .filter((student: any) => {
                          if (leaderboardFilters.grade && student.grade !== leaderboardFilters.grade) return false;
                          if (leaderboardFilters.class && student.class !== leaderboardFilters.class) return false;
                          return true;
                        })
                        .slice(0, 20).map((student: any, index: number) => {
                          const maxScore = 100;
                          const barWidth = (student.averageScore / maxScore) * 100;
                          
                          return (
                            <div key={student._id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                    'bg-gradient-to-br from-blue-400 to-blue-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{student.name}</p>
                                    <p className="text-xs text-gray-600">{student.grade} • {student.class}</p>
                                  </div>
                                </div>
                                <div className="text-right flex items-center space-x-2">
                                  <div>
                                    <div className="text-lg font-bold text-purple-600">{student.averageScore}%</div>
                                    <div className="text-xs text-gray-500">{student.totalQuizzes} quizzes</div>
                                  </div>
                                  {index === 0 && <span className="text-2xl">🏆</span>}
                                  {index === 1 && <span className="text-2xl">🥈</span>}
                                  {index === 2 && <span className="text-2xl">🥉</span>}
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                    'bg-gradient-to-r from-blue-400 to-blue-500'
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg">No quiz data available yet</p>
                        <p className="text-gray-500 text-sm mt-2">Students will appear here once they complete quizzes</p>
                      </div>
                    )}
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
                      
                      leaderboardData?.forEach((student: any) => {
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
                            <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
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

          {/* Pending Students Tab */}
          <TabsContent value="pending" className="space-y-6">
            <AdminPendingContent />
          </TabsContent>

          {/* Manage Students Tab */}
          <TabsContent value="manage" className="space-y-6">
            <AdminStudentsContent />
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            {/* Create New Class */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span>Create New Class</span>
                </CardTitle>
                <CardDescription>Create a new class and assign a teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="class-name">Class Name</Label>
                    <Input
                      id="class-name"
                      placeholder="e.g., Grade 1A"
                      value={classForm.name}
                      onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-grade">Grade</Label>
                    <Select value={classForm.grade} onValueChange={(value) => setClassForm({...classForm, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="class-teacher">Assign Teacher</Label>
                    <Select value={classForm.teacherId} onValueChange={(value) => setClassForm({...classForm, teacherId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Teacher</SelectItem>
                        {allTeachers?.map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateClass} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Create Class
                </Button>
              </CardContent>
            </Card>

            {/* Grade Structure Display */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <School className="w-5 h-5 text-purple-600" />
                  <span>School Structure</span>
                </CardTitle>
                <CardDescription>Overview of all grades and their classes</CardDescription>
              </CardHeader>
              <CardContent>
                {allClasses && allClasses.length > 0 ? (
                  <div className="space-y-4">
                    {grades.map((grade) => {
                      const gradeClasses = allClasses.filter((cls: any) => cls.grade === grade)
                      if (gradeClasses.length === 0) return null
                      
                      return (
                        <div key={grade} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                          <button
                            onClick={() => toggleGradeExpansion(grade)}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <GraduationCap className="w-5 h-5 text-purple-600" />
                              <h3 className="font-semibold text-gray-800">{grade}</h3>
                              <Badge variant="secondary">{gradeClasses.length} class{gradeClasses.length !== 1 ? 'es' : ''}</Badge>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedGrades[grade] ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {expandedGrades[grade] && (
                            <div className="mt-4 space-y-3">
                              {gradeClasses.map((classItem: any) => (
                                <div key={classItem._id} className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium text-gray-900">{classItem.name}</h3>
                                      <p className="text-sm text-gray-600">
                                        Teacher: {classItem.teacherName || 'Not assigned'} • 
                                        Students: {classItem.students?.length || 0}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setViewingClass(classItem)}
                                          >
                                            <Users className="w-4 h-4 mr-1" />
                                            View
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                          <DialogHeader>
                                            <DialogTitle>Class Details: {viewingClass?.name}</DialogTitle>
                                            <DialogDescription>
                                              Select students to add to this class
                                            </DialogDescription>
                                          </DialogHeader>
                                          {viewingClass && (() => {
                                            const students = viewingClass.studentDetails || viewingClass.students || [];
                                            console.log('View Class Dialog - students:', students);
                                            return (
                                            <div className="space-y-4">
                                              <div>
                                                <h4 className="font-medium mb-2">Class Information</h4>
                                                <p className="text-sm text-gray-600">Grade: {viewingClass.grade}</p>
                                                <p className="text-sm text-gray-600">Teacher: {viewingClass.teacherName || 'Not assigned'}</p>
                                                <p className="text-sm text-gray-600">Total Students: {students.length}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-medium mb-2">Students in this class</h4>
                                                {students.length > 0 ? (
                                                  <div className="space-y-2">
                                                    {students
                                                      .filter((student: any) => student.name && student.name.trim() !== '' && student.username && student.username.trim() !== '')
                                                      .map((student: any) => (
                                                      <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                                        <div>
                                                          <p className="font-medium">{student.name}</p>
                                                          <p className="text-sm text-gray-600">Username: {student.username}</p>
                                                        </div>
                                                        <Button
                                                          onClick={() => handleRemoveStudentFromClass(student._id, viewingClass._id)}
                                                          variant="destructive"
                                                          size="sm"
                                                        >
                                                          Remove
                                                        </Button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-gray-500">No students in this class yet</p>
                                                )}
                                              </div>
                                              <Button
                                                onClick={() => {
                                                  setAddingStudentsToClass(viewingClass)
                                                  setViewingClass(null)
                                                }}
                                                className="w-full"
                                              >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Add Students to Class
                                              </Button>
                                            </div>
                                            );
                                          })()}
                                        </DialogContent>
                                      </Dialog>
                                      <Dialog open={editingClass?._id === classItem._id} onOpenChange={(open) => !open && setEditingClass(null)}>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditClass(classItem)}
                                          >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit Class</DialogTitle>
                                            <DialogDescription>Update class information and teacher assignment</DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label htmlFor="edit-class-name">Class Name</Label>
                                              <Input
                                                id="edit-class-name"
                                                value={editClassForm.name}
                                                onChange={(e) => setEditClassForm({...editClassForm, name: e.target.value})}
                                                placeholder="e.g., Grade 1A"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="edit-class-grade">Grade</Label>
                                              <Select value={editClassForm.grade} onValueChange={(value) => setEditClassForm({...editClassForm, grade: value})}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {grades.map((grade) => (
                                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label htmlFor="edit-class-teacher">Assigned Teacher</Label>
                                              <Select value={editClassForm.teacherId} onValueChange={(value) => setEditClassForm({...editClassForm, teacherId: value})}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">No Teacher</SelectItem>
                                                  {allTeachers?.map((teacher) => (
                                                    <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <Button onClick={handleUpdateClass} className="w-full bg-blue-600 hover:bg-blue-700">
                                              Update Class
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        onClick={() => handleDeleteClass(classItem._id)}
                                        variant="destructive"
                                        size="sm"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <School className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No classes found</p>
                    <p className="text-sm text-gray-400 mt-2">Create a class to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>All Students</span>
                </CardTitle>
                <CardDescription>View and manage all approved students</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div>
                    <Label>Filter by Name</Label>
                    <Input
                      placeholder="Search student name..."
                      value={studentFilters.name}
                      onChange={(e) => setStudentFilters({...studentFilters, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Filter by Grade</Label>
                    <Select value={studentFilters.grade} onValueChange={(value) => setStudentFilters({...studentFilters, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All grades</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Class</Label>
                    <Select value={studentFilters.class} onValueChange={(value) => setStudentFilters({...studentFilters, class: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {allClasses?.map((cls: any) => (
                          <SelectItem key={cls._id} value={cls.name}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Students List */}
                {allStudents && allStudents.length > 0 ? (
                  <div className="space-y-4">
                    {allStudents
                      .filter((student: any) => {
                        if (studentFilters.name && !student.name.toLowerCase().includes(studentFilters.name.toLowerCase())) return false;
                        if (studentFilters.grade !== "all" && student.grade !== studentFilters.grade) return false;
                        if (studentFilters.class !== "all" && student.class !== studentFilters.class) return false;
                        return true;
                      })
                      .map((student: any) => (
                        <div key={student._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div>
                            <h3 className="font-medium text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">
                              Grade: {student.grade} | Class: {student.class} | Username: {student.username}
                            </p>
                            <p className="text-sm text-gray-600">
                              School: {student.school}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleGenerateReport(student._id, student.name)}
                              variant="outline"
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Report
                            </Button>
                            <Dialog open={editingStudent?._id === student._id} onOpenChange={(open) => !open && setEditingStudent(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => handleEditStudent(student)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Student</DialogTitle>
                                  <DialogDescription>Update student information</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-grade">Grade</Label>
                                    <Select value={editForm.grade} onValueChange={(value) => setEditForm({...editForm, grade: value})}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {grades.map((grade) => (
                                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-username">Username</Label>
                                    <Input
                                      id="edit-username"
                                      value={editForm.username}
                                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-password">Password</Label>
                                    <Input
                                      id="edit-password"
                                      type="password"
                                      value={editForm.password}
                                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                      placeholder="Leave blank to keep current password"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-class">Class</Label>
                                    <Input
                                      id="edit-class"
                                      value={editForm.class}
                                      onChange={(e) => setEditForm({...editForm, class: e.target.value})}
                                    />
                                  </div>
                                  <Button onClick={handleUpdateStudent} className="w-full">
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              onClick={() => handleDeleteStudent(student._id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span>Teachers</span>
                </CardTitle>
                <CardDescription>View and manage all teachers</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6">
                  <Label htmlFor="teacher-filter-name">Filter by Name</Label>
                  <Input
                    id="teacher-filter-name"
                    placeholder="Search teacher name..."
                    value={teacherFilters.name}
                    onChange={(e) => setTeacherFilters({...teacherFilters, name: e.target.value})}
                  />
                </div>

                {/* Teachers List */}
                {allTeachers && allTeachers.length > 0 ? (
                  <div className="space-y-4">
                    {allTeachers
                      .filter((teacher: any) => {
                        if (teacherFilters.name && !teacher.name.toLowerCase().includes(teacherFilters.name.toLowerCase())) return false;
                        return true;
                      })
                      .map((teacher: any) => (
                        <div key={teacher._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div>
                            <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                            <p className="text-sm text-gray-600">
                              Email: {teacher.email} | Subject: {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? teacher.teacherSubjects.join(', ') : 'Not specified'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Username: {teacher.username || 'Not set'}
                            </p>
                            {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                              <p className="text-sm text-gray-600">Classes: {teacher.assignedClasses.length}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Dialog open={editingTeacher?._id === teacher._id} onOpenChange={(open) => !open && setEditingTeacher(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => handleEditTeacher(teacher)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Teacher</DialogTitle>
                                  <DialogDescription>Update teacher information</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-teacher-name">Name</Label>
                                    <Input
                                      id="edit-teacher-name"
                                      value={editTeacherForm.name}
                                      onChange={(e) => setEditTeacherForm({...editTeacherForm, name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-teacher-email">Email</Label>
                                    <Input
                                      id="edit-teacher-email"
                                      type="email"
                                      value={editTeacherForm.email}
                                      onChange={(e) => setEditTeacherForm({...editTeacherForm, email: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-teacher-subject">Subject</Label>
                                    <Input
                                      id="edit-teacher-subject"
                                      value={editTeacherForm.subject}
                                      onChange={(e) => setEditTeacherForm({...editTeacherForm, subject: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-teacher-username">Username</Label>
                                    <Input
                                      id="edit-teacher-username"
                                      value={editTeacherForm.username}
                                      onChange={(e) => setEditTeacherForm({...editTeacherForm, username: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-teacher-password">Password</Label>
                                    <Input
                                      id="edit-teacher-password"
                                      type="password"
                                      value={editTeacherForm.password}
                                      onChange={(e) => setEditTeacherForm({...editTeacherForm, password: e.target.value})}
                                      placeholder="Leave blank to keep current password"
                                    />
                                  </div>
                                  <Button onClick={handleUpdateTeacher} className="w-full">
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              onClick={() => handleDeleteTeacher(teacher._id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No teachers found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parents Tab */}
          <TabsContent value="parents" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Parents</span>
                </CardTitle>
                <CardDescription>View and manage all parents</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6">
                  <Label htmlFor="parent-filter-name">Filter by Name</Label>
                  <Input
                    id="parent-filter-name"
                    placeholder="Search parent name..."
                    value={parentFilters.name}
                    onChange={(e) => setParentFilters({...parentFilters, name: e.target.value})}
                  />
                </div>

                {/* Parents List */}
                {allParents && allParents.length > 0 ? (
                  <div className="space-y-4">
                    {allParents
                      .filter((parent: any) => {
                        if (parentFilters.name && !parent.name.toLowerCase().includes(parentFilters.name.toLowerCase())) return false;
                        return true;
                      })
                      .map((parent: any) => (
                        <div key={parent._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div>
                            <h3 className="font-medium text-gray-900">{parent.name}</h3>
                            <p className="text-sm text-gray-600">
                              Email: {parent.email} | Username: {parent.username || 'Not set'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Child: {parent.childName || 'Not specified'} | Grade: {parent.childGrade || 'N/A'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Dialog open={editingParent?._id === parent._id} onOpenChange={(open) => !open && setEditingParent(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => handleEditParent(parent)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Parent</DialogTitle>
                                  <DialogDescription>Update parent information</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-parent-name">Name</Label>
                                    <Input
                                      id="edit-parent-name"
                                      value={editParentForm.name}
                                      onChange={(e) => setEditParentForm({...editParentForm, name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-parent-email">Email</Label>
                                    <Input
                                      id="edit-parent-email"
                                      type="email"
                                      value={editParentForm.email}
                                      onChange={(e) => setEditParentForm({...editParentForm, email: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-parent-username">Username</Label>
                                    <Input
                                      id="edit-parent-username"
                                      value={editParentForm.username}
                                      onChange={(e) => setEditParentForm({...editParentForm, username: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-parent-password">Password</Label>
                                    <Input
                                      id="edit-parent-password"
                                      type="password"
                                      value={editParentForm.password}
                                      onChange={(e) => setEditParentForm({...editParentForm, password: e.target.value})}
                                      placeholder="Leave blank to keep current password"
                                    />
                                  </div>
                                  <Button onClick={handleUpdateParent} className="w-full">
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              onClick={() => handleDeleteParent(parent._id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No parents found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Create Quiz */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Create Quiz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="quiz-course">Course</Label>
                    <Select value={quizForm.courseId} onValueChange={(value) => setQuizForm({...quizForm, courseId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCourses?.map((course: any) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input
                      id="quiz-title"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                      placeholder="Quiz title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                      placeholder="Quiz description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!quizForm.courseId || !quizForm.title) {
                        alert("Please fill in all required fields")
                        return
                      }
                      try {
                        await createQuiz({
                          courseId: quizForm.courseId as Id<"courses">,
                          title: quizForm.title,
                          description: quizForm.description,
                          timeLimit: quizForm.timeLimit
                        })
                        setQuizForm({ courseId: "", title: "", description: "", timeLimit: 30 })
                        alert("Quiz created successfully!")
                      } catch (error) {
                        alert("Error creating quiz: " + (error as Error).message)
                      }
                    }}
                    className="w-full"
                  >
                    Create Quiz
                  </Button>
                </CardContent>
              </Card>

              {/* Quiz List */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Existing Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (!allQuizzes) {
                      return <p className="text-gray-500">Loading quizzes...</p>;
                    }
                    
                    return allQuizzes.length > 0 ? (
                      <div className="space-y-4">
                        {allQuizzes.map((quiz: any) => (
                          <div key={quiz._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                              <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                              <p className="text-sm text-gray-600">
                                Course: {quiz.courseName} • Questions: {quiz.questionCount || 0} • Time: {quiz.timeLimit}min
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(quiz.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <BookOpen className="w-4 h-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{quiz.title} - Quiz Management</DialogTitle>
                                    <DialogDescription>
                                      Course: {quiz.courseName} | Time Limit: {quiz.timeLimit} minutes
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-2">Description</h4>
                                      <p className="text-gray-600">{quiz.description || 'No description provided'}</p>
                                    </div>
                                    
                                    {/* Add Question Section */}
                                    <div className="border-t pt-4">
                                      <h4 className="font-semibold mb-4">Add New Question</h4>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="question">Question</Label>
                                          <Textarea
                                            id="question"
                                            value={questionForm.question}
                                            onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                                            placeholder="Enter your question"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          {questionForm.options.map((option, index) => (
                                            <div key={index}>
                                              <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                                              <Input
                                                id={`option-${index}`}
                                                value={option}
                                                onChange={(e) => {
                                                  const newOptions = [...questionForm.options]
                                                  newOptions[index] = e.target.value
                                                  setQuestionForm({...questionForm, options: newOptions})
                                                }}
                                                placeholder={`Option ${index + 1}`}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="correct-answer">Correct Answer</Label>
                                            <Select 
                                              value={questionForm.correctAnswer.toString()} 
                                              onValueChange={(value) => setQuestionForm({...questionForm, correctAnswer: parseInt(value)})}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select correct answer" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {questionForm.options.map((option, index) => (
                                                  <SelectItem key={index} value={index.toString()}>
                                                    Option {index + 1}: {option}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div>
                                            <Label htmlFor="difficulty">Difficulty</Label>
                                            <Select 
                                              value={questionForm.difficulty} 
                                              onValueChange={(value) => setQuestionForm({...questionForm, difficulty: value})}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select difficulty" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Easy">Easy</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Hard">Hard</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <div>
                                          <Label htmlFor="explanation">Explanation (Optional)</Label>
                                          <Textarea
                                            id="explanation"
                                            value={questionForm.explanation}
                                            onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                                            placeholder="Explain the correct answer"
                                          />
                                        </div>
                                        <Button
                                          onClick={async () => {
                                            if (!questionForm.question || questionForm.options.some(opt => !opt.trim())) {
                                              alert("Please fill in the question and all options")
                                              return
                                            }
                                            try {
                                              await addQuestionToQuiz({
                                                quizId: quiz._id,
                                                courseId: quiz.courseId,
                                                question: questionForm.question,
                                                options: questionForm.options,
                                                correctAnswer: questionForm.correctAnswer,
                                                explanation: questionForm.explanation,
                                                difficulty: questionForm.difficulty
                                              })
                                              setQuestionForm({
                                                quizId: "",
                                                question: "",
                                                options: ["", "", "", ""],
                                                correctAnswer: 0,
                                                explanation: "",
                                                difficulty: "Easy"
                                              })
                                              alert("Question added successfully!")
                                            } catch (error) {
                                              alert("Error adding question: " + (error as Error).message)
                                            }
                                          }}
                                          className="w-full"
                                        >
                                          Add Question to Quiz
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Existing Questions */}
                                    <div className="border-t pt-4">
                                      <h4 className="font-semibold mb-2">Existing Questions ({quiz.questionCount || 0})</h4>
                                      {(() => {
                                        const questions = quiz.questions || [];
                                        
                                        return questions.length > 0 ? (
                                          <div className="space-y-3">
                                            {questions.map((questionId: any, index: number) => (
                                              <div key={index} className="border rounded-lg p-3 bg-white">
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="text-lg font-bold">Question {index + 1}</span>
                                                  <div className="flex space-x-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setEditingQuestion({ _id: questionId });
                                                      }}
                                                    >
                                                      <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this question?')) {
                                                          try {
                                                            await deleteQuestionFromQuiz({ 
                                                              questionId: questionId,
                                                              quizId: quiz._id 
                                                            });
                                                            alert('Question deleted successfully!');
                                                          } catch (error) {
                                                            console.error('Error deleting question:', error);
                                                            alert('Error deleting question');
                                                          }
                                                        }
                                                      }}
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                <p className="text-sm text-gray-600 text-sm">Question ID: {questionId}</p>
                                                
                                                {/* Inline edit form */}
                                                {editingQuestion && editingQuestion._id === questionId && (
                                                  <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                                                    <h5 className="font-semibold mb-3">Edit Question</h5>
                                                    <div className="space-y-3">
                                                      <div>
                                                        <Label>Question</Label>
                                                        <Textarea
                                                          value={editQuestionForm.question}
                                                          onChange={(e) => setEditQuestionForm({...editQuestionForm, question: e.target.value})}
                                                          placeholder="Enter question"
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label>Options</Label>
                                                        {editQuestionForm.options.map((option, idx) => (
                                                          <Input
                                                            key={idx}
                                                            className="mb-2"
                                                            value={option}
                                                            onChange={(e) => {
                                                              const newOptions = [...editQuestionForm.options];
                                                              newOptions[idx] = e.target.value;
                                                              setEditQuestionForm({...editQuestionForm, options: newOptions});
                                                            }}
                                                            placeholder={`Option ${idx + 1}`}
                                                          />
                                                        ))}
                                                      </div>
                                                      <div>
                                                        <Label>Correct Answer (0-3)</Label>
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          max="3"
                                                          value={editQuestionForm.correctAnswer}
                                                          onChange={(e) => setEditQuestionForm({...editQuestionForm, correctAnswer: parseInt(e.target.value)})}
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label>Explanation (optional)</Label>
                                                        <Textarea
                                                          value={editQuestionForm.explanation}
                                                          onChange={(e) => setEditQuestionForm({...editQuestionForm, explanation: e.target.value})}
                                                          placeholder="Explain the correct answer"
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label>Difficulty</Label>
                                                        <Select 
                                                          value={editQuestionForm.difficulty} 
                                                          onValueChange={(value) => setEditQuestionForm({...editQuestionForm, difficulty: value})}
                                                        >
                                                          <SelectTrigger>
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="Easy">Easy</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="Hard">Hard</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                      <div className="flex space-x-2">
                                                        <Button
                                                          onClick={async () => {
                                                            try {
                                                              await updateQuestion({
                                                                questionId: questionId,
                                                                question: editQuestionForm.question,
                                                                options: editQuestionForm.options,
                                                                correctAnswer: editQuestionForm.correctAnswer,
                                                                explanation: editQuestionForm.explanation,
                                                                difficulty: editQuestionForm.difficulty
                                                              });
                                                              setEditingQuestion(null);
                                                              alert('Question updated successfully!');
                                                            } catch (error) {
                                                              console.error('Error updating question:', error);
                                                              alert('Error updating question');
                                                            }
                                                          }}
                                                          className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                          Save Changes
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          onClick={() => setEditingQuestion(null)}
                                                        >
                                                          Cancel
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                <p className="text-xs text-gray-500 mt-1">
                                                  Click "Edit" to view and modify question details
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-gray-500">No questions added yet. Use the form above to add questions.</p>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteQuiz(quiz._id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No quizzes found</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  <span>Student Projects</span>
                </CardTitle>
                <CardDescription>View and manage student project submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="filter-grade">Filter by Grade</Label>
                    <Select value={projectFilters.grade} onValueChange={(value) => setProjectFilters({...projectFilters, grade: value === "all" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All grades</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-course">Filter by Course</Label>
                    <Select value={projectFilters.course || "all"} onValueChange={(value) => setProjectFilters({...projectFilters, course: value === "all" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {allCourses?.map((course: any) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-class">Filter by Class</Label>
                    <Select value={projectFilters.class || "all"} onValueChange={(value) => setProjectFilters({...projectFilters, class: value === "all" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {allClasses?.filter((classItem: any) => classItem.name && classItem.name.trim() !== "").map((classItem: any) => (
                          <SelectItem key={classItem._id} value={classItem.name}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-student">Filter by Student</Label>
                    <Select value={projectFilters.student || "all"} onValueChange={(value) => setProjectFilters({...projectFilters, student: value === "all" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All students</SelectItem>
                        {allStudents?.map((student: any) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Projects List */}
                {projectsData && projectsData.length > 0 ? (
                  <div className="space-y-4">
                    {projectsData.map((project: any) => (
                      <div key={project._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            <p className="text-sm text-gray-600">
                              Student: {project.studentName} • Course: {project.courseName} • Language: {project.language}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(project.submissionDate).toLocaleDateString()}
                            </p>
                            {project.description && (
                              <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={
                                project.status === "approved" 
                                  ? "border-green-500 text-green-600"
                                  : project.status === "submitted"
                                  ? "border-yellow-500 text-yellow-600"
                                  : "border-blue-500 text-blue-600"
                              }
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (project.projectUrl) {
                                // Show project output instead of code
                                if (project.language === 'scratch-junior') {
                                  const outputWindow = window.open('', '_blank');
                                  if (outputWindow) {
                                    outputWindow.document.write(`
                                      <html>
                                        <head><title>${project.title} - Project Output</title></head>
                                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                                          <h2>${project.title}</h2>
                                          <p><strong>Student:</strong> ${project.studentName}</p>
                                          <p><strong>Course:</strong> ${project.courseName}</p>
                                          <hr>
                                          <iframe src="${project.projectUrl}" width="100%" height="500" frameborder="0"></iframe>
                                        </body>
                                      </html>
                                    `);
                                  }
                                } else if (project.codeContent && (project.language === 'html' || project.language === 'css' || project.language === 'javascript')) {
                                  const outputWindow = window.open('', '_blank');
                                  if (outputWindow) {
                                    outputWindow.document.write(project.codeContent);
                                  }
                                } else if (project.codeContent) {
                                  const outputWindow = window.open('', '_blank');
                                  if (outputWindow) {
                                    outputWindow.document.write(`
                                      <html>
                                        <head><title>${project.title} - Project Output</title></head>
                                        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                                          <h2>${project.title}</h2>
                                          <p><strong>Student:</strong> ${project.studentName}</p>
                                          <p><strong>Language:</strong> ${project.language}</p>
                                          <hr>
                                          <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                            <h3>Project Output:</h3>
                                            <div style="border: 1px solid #ddd; padding: 10px; background: #fafafa;">
                                              <pre style="margin: 0; white-space: pre-wrap;">${project.codeContent}</pre>
                                            </div>
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                } else {
                                  window.open(project.projectUrl, '_blank');
                                }
                              } else {
                                alert('No project content available to view');
                              }
                            }}
                          >
                            View Output
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this project?")) {
                                try {
                                  await deleteProject({ projectId: project._id });
                                  alert("Project deleted successfully!");
                                } catch (error) {
                                  console.error("Error deleting project:", error);
                                  alert("Error deleting project");
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <AdminNotesContent />
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum">
            <AdminCurriculumContent />
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <AdminExamContent />
          </TabsContent>
        </Tabs>

        {/* Edit Student Dialog */}
        <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update student information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-student-name">Name</Label>
                <Input
                  id="edit-student-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-grade">Grade</Label>
                <Select value={editForm.grade} onValueChange={(value) => setEditForm({...editForm, grade: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-student-username">Username</Label>
                <Input
                  id="edit-student-username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-password">Password</Label>
                <Input
                  id="edit-student-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <Label htmlFor="edit-student-class">Class</Label>
                <Input
                  id="edit-student-class"
                  value={editForm.class}
                  onChange={(e) => setEditForm({...editForm, class: e.target.value})}
                />
              </div>
              <Button onClick={handleUpdateStudent} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Teacher Dialog */}
        <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>Update teacher information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-teacher-name">Name</Label>
                <Input
                  id="edit-teacher-name"
                  value={editTeacherForm.name}
                  onChange={(e) => setEditTeacherForm({...editTeacherForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher-email">Email</Label>
                <Input
                  id="edit-teacher-email"
                  type="email"
                  value={editTeacherForm.email}
                  onChange={(e) => setEditTeacherForm({...editTeacherForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher-subject">Subject</Label>
                <Input
                  id="edit-teacher-subject"
                  value={editTeacherForm.subject}
                  onChange={(e) => setEditTeacherForm({...editTeacherForm, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher-username">Username</Label>
                <Input
                  id="edit-teacher-username"
                  value={editTeacherForm.username}
                  onChange={(e) => setEditTeacherForm({...editTeacherForm, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher-password">Password</Label>
                <Input
                  id="edit-teacher-password"
                  type="password"
                  value={editTeacherForm.password}
                  onChange={(e) => setEditTeacherForm({...editTeacherForm, password: e.target.value})}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <Button onClick={handleUpdateTeacher} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Parent Dialog */}
        <Dialog open={!!editingParent} onOpenChange={(open) => !open && setEditingParent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Parent</DialogTitle>
              <DialogDescription>Update parent information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-parent-name">Name</Label>
                <Input
                  id="edit-parent-name"
                  value={editParentForm.name}
                  onChange={(e) => setEditParentForm({...editParentForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-parent-email">Email</Label>
                <Input
                  id="edit-parent-email"
                  type="email"
                  value={editParentForm.email}
                  onChange={(e) => setEditParentForm({...editParentForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-parent-username">Username</Label>
                <Input
                  id="edit-parent-username"
                  value={editParentForm.username}
                  onChange={(e) => setEditParentForm({...editParentForm, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-parent-password">Password</Label>
                <Input
                  id="edit-parent-password"
                  type="password"
                  value={editParentForm.password}
                  onChange={(e) => setEditParentForm({...editParentForm, password: e.target.value})}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <Button onClick={handleUpdateParent} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}