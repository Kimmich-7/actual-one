


"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Trash2, Download, ExternalLink } from "lucide-react"

export default function AdminCurriculumContent() {
  const allCourses = useQuery(api.courses.getAllCourses)
  const curriculum = useQuery(api.curriculum.getAllCurriculum)
  
  const generateUploadUrl = useMutation(api.curriculum.generateUploadUrl)
  const uploadCurriculum = useMutation(api.curriculum.uploadCurriculum)
  const deleteCurriculum = useMutation(api.curriculum.deleteCurriculum)

  const [curriculumForm, setCurriculumForm] = useState({
    title: "",
    description: "",
    courseId: "",
    targetGrades: [] as string[],
    term: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Filter states
  const [filterGrade, setFilterGrade] = useState<string>("")
  const [filterTerm, setFilterTerm] = useState<string>("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadCurriculum = async () => {
    if (!curriculumForm.title || !selectedFile) {
      alert("Please provide a title and select a file")
      return
    }

    setIsUploading(true)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file to storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const { storageId } = await response.json()

      // Create curriculum record
      await uploadCurriculum({
        title: curriculumForm.title,
        description: curriculumForm.description || undefined,
        courseId: curriculumForm.courseId ? (curriculumForm.courseId as Id<"courses">) : undefined,
        fileStorageId: storageId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        targetGrades: curriculumForm.targetGrades.length > 0 ? curriculumForm.targetGrades : undefined,
        term: curriculumForm.term || undefined,
      })

      // Reset form
      setCurriculumForm({
        title: "",
        description: "",
        courseId: "",
        targetGrades: [],
        term: "",
      })
      setSelectedFile(null)
      alert("Curriculum uploaded successfully!")
    } catch (error) {
      console.error("Error uploading curriculum:", error)
      alert("Failed to upload curriculum: " + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCurriculum = async (curriculumId: Id<"curriculum">) => {
    if (!confirm("Are you sure you want to delete this curriculum?")) return

    try {
      await deleteCurriculum({ curriculumId })
      alert("Curriculum deleted successfully!")
    } catch (error) {
      console.error("Error deleting curriculum:", error)
      alert("Failed to delete curriculum: " + (error as Error).message)
    }
  }

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Curriculum Management</CardTitle>
          <CardDescription>Upload and manage curriculum documents for teachers</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Curriculum</TabsTrigger>
          <TabsTrigger value="manage">Manage Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Upload New Curriculum</CardTitle>
              <CardDescription>Upload curriculum documents (PDF, Word, PowerPoint, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="curriculum-title">Title *</Label>
                <Input
                  id="curriculum-title"
                  value={curriculumForm.title}
                  onChange={(e) => setCurriculumForm({...curriculumForm, title: e.target.value})}
                  placeholder="e.g., 'Grade 5 Python Curriculum'"
                />
              </div>

              <div>
                <Label htmlFor="curriculum-description">Description</Label>
                <Textarea
                  id="curriculum-description"
                  value={curriculumForm.description}
                  onChange={(e) => setCurriculumForm({...curriculumForm, description: e.target.value})}
                  placeholder="Brief description of this curriculum"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="curriculum-course">Related Course (Optional)</Label>
                <Select value={curriculumForm.courseId} onValueChange={(value) => setCurriculumForm({...curriculumForm, courseId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses?.map((course) => (
                      <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="curriculum-term">Term</Label>
                <Select value={curriculumForm.term} onValueChange={(value) => setCurriculumForm({...curriculumForm, term: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="curriculum-file">File *</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="curriculum-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, Word, PowerPoint, Excel
                </p>
              </div>

              <Button 
                onClick={handleUploadCurriculum} 
                disabled={isUploading || !curriculumForm.title || !selectedFile}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Curriculum"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Manage Curriculum</CardTitle>
              <CardDescription>View and manage uploaded curriculum documents</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="filter-grade">Filter by Grade</Label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="filter-term">Filter by Term</Label>
                  <Select value={filterTerm} onValueChange={setFilterTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {curriculum && curriculum.length > 0 ? (
                <div className="space-y-4">
                  {curriculum
                    .filter((item) => {
                      if (filterGrade && filterGrade !== "all" && item.targetGrades && !item.targetGrades.includes(filterGrade)) {
                        return false;
                      }
                      if (filterTerm && filterTerm !== "all" && item.term !== filterTerm) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => (
                    <div key={item._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>📎 {item.fileName}</span>
                            <span>📅 {new Date(item.uploadedAt).toLocaleDateString()}</span>
                            {item.term && <span>📚 {item.term}</span>}
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
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCurriculum(item._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">No curriculum uploaded yet</p>
                  <p className="text-gray-500 text-sm mt-2">Upload your first curriculum document to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



