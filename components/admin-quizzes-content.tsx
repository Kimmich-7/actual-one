













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
import { Badge } from "@/components/ui/badge"

export default function AdminQuizzesContent() {
  const allCourses = useQuery(api.courses.getAllCourses)
  const allQuizzesResult = useQuery(api.quizManagement.getAllQuizzesSimple) // Use simple version
  const quizStats = useQuery(api.quizManagement.getQuizStatisticsSimple) // Use simple version
  const createQuiz = useMutation(api.quizManagement.createQuizSimple) // Use simple version
  const addQuestionToQuiz = useMutation(api.quizManagement.addQuestionToQuizSimple) // Use simple version

  // Extract quizzes from the result
  const allQuizzes = allQuizzesResult || []

  // Quiz creation state
  const [quizForm, setQuizForm] = useState({
    courseId: "",
    title: "",
    description: "",
    timeLimit: 30,
    strand: "",
    subStrand: ""
  })
  
  // Fetch strands and sub-strands based on selected course
  const strands = useQuery(
    api.courseNotes.getStrandsByCourse, 
    quizForm.courseId ? { courseId: quizForm.courseId as Id<"courses"> } : "skip"
  )
  const subStrands = useQuery(
    api.courseNotes.getSubStrandsByStrand,
    quizForm.courseId && quizForm.strand 
      ? { courseId: quizForm.courseId as Id<"courses">, strand: quizForm.strand } 
      : "skip"
  )

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

  const handleCreateQuiz = async () => {
    if (!quizForm.courseId || !quizForm.title || !quizForm.description) {
      alert("Please fill in all required fields")
      return
    }

    // Validate that strand and sub-strand are selected
    if (!quizForm.strand || !quizForm.subStrand) {
      alert("Please select both strand and sub-strand. Quizzes must be organized by topics.")
      return
    }

    // Validate that notes exist for this strand/sub-strand
    if (quizForm.courseId && quizForm.strand && (!strands || strands.length === 0)) {
      alert("No notes found for this course. Please upload notes first before creating quizzes.")
      return
    }

    try {
      const result = await createQuiz({
        courseId: quizForm.courseId as Id<"courses">,
        title: quizForm.title,
        description: quizForm.description,
        timeLimit: quizForm.timeLimit,
        strand: quizForm.strand || undefined,
        subStrand: quizForm.subStrand || undefined,
      })
      
      console.log("Quiz creation result:", result)
      
      setQuizForm({
        courseId: "",
        title: "",
        description: "",
        timeLimit: 30,
        strand: "",
        subStrand: ""
      })
      alert("Quiz created successfully!")
    } catch (error) {
      console.error("Error creating quiz:", error)
      alert("Error creating quiz: " + (error as Error).message)
    }
  }

  const handleAddQuestion = async () => {
    if (!questionForm.quizId || !questionForm.question || questionForm.options.some(opt => !opt.trim())) {
      alert("Please fill in all question fields")
      return
    }

    // Get the quiz to find its courseId
    const selectedQuiz = allQuizzes?.find(q => q._id === questionForm.quizId)
    if (!selectedQuiz) {
      alert("Selected quiz not found")
      return
    }

    try {
      const result = await addQuestionToQuiz({
        quizId: questionForm.quizId as Id<"quizzes">,
        courseId: selectedQuiz.courseId,
        question: questionForm.question,
        options: questionForm.options,
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation,
        difficulty: questionForm.difficulty
      })
      
      console.log("Question creation result:", result)
      
      setQuestionForm({
        quizId: questionForm.quizId,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        difficulty: "Easy"
      })
      alert("Question added successfully!")
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Error adding question: " + (error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-700">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800 mb-2">
              {quizStats?.averageScore || 0}%
            </div>
            <p className="text-sm text-emerald-600">School Average Score</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Quiz Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {quizStats?.totalAttempts || 0}
            </div>
            <p className="text-sm text-blue-600">Total Quiz Attempts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700">Active Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 mb-2">
              {quizStats?.totalQuizzes || 0}
            </div>
            <p className="text-sm text-purple-600">Available Quizzes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Quiz</TabsTrigger>
          <TabsTrigger value="questions">Add Questions</TabsTrigger>
          <TabsTrigger value="manage">Manage Quizzes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Create New Quiz</CardTitle>
              <CardDescription>Set up a new quiz for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select value={quizForm.courseId} onValueChange={(value) => setQuizForm({...quizForm, courseId: value})}>
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
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <Label htmlFor="quiz-description">Description</Label>
                <Textarea
                  id="quiz-description"
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                  placeholder="Describe what this quiz covers"
                />
              </div>
              
              <div>
                <Label htmlFor="strand">Strand/Topic</Label>
                <Select value={quizForm.strand} onValueChange={(value) => {
                  setQuizForm({...quizForm, strand: value, subStrand: ""})
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strand or main topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {strands?.map((strand) => (
                      <SelectItem key={strand} value={strand}>{strand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!quizForm.courseId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a course first</p>
                )}
                {quizForm.courseId && (!strands || strands.length === 0) && (
                  <p className="text-xs text-amber-600 mt-1">No notes found. Add course notes first.</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="sub-strand">Sub-Strand/Sub-Topic</Label>
                <Select value={quizForm.subStrand} onValueChange={(value) => setQuizForm({...quizForm, subStrand: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-strand or sub-topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {subStrands?.map((subStrand) => (
                      <SelectItem key={subStrand} value={subStrand}>{subStrand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!quizForm.strand && (
                  <p className="text-xs text-gray-500 mt-1">Please select a strand first</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  value={quizForm.timeLimit}
                  onChange={(e) => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value) || 30})}
                  min="5"
                  max="120"
                />
              </div>
              
              <Button onClick={handleCreateQuiz} className="w-full">
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Add Questions to Quiz</CardTitle>
              <CardDescription>Add multiple choice questions to existing quizzes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="select-quiz">Select Quiz</Label>
                <Select value={questionForm.quizId} onValueChange={(value) => setQuestionForm({...questionForm, quizId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quiz to add questions to" />
                  </SelectTrigger>
                  <SelectContent>
                    {allQuizzes?.map((quiz) => (
                      <SelectItem key={quiz._id} value={quiz._id}>{quiz.title}</SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="question-text">Question</Label>
                <Textarea
                  id="question-text"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                  placeholder="Enter the question"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Answer Options</Label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={questionForm.correctAnswer === index}
                      onChange={() => setQuestionForm({...questionForm, correctAnswer: index})}
                    />
                    <Input
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
              
              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                  placeholder="Explain why this is the correct answer"
                />
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={questionForm.difficulty} onValueChange={(value) => setQuestionForm({...questionForm, difficulty: value})}>
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
              
              <Button onClick={handleAddQuestion} className="w-full">
                Add Question
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">All Quizzes</CardTitle>
              <CardDescription>View and manage existing quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {allQuizzes && allQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {allQuizzes.map((quiz) => (
                    <div key={quiz._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                          <p className="text-sm text-gray-600">{quiz.description}</p>
                          <div className="flex gap-2 mt-2">
                            {quiz.strand && (
                              <Badge variant="outline" className="text-xs">
                                📚 {quiz.strand}
                              </Badge>
                            )}
                            {quiz.subStrand && (
                              <Badge variant="secondary" className="text-xs">
                                📖 {quiz.subStrand}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Time Limit: {quiz.timeLimit} minutes • Questions: {quiz.questions?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No quizzes found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}














