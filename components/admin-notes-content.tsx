
"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Image as ImageIcon, X } from "lucide-react"

export default function AdminNotesContent() {
  const allCourses = useQuery(api.courses.getAllCourses)
  const [selectedCourse, setSelectedCourse] = useState("")
  const notes = useQuery(
    api.courseNotes.getNotesByCourse,
    selectedCourse ? { courseId: selectedCourse as Id<"courses"> } : "skip"
  )

  const createNote = useMutation(api.courseNotes.createNote)
  const updateNote = useMutation(api.courseNotes.updateNote)
  const deleteNote = useMutation(api.courseNotes.deleteNote)
  const generateUploadUrl = useMutation(api.courseNotes.generateUploadUrl)

  const [noteForm, setNoteForm] = useState({
    courseId: "",
    strand: "",
    subStrand: "",
    title: "",
    content: "",
  })

  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadedImageIds, setUploadedImageIds] = useState<Id<"_storage">[]>([])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const newImageIds: Id<"_storage">[] = []

    try {
      for (const file of Array.from(files)) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl()

        // Upload file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const { storageId } = await response.json()
        newImageIds.push(storageId)
      }

      setUploadedImageIds([...uploadedImageIds, ...newImageIds])
      alert(`${newImageIds.length} image(s) uploaded successfully!`)
    } catch (error) {
      console.error("Image upload error:", error)
      alert("Failed to upload images: " + (error as Error).message)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...uploadedImageIds]
    newImages.splice(index, 1)
    setUploadedImageIds(newImages)
  }

  const handleCreateNote = async () => {
    if (!noteForm.courseId || !noteForm.strand || !noteForm.subStrand || !noteForm.title || !noteForm.content) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await createNote({
        courseId: noteForm.courseId as Id<"courses">,
        strand: noteForm.strand,
        subStrand: noteForm.subStrand,
        title: noteForm.title,
        content: noteForm.content,
        images: uploadedImageIds.length > 0 ? uploadedImageIds : undefined,
      })

      setNoteForm({
        courseId: "",
        strand: "",
        subStrand: "",
        title: "",
        content: "",
      })
      setUploadedImageIds([])
      alert("Note created successfully!")
    } catch (error) {
      console.error("Error creating note:", error)
      alert("Error creating note: " + (error as Error).message)
    }
  }

  const handleDeleteNote = async (noteId: Id<"courseNotes">) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      await deleteNote({ noteId })
      alert("Note deleted successfully!")
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Error deleting note: " + (error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Course Notes Management</CardTitle>
          <CardDescription>Create and manage notes with strands and sub-strands for students</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Note</TabsTrigger>
          <TabsTrigger value="manage">Manage Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Create New Note</CardTitle>
              <CardDescription>Add educational content organized by strand and sub-strand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="note-course">Course</Label>
                <Select value={noteForm.courseId} onValueChange={(value) => setNoteForm({...noteForm, courseId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses?.map((course) => (
                      <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="note-strand">Strand/Topic</Label>
                <Input
                  id="note-strand"
                  value={noteForm.strand}
                  onChange={(e) => setNoteForm({...noteForm, strand: e.target.value})}
                  placeholder="e.g., 'Introduction to Python'"
                />
              </div>

              <div>
                <Label htmlFor="note-sub-strand">Sub-Strand/Sub-Topic</Label>
                <Input
                  id="note-sub-strand"
                  value={noteForm.subStrand}
                  onChange={(e) => setNoteForm({...noteForm, subStrand: e.target.value})}
                  placeholder="e.g., 'Variables and Data Types'"
                />
              </div>

              <div>
                <Label htmlFor="note-title">Note Title</Label>
                <Input
                  id="note-title"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                  placeholder="Enter note title"
                />
              </div>

              <div>
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                  placeholder="Enter the note content (supports basic formatting)"
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="note-images">Images (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="note-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="flex-1"
                  />
                  <Button type="button" disabled={uploadingImages} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImages ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                {uploadedImageIds.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {uploadedImageIds.map((id, index) => (
                      <div key={index} className="relative inline-block">
                        <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleCreateNote} className="w-full">
                Create Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Manage Notes</CardTitle>
              <CardDescription>View and manage existing course notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="filter-course">Filter by Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course to view notes" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses?.map((course) => (
                      <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourse && notes && notes.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {notes.map((note) => (
                    <div key={note._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{note.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Strand:</span> {note.strand} → <span className="font-medium">Sub-Strand:</span> {note.subStrand}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">{note.content.substring(0, 150)}...</p>
                          {note.images && note.images.length > 0 && (
                            <p className="text-xs text-blue-600 mt-2">📷 {note.images.length} image(s) attached</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNote(note._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedCourse ? (
                <p className="text-gray-500 text-center py-8">No notes found for this course</p>
              ) : (
                <p className="text-gray-500 text-center py-8">Select a course to view notes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

