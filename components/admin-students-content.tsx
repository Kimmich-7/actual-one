"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Trash2,
  Edit,
  Archive,
  Download,
  ChevronRight,
  Calendar,
  Users,
  ArrowLeft,
  Star,
  CheckCircle,
  Target,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Helper function to get student performance level based on average quiz score
function getStudentPerformanceLevel(
  avgScore: number | null,
): { level: string; color: string; bgColor: string; borderColor: string; icon: any } | null {
  if (avgScore === null) return null

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

export default function AdminStudentsContent() {
  // MySQL-backed state
  const [allStudents, setAllStudents] = useState<any[] | undefined>(undefined)
  const [studentQuizScores, setStudentQuizScores] = useState<any[]>([])
  const [archivedStudents, setArchivedStudents] = useState<any[]>([]) // archive endpoints later
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true)

  // Archive navigation state
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  const refreshStudents = async () => {
    setLoadingStudents(true)
    const [studentsRes, scoresRes] = await Promise.all([
      fetch("/api/admin/students", { cache: "no-store" }),
      fetch("/api/admin/students/scores", { cache: "no-store" }),
    ])

    if (!studentsRes.ok) throw new Error("Failed to load students")
    if (!scoresRes.ok) throw new Error("Failed to load student scores")

    const studentsRaw = await studentsRes.json()
    const scoresRaw = await scoresRes.json()

    // Convert DB fields to the shape your UI expects (student.name, student.grade, etc.)
    const students = (Array.isArray(studentsRaw) ? studentsRaw : []).map((s: any) => ({
      _id: s._id,
      name: s.uName,
      grade: s.grade,
      class: s.class,
      school: s.school,
      username: s.username,
      // Your edit dialog uses student.password. DB has uPassword.
      password: s.uPassword,
    }))

    setAllStudents(students)
    setStudentQuizScores(Array.isArray(scoresRaw) ? scoresRaw : [])
    setArchivedStudents([]) // TODO: implement archive endpoints later
    setLoadingStudents(false)
  }

  useEffect(() => {
    refreshStudents().catch((err) => {
      console.error("Failed to load students:", err)
      alert("Failed to load students: " + err.message)
      setAllStudents([])
      setLoadingStudents(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Form states
  const [singleStudentForm, setSingleStudentForm] = useState({
    name: "",
    grade: "",
    school: "Juja St. Peters School",
    username: "",
    password: "",
    class: "",
  })

  const [bulkStudentsText, setBulkStudentsText] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    grade: "",
    username: "",
    password: "",
    class: "",
  })

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  useEffect(() => {
    console.log("✅ AdminStudentsContent MOUNTED")
  }, [])

  const handleCreateSingleStudent = async () => {
    if (!singleStudentForm.name || !singleStudentForm.grade || !singleStudentForm.username || !singleStudentForm.password) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleStudentForm),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to create student")
      }

      setSingleStudentForm({
        name: "",
        grade: "",
        school: "Juja St. Peters School",
        username: "",
        password: "",
        class: "",
      })

      await refreshStudents()
      alert("Student created successfully!")
    } catch (error) {
      console.error("Error creating student:", error)
      alert("Error creating student: " + (error as Error).message)
    }
  }

  const handleBulkCreate = async () => {
    if (!bulkStudentsText.trim()) {
      alert("Please enter student data")
      return
    }

    try {
      const lines = bulkStudentsText.trim().split("\n")
      const dataLines = lines[0].toLowerCase().includes("name") ? lines.slice(1) : lines

      const students = dataLines
        .map((line) => {
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
          let fields = line.split(csvRegex).map((field) => field.replace(/^["']|["']$/g, "").trim())

          if (fields.length === 1) fields = line.split("\t").map((field) => field.trim())
          if (fields.length === 1) fields = line.split(";").map((field) => field.trim())

          const [name, grade, username, password, classField] = fields

          if (!name || !username || !password) {
            console.warn("Skipping invalid row:", line)
            return null
          }

          const cleanName = name.replace(/[^\w\s.-]/g, "").trim()
          if (!cleanName) {
            console.warn("Skipping row with invalid name:", line)
            return null
          }

          return {
            name: cleanName,
            grade: grade || "Grade 1",
            school: "Juja St. Peters School",
            username: username.trim(),
            password: password.trim(),
            class: classField?.trim() || grade || "Grade 1",
          }
        })
        .filter((student): student is NonNullable<typeof student> => student !== null)

      if (students.length === 0) {
        alert(
          "No valid student data found. Please check the CSV format:\nName,Grade,Username,Password,Class\n\nMake sure names contain only letters, numbers, spaces, dots, and hyphens.",
        )
        return
      }

      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to bulk create students")
      }

      setBulkStudentsText("")
      await refreshStudents()
      alert(`Successfully created ${students.length} students!`)
    } catch (error) {
      console.error("Error bulk creating students:", error)
      alert("Error creating students: " + (error as Error).message)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        const res = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || "Failed to delete student")
        }

        await refreshStudents()
        alert("Student deleted successfully!")
      } catch (error) {
        console.error("Error deleting student:", error)
        alert("Error deleting student: " + (error as Error).message)
      }
    }
  }

  // TEMP: Archive not wired yet
  const handleArchiveStudent = async (_studentId: string, _studentName: string) => {
    alert("Archive is not connected to MySQL yet. We will enable it in the next step.")
  }

  // TEMP: Restore not wired yet
  const handleRestoreStudent = async (_archivedId: string, _studentName: string) => {
    alert("Restore is not connected to MySQL yet. We will enable it in the next step.")
  }

  const handleEditStudent = (student: any) => {
    console.log("🔧 EDIT STUDENT CLICKED:", student.name)
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      grade: student.grade,
      username: student.username,
      password: student.password || "",
      class: student.class || student.grade,
    })
    setIsEditDialogOpen(true)
    console.log("🔧 Student edit dialog opened with explicit boolean flag")
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return

    try {
      const res = await fetch(`/api/admin/students/${editingStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to update student")
      }

      setIsEditDialogOpen(false)
      setEditingStudent(null)
      setEditForm({ name: "", grade: "", username: "", password: "", class: "" })

      await refreshStudents()
      alert("Student updated successfully!")
    } catch (error) {
      console.error("Error updating student:", error)
      alert("Error updating student: " + (error as Error).message)
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent =
      "Name,Grade,Username,Password,Class\nJohn Doe,Grade 1,johndoe,password123,Grade 1\nJane Smith,Grade 2,janesmith,password456,Grade 2"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "student_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Organize archived students by year and class
  const getArchivedByYearAndClass = () => {
    if (!archivedStudents) return {}

    const organized: Record<string, Record<string, typeof archivedStudents>> = {}

    archivedStudents.forEach((student) => {
      const year = new Date(student.archivedAt).getFullYear().toString()
      const studentClass = student.class || student.grade || "Unassigned"

      if (!organized[year]) organized[year] = {}
      if (!organized[year][studentClass]) organized[year][studentClass] = []
      organized[year][studentClass].push(student)
    })

    return organized
  }

  const archivedByYearAndClass = getArchivedByYearAndClass()
  const years = Object.keys(archivedByYearAndClass).sort((a, b) => parseInt(b) - parseInt(a))
  const classesInYear = selectedYear ? Object.keys(archivedByYearAndClass[selectedYear] || {}).sort() : []
  const studentsInClass =
    selectedYear && selectedClass ? archivedByYearAndClass[selectedYear]?.[selectedClass] || [] : []

  // Get total counts for display
  const getYearStudentCount = (year: string) => {
    const classes = archivedByYearAndClass[year] || {}
    return Object.values(classes).reduce((sum, students) => sum + students.length, 0)
  }

  const getClassStudentCount = (year: string, className: string) => {
    return archivedByYearAndClass[year]?.[className]?.length || 0
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Students</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="manage">Manage Students</TabsTrigger>
          <TabsTrigger value="archive">Archived Students</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Create Single Student</CardTitle>
              <CardDescription>Add a new student account manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={singleStudentForm.name}
                    onChange={(e) => setSingleStudentForm({ ...singleStudentForm, name: e.target.value })}
                    placeholder="Student's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={singleStudentForm.grade}
                    onValueChange={(value) => setSingleStudentForm({ ...singleStudentForm, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={singleStudentForm.username}
                    onChange={(e) => setSingleStudentForm({ ...singleStudentForm, username: e.target.value })}
                    placeholder="Unique username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={singleStudentForm.password}
                    onChange={(e) => setSingleStudentForm({ ...singleStudentForm, password: e.target.value })}
                    placeholder="Student password"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="class">Class (Optional)</Label>
                <Input
                  id="class"
                  value={singleStudentForm.class}
                  onChange={(e) => setSingleStudentForm({ ...singleStudentForm, class: e.target.value })}
                  placeholder="e.g., Grade 5A"
                />
              </div>

              <Button onClick={handleCreateSingleStudent} className="w-full">
                Create Student
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Bulk Import Students</CardTitle>
              <CardDescription>Import multiple students from CSV data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="bulk-data">CSV Data</Label>
                <Button variant="outline" onClick={downloadCSVTemplate}>
                  Download Template
                </Button>
              </div>

              <Textarea
                id="bulk-data"
                value={bulkStudentsText}
                onChange={(e) => setBulkStudentsText(e.target.value)}
                placeholder={
                  "Name,Grade,Username,Password,Class\nJohn Doe,Grade 1,johndoe,password123,Grade 1\nJane Smith,Grade 2,janesmith,password456,Grade 2"
                }
                rows={10}
              />

              <Button onClick={handleBulkCreate} className="w-full">
                Import Students
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">All Students</CardTitle>
              <CardDescription>View and manage existing student accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <p className="text-gray-500 text-center py-8">Loading students...</p>
              ) : allStudents && allStudents.length > 0 ? (
                <div className="space-y-4">
                  {allStudents.map((student) => {
                    // Find quiz score data for this student
                    const studentScore = studentQuizScores.find((s: any) => s._id === student._id)
                    const avgScore = studentScore?.averageScore ?? null
                    const perfLevel = getStudentPerformanceLevel(avgScore)
                    const PerfIcon = perfLevel?.icon

                    return (
                      <div
                        key={student._id}
                        className={`flex items-center justify-between p-4 border rounded-lg bg-gray-50 ${
                          perfLevel ? `border-l-4 ${perfLevel.borderColor}` : "border-gray-200"
                        }`}
                      >
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
                          <p className="text-sm text-gray-600">
                            {student.grade} • {student.username}
                          </p>
                          <p className="text-xs text-gray-500">Class: {student.class || student.grade}</p>
                          {avgScore !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                              Avg Score: {avgScore}% • {studentScore?.totalQuizzes || 0} quizzes
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveStudent(student._id, student.name)}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student._id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No students found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-800">Archived Students</CardTitle>
                  <CardDescription>
                    {!selectedYear && "Browse archived students by year and class"}
                    {selectedYear && !selectedClass && `Viewing classes from ${selectedYear}`}
                    {selectedYear && selectedClass && `${selectedClass} - ${selectedYear}`}
                  </CardDescription>
                </div>
                {(selectedYear || selectedClass) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedClass) setSelectedClass(null)
                      else setSelectedYear(null)
                    }}
                    className="border-gray-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>

              {/* Breadcrumb navigation */}
              {(selectedYear || selectedClass) && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <button
                    onClick={() => {
                      setSelectedYear(null)
                      setSelectedClass(null)
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    All Years
                  </button>
                  {selectedYear && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={() => setSelectedClass(null)}
                        className={selectedClass ? "text-blue-600 hover:underline" : "text-gray-800 font-medium"}
                      >
                        {selectedYear}
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
              {archivedStudents && archivedStudents.length > 0 ? (
                <div className="space-y-3">
                  {/* Level 1: Year Selection */}
                  {!selectedYear && (
                    <>
                      {years.length > 0 ? (
                        years.map((year) => (
                          <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{year}</h3>
                                <p className="text-sm text-gray-600">
                                  {getYearStudentCount(year)} archived student{getYearStudentCount(year) !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No archived students</p>
                      )}
                    </>
                  )}

                  {/* Level 2: Class Selection */}
                  {selectedYear && !selectedClass && (
                    <>
                      {classesInYear.length > 0 ? (
                        classesInYear.map((className) => (
                          <button
                            key={className}
                            onClick={() => setSelectedClass(className)}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{className}</h3>
                                <p className="text-sm text-gray-600">
                                  {getClassStudentCount(selectedYear, className)} student
                                  {getClassStudentCount(selectedYear, className) !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No classes found for {selectedYear}</p>
                      )}
                    </>
                  )}

                  {/* Level 3: Student List */}
                  {selectedYear && selectedClass && (
                    <>
                      {studentsInClass.length > 0 ? (
                        studentsInClass.map((student) => (
                          <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div>
                              <h3 className="font-semibold text-gray-800">{student.name}</h3>
                              <p className="text-sm text-gray-600">
                                {student.grade} • {student.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                Archived: {new Date(student.archivedAt).toLocaleDateString()}
                              </p>
                              {student.reason && <p className="text-xs text-gray-500 mt-1">Reason: {student.reason}</p>}
                              <div className="flex gap-4 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  📊 {student.totalQuizzes || 0} quizzes
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  📈 {student.averageScore || 0}% avg score
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  📁 {student.totalProjects || 0} projects
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreStudent(student._id, student.name)}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Restore
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No students in this class</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No archived students</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-grade">Grade</Label>
              <Select value={editForm.grade} onValueChange={(value) => setEditForm({ ...editForm, grade: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-class">Class</Label>
              <Input id="edit-class" value={editForm.class} onChange={(e) => setEditForm({ ...editForm, class: e.target.value })} />
            </div>
            <Button onClick={handleUpdateStudent} className="w-full">
              Update Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}