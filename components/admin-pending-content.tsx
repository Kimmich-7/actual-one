"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminPendingContent() {
  const pendingStudents = useQuery(api.users.getPendingStudents)
  const approveStudent = useMutation(api.users.approveStudent)
  const rejectStudent = useMutation(api.users.rejectStudent)

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Pending Student Approvals</CardTitle>
          <CardDescription>Review and approve new student registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingStudents && pendingStudents.length > 0 ? (
            <div className="space-y-4">
              {pendingStudents.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.grade} • {student.school}</p>
                    <p className="text-xs text-gray-500">Registered: {new Date(student.registrationDate || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => approveStudent({ studentId: student._id })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => rejectStudent({ studentId: student._id })}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No pending students</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}