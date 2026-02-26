


"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit } from "lucide-react"

export default function AdminTeachersContent() {
  const allTeachers = useQuery(api.teachers.getAllTeachers)
  const updateTeacher = useMutation(api.teachers.updateTeacher)
  const deleteTeacher = useMutation(api.teachers.deleteTeacher)
  const approveTeacher = useMutation(api.teachers.approveTeacher)
  const rejectTeacher = useMutation(api.teachers.rejectTeacher)

  // Teacher editing state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [editTeacherForm, setEditTeacherForm] = useState({ name: "", email: "", subjects: "" })
  
  useEffect(() => {
    console.log("✅ AdminTeachersContent MOUNTED");
  }, []);

  const handleEditTeacher = (teacher: any) => {
    console.log("🔧 EDIT TEACHER CLICKED:", teacher.name);
    setEditingTeacher(teacher)
    setEditTeacherForm({
      name: teacher.name,
      email: teacher.email,
      subjects: (teacher.teacherSubjects || []).join(", ")
    })
    setIsEditDialogOpen(true)
    console.log("🔧 Teacher edit dialog opened with explicit boolean flag");
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return

    try {
      const subjectsArray = editTeacherForm.subjects
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log("=== UPDATING TEACHER ===");
      console.log("Updating teacher:", editingTeacher._id, editTeacherForm, "subjects array:", subjectsArray);
      await updateTeacher({
        teacherId: editingTeacher._id,
        name: editTeacherForm.name,
        email: editTeacherForm.email,
        subjects: subjectsArray
      })
      setIsEditDialogOpen(false)
      setEditingTeacher(null)
      setEditTeacherForm({ name: "", email: "", subjects: "" })
      alert("Teacher updated successfully!")
    } catch (error) {
      console.error("Error updating teacher:", error)
      alert("Error updating teacher: " + (error as Error).message)
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Teachers Management</CardTitle>
          <CardDescription>View and manage teacher accounts. Teachers must register through the teacher portal and await admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {allTeachers && allTeachers.length > 0 ? (
            <div className="space-y-4">
              {allTeachers.map((teacher) => (
                <div key={teacher._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
                    <p className="text-xs text-gray-500">Username: {teacher.username}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={teacher.isApproved ? "default" : "secondary"}>
                        {teacher.isApproved ? "Approved" : "Pending Approval"}
                      </Badge>
                      <Badge variant="outline">Coding Teacher</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!teacher.isApproved && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveTeacher({ teacherId: teacher._id })}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectTeacher({ teacherId: teacher._id })}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTeacher(teacher)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTeacher(teacher._id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No teachers found</p>
              <p className="text-sm text-gray-400">Teachers can register through the teacher portal at /teacher/login</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-teacher-name">Full Name</Label>
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
              <Label htmlFor="edit-teacher-subject">Subjects</Label>
              <Input
                id="edit-teacher-subject"
                value={editTeacherForm.subjects}
                onChange={(e) => setEditTeacherForm({...editTeacherForm, subjects: e.target.value})}
                placeholder="e.g., Coding, Robotics, Python (comma-separated)"
              />
            </div>
            <Button onClick={handleUpdateTeacher} className="w-full">
              Update Teacher
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


