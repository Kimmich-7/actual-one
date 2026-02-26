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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, Download, Eye, Power, PowerOff, Clock, FileText, CheckCircle, Users, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface QuestionInput {
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

export default function AdminExamContent() {
  // Queries
  const allAssessments = useQuery(api.assessments.getAllAssessments) || []
  const allClasses = useQuery(api.assessments.getAllClasses) || []

  // Mutations
  const createAssessment = useMutation(api.assessments.createAssessment)
  const addMultipleQuestions = useMutation(api.assessments.addMultipleQuestions)
  const toggleActive = useMutation(api.assessments.toggleAssessmentActive)
  const updateTimeLimit = useMutation(api.assessments.updateAssessmentTimeLimit)
  const deleteAssessment = useMutation(api.assessments.deleteAssessment)
  const deleteQuestion = useMutation(api.assessments.deleteQuestion)

  // Form states
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    description: "",
    grade: "",
    term: "",
    className: "",
    timeLimit: 60,
  })

  const [questions, setQuestions] = useState<QuestionInput[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0, points: 1 }
  ])

  const [isCreating, setIsCreating] = useState(false)

  // Filter states
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [filterTerm, setFilterTerm] = useState<string>("all")

  // View/Edit dialog states
  const [viewAssessmentId, setViewAssessmentId] = useState<Id<"assessments"> | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [editTimeLimitId, setEditTimeLimitId] = useState<Id<"assessments"> | null>(null)
  const [newTimeLimit, setNewTimeLimit] = useState(60)
  const [showTimeLimitDialog, setShowTimeLimitDialog] = useState(false)

  // Export dialog
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportGrade, setExportGrade] = useState<string>("all")
  const [exportClass, setExportClass] = useState<string>("all")

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)
  const terms = ["Term 1", "Term 2", "Term 3"]

  // Get assessment details for viewing
  const viewAssessmentDetails = useQuery(
    api.assessments.getAssessmentWithQuestions,
    viewAssessmentId ? { assessmentId: viewAssessmentId } : "skip"
  )

  // Get export data
  const exportData = useQuery(
    api.assessments.exportAssessmentResults,
    showExportDialog ? { 
      grade: exportGrade !== "all" ? exportGrade : undefined,
      className: exportClass !== "all" ? exportClass : undefined 
    } : "skip"
  )

  // Add a new question
  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0, points: 1 }])
  }

  // Remove a question
  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  // Update question field
  const updateQuestion = (index: number, field: keyof QuestionInput, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  // Update option
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuestions(newQuestions)
  }

  // Create assessment with questions
  const handleCreateAssessment = async () => {
    if (!assessmentForm.title || !assessmentForm.grade || !assessmentForm.term) {
      toast.error("Please fill in title, grade, and term")
      return
    }

    // Validate questions
    const validQuestions = questions.filter(q => 
      q.question.trim() && 
      q.options.every(opt => opt.trim()) &&
      q.correctAnswer >= 0 && q.correctAnswer < 4
    )

    if (validQuestions.length === 0) {
      toast.error("Please add at least one complete question")
      return
    }

    setIsCreating(true)
    try {
      // Create assessment
      const assessmentId = await createAssessment({
        title: assessmentForm.title,
        description: assessmentForm.description || undefined,
        grade: assessmentForm.grade,
        term: assessmentForm.term,
        className: assessmentForm.className || undefined,
        timeLimit: assessmentForm.timeLimit,
      })

      // Add questions
      await addMultipleQuestions({
        assessmentId,
        questions: validQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
        })),
      })

      // Reset form
      setAssessmentForm({
        title: "",
        description: "",
        grade: "",
        term: "",
        className: "",
        timeLimit: 60,
      })
      setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0, points: 1 }])

      toast.success("Assessment created successfully!")
    } catch (error) {
      console.error("Error creating assessment:", error)
      toast.error("Failed to create assessment")
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle assessment active status
  const handleToggleActive = async (assessmentId: Id<"assessments">, currentStatus: boolean) => {
    try {
      await toggleActive({ assessmentId, isActive: !currentStatus })
      toast.success(currentStatus ? "Assessment deactivated" : "Assessment activated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    }
  }

  // Update time limit
  const handleUpdateTimeLimit = async () => {
    if (!editTimeLimitId) return
    try {
      await updateTimeLimit({ assessmentId: editTimeLimitId, timeLimit: newTimeLimit })
      toast.success("Time limit updated")
      setShowTimeLimitDialog(false)
    } catch (error) {
      toast.error("Failed to update time limit")
    }
  }

  // Delete assessment
  const handleDeleteAssessment = async (assessmentId: Id<"assessments">) => {
    if (!confirm("Are you sure you want to delete this assessment? This will also delete all student results.")) return
    try {
      await deleteAssessment({ assessmentId })
      toast.success("Assessment deleted")
    } catch (error) {
      toast.error("Failed to delete assessment")
    }
  }

  // Export to CSV
  const handleExport = () => {
    if (!exportData || exportData.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = ["Student Name", "Grade", "Class", "Assessment", "Term", "Correct", "Total Questions", "Points", "Max Points", "Score %", "Time (min)", "Completed"]
    const rows = (exportData as any[]).map((d: any) => [
      d.studentName,
      d.studentGrade,
      d.studentClass,
      d.assessmentTitle,
      d.term,
      d.totalCorrect,
      d.totalQuestions,
      d.pointsEarned,
      d.maxPoints,
      d.score,
      d.timeSpentMinutes,
      d.completedAt
    ])

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assessment_results_${exportGrade}_${exportClass}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Results exported!")
  }

  // Filter assessments
  const filteredAssessments = allAssessments.filter(a => {
    if (filterGrade !== "all" && a.grade !== filterGrade) return false
    if (filterTerm !== "all" && a.term !== filterTerm) return false
    return true
  })

  // Get unique class names
  const classNames = Array.from(new Set(allClasses.map(c => c.name))).sort()

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Assessment Management</CardTitle>
          <CardDescription>Create question-based assessments for students</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Assessment</TabsTrigger>
          <TabsTrigger value="manage">Manage Assessments</TabsTrigger>
          <TabsTrigger value="results">Results & Export</TabsTrigger>
        </TabsList>

        {/* CREATE TAB */}
        <TabsContent value="create">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Create New Assessment</CardTitle>
              <CardDescription>Add questions with multiple choice answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assessment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Assessment Title *</Label>
                  <Input
                    id="title"
                    value={assessmentForm.title}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                    placeholder="e.g., 'Term 1 Computer Skills Assessment'"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={assessmentForm.description}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                    placeholder="Brief description of this assessment"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Grade *</Label>
                  <Select value={assessmentForm.grade} onValueChange={(v) => setAssessmentForm({ ...assessmentForm, grade: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Term *</Label>
                  <Select value={assessmentForm.term} onValueChange={(v) => setAssessmentForm({ ...assessmentForm, term: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class (Optional)</Label>
                  <Select value={assessmentForm.className} onValueChange={(v) => setAssessmentForm({ ...assessmentForm, className: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All classes in grade</SelectItem>
                      {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={assessmentForm.timeLimit}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, timeLimit: parseInt(e.target.value) || 60 })}
                    min={5}
                    max={180}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Questions ({questions.length})</h3>
                  <Button onClick={addQuestion} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="bg-gray-50 border border-gray-200">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <Label>Question {qIndex + 1} *</Label>
                            <Textarea
                              value={q.question}
                              onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                              placeholder="Enter your question"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div>
                              <Label className="text-xs">Points</Label>
                              <Input
                                type="number"
                                value={q.points}
                                onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 1)}
                                min={1}
                                max={10}
                                className="w-16"
                              />
                            </div>
                            {questions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateQuestion(qIndex, "correctAnswer", optIndex)}
                                className="w-4 h-4 text-green-600"
                              />
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className={q.correctAnswer === optIndex ? "border-green-500 bg-green-50" : ""}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">Select the radio button next to the correct answer</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateAssessment}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Assessment"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MANAGE TAB */}
        <TabsContent value="manage">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Manage Assessments</CardTitle>
              <CardDescription>View, activate/deactivate, and manage assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label>Filter by Grade</Label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Filter by Term</Label>
                  <Select value={filterTerm} onValueChange={setFilterTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assessments List */}
              {filteredAssessments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssessments.map((assessment) => (
                    <div key={assessment._id} className={`p-4 border rounded-lg ${assessment.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-800">{assessment.title}</h3>
                            {assessment.isActive ? (
                              <Badge className="bg-green-600">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {assessment.description && (
                            <p className="text-sm text-gray-600 mt-1">{assessment.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline">{assessment.grade}</Badge>
                            <Badge variant="outline">{assessment.term}</Badge>
                            {assessment.className && <Badge variant="outline">{assessment.className}</Badge>}
                            <Badge variant="outline" className="bg-blue-50">
                              <Clock className="w-3 h-3 mr-1" />
                              {assessment.timeLimit} min
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50">
                              {assessment.totalQuestions} questions
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50">
                              {assessment.totalPoints} points
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewAssessmentId(assessment._id)
                              setShowViewDialog(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditTimeLimitId(assessment._id)
                              setNewTimeLimit(assessment.timeLimit)
                              setShowTimeLimitDialog(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={assessment.isActive ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleToggleActive(assessment._id, assessment.isActive)}
                          >
                            {assessment.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAssessment(assessment._id)}
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
                  <p className="text-gray-600 text-lg">No assessments found</p>
                  <p className="text-gray-500 text-sm mt-2">Create your first assessment in the Create tab</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS TAB */}
        <TabsContent value="results">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Results & Export</CardTitle>
              <CardDescription>View and export assessment results by grade or class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label>Filter by Grade</Label>
                  <Select value={exportGrade} onValueChange={setExportGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Filter by Class</Label>
                  <Select value={exportClass} onValueChange={setExportClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => setShowExportDialog(true)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-700">{allAssessments.length}</div>
                    <p className="text-sm text-blue-600">Total Assessments</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-700">
                      {allAssessments.filter(a => a.isActive).length}
                    </div>
                    <p className="text-sm text-green-600">Active Assessments</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-purple-700">
                      {allAssessments.reduce((sum, a) => sum + a.totalQuestions, 0)}
                    </div>
                    <p className="text-sm text-purple-600">Total Questions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Assessment Results Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3">Assessment Overview</h3>
                <div className="space-y-2">
                  {allAssessments.map(a => (
                    <div key={a._id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{a.title}</span>
                        <span className="text-sm text-gray-500 ml-2">({a.grade} - {a.term})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.isActive ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Assessment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewAssessmentDetails?.title}</DialogTitle>
            <DialogDescription>
              {viewAssessmentDetails?.grade} - {viewAssessmentDetails?.term}
              {viewAssessmentDetails?.className && ` - ${viewAssessmentDetails.className}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewAssessmentDetails?.questions?.map((q: any, idx: number) => (
              <Card key={q._id} className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">Q{idx + 1}: {q.question}</span>
                    <Badge variant="outline">{q.points} pts</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div
                        key={optIdx}
                        className={`p-2 rounded border ${optIdx === q.correctAnswer ? 'bg-green-100 border-green-500' : 'bg-white'}`}
                      >
                        {String.fromCharCode(65 + optIdx)}. {opt}
                        {optIdx === q.correctAnswer && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Time Limit Dialog */}
      <Dialog open={showTimeLimitDialog} onOpenChange={setShowTimeLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Limit</DialogTitle>
            <DialogDescription>Set the time limit for this assessment in minutes</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Time Limit (minutes)</Label>
            <Input
              type="number"
              value={newTimeLimit}
              onChange={(e) => setNewTimeLimit(parseInt(e.target.value) || 60)}
              min={5}
              max={180}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeLimitDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateTimeLimit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Assessment Results</DialogTitle>
            <DialogDescription>
              Export results as CSV file for {exportGrade === "all" ? "all grades" : exportGrade}
              {exportClass !== "all" && ` - ${exportClass}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {exportData && exportData.length > 0 ? (
              <p className="text-green-600">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {exportData.length} results ready to export
              </p>
            ) : (
              <p className="text-gray-500">No results found for the selected filters</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onClick={handleExport} disabled={!exportData || exportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
