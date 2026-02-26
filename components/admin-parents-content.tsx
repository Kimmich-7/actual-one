


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
import { Trash2, Edit, Users } from "lucide-react"

export default function AdminParentsContent() {
  const allParents = useQuery(api.parents.getAllParents)
  const allClasses = useQuery(api.users.getAllClasses)
  const updateParent = useMutation(api.parents.updateParent)
  const deleteParent = useMutation(api.parents.deleteParent)
  const approveParent = useMutation(api.parents.approveParent)
  const rejectParent = useMutation(api.parents.rejectParent)

  // Parent editing state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingParent, setEditingParent] = useState<any>(null)
  const [editParentForm, setEditParentForm] = useState({ name: "", email: "" })
  const [selectedClass, setSelectedClass] = useState<string>("")
  
  useEffect(() => {
    console.log("✅ AdminParentsContent MOUNTED");
  }, []);

  const handleEditParent = (parent: any) => {
    console.log("🔧 EDIT PARENT CLICKED:", parent.name);
    setEditingParent(parent)
    setEditParentForm({
      name: parent.name,
      email: parent.email
    })
    setIsEditDialogOpen(true)
    console.log("🔧 Parent edit dialog opened with explicit boolean flag");
  }

  const handleUpdateParent = async () => {
    if (!editingParent) return

    try {
      console.log("=== UPDATING PARENT ===");
      console.log("Updating parent:", editingParent._id, editParentForm);
      await updateParent({
        parentId: editingParent._id,
        name: editParentForm.name,
        email: editParentForm.email
      })
      setIsEditDialogOpen(false)
      setEditingParent(null)
      setEditParentForm({ name: "", email: "" })
      alert("Parent updated successfully!")
    } catch (error) {
      console.error("Error updating parent:", error)
      alert("Error updating parent: " + (error as Error).message)
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

  // Group parents by their children's classes
  const groupParentsByClass = () => {
    if (!allParents || !allClasses) return {}
    
    const grouped: { [key: string]: any[] } = {}
    
    allParents.forEach(parent => {
      if (parent.childDetails) {
        const childClass = parent.childDetails.class || parent.childDetails.grade || "Unassigned"
        if (!grouped[childClass]) {
          grouped[childClass] = []
        }
        grouped[childClass].push(parent)
      }
    })
    
    return grouped
  }

  const parentsByClass = groupParentsByClass()

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Parents Management</CardTitle>
          <CardDescription>View and manage parent accounts organized by their children's classes. Parents must register through the parent portal and await admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {allParents && allParents.length > 0 ? (
            <div className="space-y-6">
              {/* Class Filter */}
              <div className="flex items-center space-x-4">
                <Label htmlFor="class-filter">Filter by Class:</Label>
                <select
                  id="class-filter"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Classes</option>
                  {Object.keys(parentsByClass).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Parents grouped by class */}
              {Object.entries(parentsByClass)
                .filter(([className]) => !selectedClass || className === selectedClass)
                .map(([className, parents]) => (
                <div key={className} className="space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{className}</h3>
                    <Badge variant="outline">{parents.length} parent(s)</Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {parents.map((parent) => (
                      <div key={parent._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div>
                          <h4 className="font-semibold text-gray-800">{parent.name}</h4>
                          <p className="text-sm text-gray-600">{parent.email}</p>
                          <p className="text-xs text-gray-500">Username: {parent.username}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={parent.isApproved ? "default" : "secondary"}>
                              {parent.isApproved ? "Approved" : "Pending Approval"}
                            </Badge>
                            {parent.childDetails && (
                              <Badge variant="outline">
                                Child: {parent.childDetails.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!parent.isApproved && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => approveParent({ parentId: parent._id })}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => rejectParent({ parentId: parent._id })}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditParent(parent)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteParent(parent._id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No parents found</p>
              <p className="text-sm text-gray-400">Parents can register through the parent portal at /parent/login</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Parent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription>Update parent information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-parent-name">Full Name</Label>
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
              <Label>Child's Information</Label>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span> {editingParent?.childDetails?.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Username:</span> {editingParent?.childDetails?.username || "Unknown"}
                </p>
                <p className="text-sm text-gray-500 mt-1 text-xs">Child association cannot be changed after registration</p>
              </div>
            </div>
            <Button onClick={handleUpdateParent} className="w-full">
              Update Parent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}











