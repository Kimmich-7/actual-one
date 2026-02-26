




"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Users, UserPlus } from "lucide-react"

export default function AdminClassesContent() {
  const allClasses = useQuery(api.users.getAllClasses)
  const allTeachers = useQuery(api.teachers.getAllTeachers)
  const availableStudents = useQuery(api.users.getAvailableStudentsForClass, {})
  
  const createClass = useMutation(api.users.createClass)
  const deleteClass = useMutation(api.users.deleteClass)
  const editClass = useMutation(api.users.editClass)
  const assignStudentToClass = useMutation(api.users.assignStudentToClass)
  const removeStudentFromClass = useMutation(api.users.removeStudentFromClass)

  // Form states
  const [classForm, setClassForm] = useState({
    name: "",
    grade: "",
    teacherId: ""
  })

  // EXPLICIT dialog state - no object checks
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddStudentsDialogOpen, setIsAddStudentsDialogOpen] = useState(false)
  
  const [viewingClass, setViewingClass] = useState<any>(null)
  const [addingStudentsToClass, setAddingStudentsToClass] = useState<any>(null)
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<string[]>([])
  const [editingClass, setEditingClass] = useState<any>(null)
  const [editClassForm, setEditClassForm] = useState({ name: "", grade: "" })

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)
  
  useEffect(() => {
    console.log("✅ AdminClassesContent MOUNTED");
  }, []);

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

  const handleEditClass = (classRecord: any) => {
    console.log("🔧 EDIT CLICKED - Class:", classRecord.name);
    setEditingClass(classRecord)
    setEditClassForm({
      name: classRecord.name,
      grade: classRecord.grade
    })
    setIsEditDialogOpen(true)
    console.log("🔧 Edit dialog opened with explicit boolean flag");
  }

  const handleUpdateClass = async () => {
    if (!editingClass || !editClassForm.name || !editClassForm.grade) {
      alert("Please fill in all required fields")
      return
    }

    try {
      console.log("Updating class:", editingClass._id, editClassForm);
      await editClass({
        classId: editingClass._id,
        name: editClassForm.name,
        grade: editClassForm.grade
      })
      setIsEditDialogOpen(false)
      setEditingClass(null)
      setEditClassForm({ name: "", grade: "" })
      alert("Class updated successfully!")
    } catch (error) {
      console.error("Error updating class:", error)
      alert("Error updating class: " + (error as Error).message)
    }
  }

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
      setIsAddStudentsDialogOpen(false)
      setAddingStudentsToClass(null)
      setSelectedStudentsToAdd([])
      alert(`Successfully added ${selectedStudentsToAdd.length} students to ${addingStudentsToClass.name}!`)
    } catch (error) {
      console.error("Error adding students to class:", error)
      alert("Error adding students to class: " + (error as Error).message)
    }
  }

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

  const handleViewClass = (classRecord: any) => {
    console.log("👁️ VIEW CLICKED - Class:", classRecord.name);
    setViewingClass(classRecord);
    setIsViewDialogOpen(true);
    console.log("👁️ View dialog opened with explicit boolean flag");
  }

  return (
    <div className="space-y-6">
      {/* DEBUG: Test button */}
      <Button 
        onClick={() => {
          console.log("TEST BUTTON CLICKED - Click events are working!");
          alert("Click events are working!");
        }}
        className="bg-purple-600 hover:bg-purple-700"
      >
        🧪 TEST BUTTON - Click Me First
      </Button>

      {/* Create Class Form */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Create New Class</CardTitle>
          <CardDescription>Set up a new class with assigned teacher</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                value={classForm.name}
                onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                placeholder="e.g., Grade 5A"
              />
            </div>
            <div>
              <Label htmlFor="class-grade">Grade Level</Label>
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
          </div>
          
          <div>
            <Label htmlFor="teacher">Assign Teacher</Label>
            <Select
              value={classForm.teacherId ?? ""}
              onValueChange={(value) => setClassForm({ ...classForm, teacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>

              <SelectContent>
                {/* Loading */}
                {allTeachers === undefined && (
                  <SelectItem value="" disabled>
                    Loading teachers...
                  </SelectItem>
                )}

                {/* Empty */}
                {Array.isArray(allTeachers) && allTeachers.length === 0 && (
                  <SelectItem value="" disabled>
                    No approved teachers available
                  </SelectItem>
                )}

                {/* Success */}
                {Array.isArray(allTeachers) &&
                  allTeachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleCreateClass} className="w-full">
            Create Class
          </Button>
        </CardContent>
      </Card>

      {/* All Classes */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">All Classes</CardTitle>
          <CardDescription>Manage existing classes and their students</CardDescription>
        </CardHeader>
        <CardContent>
          {allClasses && allClasses.length > 0 ? (
            <div className="space-y-4">
              {allClasses.map((classRecord) => (
                <div key={classRecord._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{classRecord.name}</h3>
                      <p className="text-sm text-gray-600">{classRecord.grade}</p>
                      <p className="text-xs text-gray-500">
                        Teacher: {allTeachers?.find(t => t._id === classRecord.teacherId)?.name || "Unassigned"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {classRecord.students?.length || 0} students
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClass(classRecord)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log("🆕 ADD STUDENTS BUTTON CLICKED");
                          setAddingStudentsToClass(classRecord)
                          setIsAddStudentsDialogOpen(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Students
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClass(classRecord)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClass(classRecord._id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No classes found</p>
          )}
        </CardContent>
      </Card>

      {/* View Class Students Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Students in {viewingClass?.name}</DialogTitle>
            <DialogDescription>Manage students in this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {viewingClass?.studentDetails && viewingClass.studentDetails.length > 0 ? (
              viewingClass.studentDetails.map((student: any) => (
                <div key={student._id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.grade} • {student.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveStudentFromClass(student._id, viewingClass._id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No students in this class</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Students Dialog */}
      <Dialog open={isAddStudentsDialogOpen} onOpenChange={setIsAddStudentsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Students to {addingStudentsToClass?.name}</DialogTitle>
            <DialogDescription>Select students to add to this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableStudents?.map((student) => (
                <div key={student._id} className="flex items-center space-x-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={selectedStudentsToAdd.includes(student._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentsToAdd([...selectedStudentsToAdd, student._id])
                      } else {
                        setSelectedStudentsToAdd(selectedStudentsToAdd.filter(id => id !== student._id))
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.grade}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleAddStudentsToClass} className="w-full">
              Add Selected Students ({selectedStudentsToAdd.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-class-name">Class Name</Label>
              <Input
                id="edit-class-name"
                value={editClassForm.name}
                onChange={(e) => setEditClassForm({...editClassForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-class-grade">Grade</Label>
              <Select value={editClassForm.grade} onValueChange={(value) => setEditClassForm({...editClassForm, grade: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateClass} className="w-full">
              Update Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}















